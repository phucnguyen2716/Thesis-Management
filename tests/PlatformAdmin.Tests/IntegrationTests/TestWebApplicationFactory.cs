using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Moq;
using PlatformAdmin.Data;
using PlatformAdmin.Interfaces;
using PlatformAdmin.Services;
using PlatformAdmin.Entities;
using BuildingBlocks.SharedContracts;
using Hangfire;

namespace PlatformAdmin.Tests.IntegrationTests;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    public SqliteConnection Connection { get; }
    public Mock<IGoogleDriveStorageService> MockDriveService { get; } = new();
    public Mock<ICloudinaryService> MockCloudinaryService { get; } = new();
    public Mock<IGeminiService> MockGeminiService { get; } = new();

    public TestWebApplicationFactory()
    {
        Connection = new SqliteConnection("DataSource=:memory:");
        Connection.Open();
        using (var cmd = Connection.CreateCommand())
        {
            cmd.CommandText = "PRAGMA busy_timeout = 5000;";
            cmd.ExecuteNonQuery();
        }

        // Setup MockDriveService to return empty lists to prevent NullReferenceExceptions during sync jobs
        MockDriveService.Setup(x => x.ListAcademicFilesRecursiveAsync(It.IsAny<AcademicCategory>()))
            .ReturnsAsync(new List<DriveFileInfo>());
        MockDriveService.Setup(x => x.ListCourseProjectFilesRecursiveAsync())
            .ReturnsAsync(new List<DriveFileInfo>());
        MockDriveService.Setup(x => x.ListFilesFromFolderAsync(It.IsAny<string>(), It.IsAny<AcademicCategory>()))
            .ReturnsAsync(new List<DriveFileInfo>());
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // 1. Setup in-memory config overrides
        builder.ConfigureAppConfiguration((ctx, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:Provider"] = "sqlite",
                ["Jwt:Issuer"] = "eThesisTest",
                ["Jwt:Audience"] = "eThesisTestUsers",
                ["Jwt:Key"] = "SuperSecretTestKeyThatIsVeryLong12345!" // Must be >= 256 bits
            });
        });

        // 2. Override services in DI container
        builder.ConfigureServices(services =>
        {
            // Remove real DbContext registration
            var dbContextDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (dbContextDescriptor != null) services.Remove(dbContextDescriptor);

            // Register DbContext with our persistent SQLite connection
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseSqlite(Connection);
            });

            // Replace Mock Services
            services.Remove(services.Single(d => d.ServiceType == typeof(IGoogleDriveStorageService)));
            services.AddSingleton<IGoogleDriveStorageService>(MockDriveService.Object);

            services.Remove(services.Single(d => d.ServiceType == typeof(ICloudinaryService)));
            services.AddSingleton<ICloudinaryService>(MockCloudinaryService.Object);

            services.Remove(services.Single(d => d.ServiceType == typeof(IGeminiService)));
            services.AddSingleton<IGeminiService>(MockGeminiService.Object);

            var esDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IElasticSearchRepository<PlagiarismDocument>));
            if (esDescriptor != null) services.Remove(esDescriptor);
            services.AddSingleton<IElasticSearchRepository<PlagiarismDocument>>(new Mock<IElasticSearchRepository<PlagiarismDocument>>().Object);

            var esChatDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IElasticSearchRepository<ChatHistoryModel>));
            if (esChatDescriptor != null) services.Remove(esChatDescriptor);
            services.AddSingleton<IElasticSearchRepository<ChatHistoryModel>>(new Mock<IElasticSearchRepository<ChatHistoryModel>>().Object);

            var plagDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IPlagiarismService));
            if (plagDescriptor != null) services.Remove(plagDescriptor);
            services.AddSingleton<IPlagiarismService>(new Mock<IPlagiarismService>().Object);

            var pdfDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(ILibreOfficePdfConverter));
            if (pdfDescriptor != null) services.Remove(pdfDescriptor);
            services.AddSingleton<ILibreOfficePdfConverter>(new Mock<ILibreOfficePdfConverter>().Object);

            // Remove background hosted services to isolate testing environment
            var plagiarismHostedService = services.SingleOrDefault(d => d.ImplementationType?.Name == "PlagiarismQueueConsumer");
            if (plagiarismHostedService != null) services.Remove(plagiarismHostedService);

            var driveSyncHostedService = services.SingleOrDefault(d => d.ImplementationType?.Name == "DriveSyncSchedulerService");
            if (driveSyncHostedService != null) services.Remove(driveSyncHostedService);

            // Remove Hangfire hosted service/server if present
            var hangfireHostedServices = services.Where(d => d.ServiceType == typeof(IHostedService) && d.ImplementationType?.Name.Contains("Hangfire") == true).ToList();
            foreach (var hs in hangfireHostedServices) services.Remove(hs);

            // Mock Hangfire JobStorage to avoid SQL failures on Postgres
            var hangfireStorageDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(JobStorage));
            if (hangfireStorageDescriptor != null) services.Remove(hangfireStorageDescriptor);

            var mockJobStorage = new Mock<JobStorage>();
            var mockStorageConnection = new Mock<Hangfire.Storage.IStorageConnection>();
            var mockTransaction = new Mock<Hangfire.Storage.IWriteOnlyTransaction>();
            mockJobStorage.Setup(x => x.GetConnection()).Returns(mockStorageConnection.Object);
            mockStorageConnection.Setup(x => x.CreateWriteTransaction()).Returns(mockTransaction.Object);
            services.AddSingleton<JobStorage>(mockJobStorage.Object);
        });
    }

    public string GenerateJwtToken(string userId, string role, string username = "TestUser")
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes("SuperSecretTestKeyThatIsVeryLong12345!");
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.Name, username)
            }),
            Expires = DateTime.UtcNow.AddHours(2),
            Issuer = "eThesisTest",
            Audience = "eThesisTestUsers",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public async Task ClearDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        db.ThesisComments.RemoveRange(db.ThesisComments);
        db.ThesisReviews.RemoveRange(db.ThesisReviews);
        db.Theses.RemoveRange(db.Theses);
        db.Users.RemoveRange(db.Users.Where(u => u.Id > 3));
        
        await db.SaveChangesAsync();
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            Connection.Dispose();
        }
        base.Dispose(disposing);
    }
}
