using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using PlatformAdmin.Data;
using PlatformAdmin.DTOs.Auth;
using PlatformAdmin.Entities;
using PlatformAdmin.Services;
using Xunit;

namespace PlatformAdmin.Tests.UnitTests.Services;

public class AuthServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<AppDbContext> _dbContextOptions;
    private readonly Mock<IConfiguration> _mockConfig;

    public AuthServiceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        _dbContextOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        using (var context = new AppDbContext(_dbContextOptions))
        {
            context.Database.EnsureCreated();
        }

        _mockConfig = new Mock<IConfiguration>();
        _mockConfig.Setup(x => x["Jwt:Key"]).Returns("SuperSecretTestKeyThatIsVeryLong12345!");
        _mockConfig.Setup(x => x["Jwt:Issuer"]).Returns("eThesisTest");
        _mockConfig.Setup(x => x["Jwt:Audience"]).Returns("eThesisTestUsers");
    }

    public void Dispose()
    {
        _connection.Dispose();
    }

    private AppDbContext CreateContext() => new AppDbContext(_dbContextOptions);

    [Fact]
    public async Task RegisterAsync_ValidRequest_RegistersUserSuccessfully()
    {
        using var context = CreateContext();
        var request = new RegisterRequest(
            FullName: "Nguyễn Văn A",
            Email: "nva@ethesis.edu.vn",
            Password: "SecurePassword123",
            Role: "Student",
            StudentId: "SV01",
            Department: "CNTT"
        );

        var service = new AuthService(context, _mockConfig.Object);
        var result = await service.RegisterAsync(request);

        Assert.NotNull(result);
        Assert.Equal(request.FullName, result.FullName);
        Assert.Equal(request.Email, result.Email);

        var dbUser = await context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        Assert.NotNull(dbUser);
        Assert.Equal("Student", dbUser.Role);
    }

    [Fact]
    public async Task RegisterAsync_DuplicateEmail_ThrowsInvalidOperationException()
    {
        using var context = CreateContext();
        var existingUser = new User
        {
            Id = 10,
            FullName = "Existing User",
            Email = "nva@ethesis.edu.vn",
            PasswordHash = "hash",
            Role = "Student",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(existingUser);
        await context.SaveChangesAsync();

        var request = new RegisterRequest(
            FullName: "Nguyễn Văn A",
            Email: "nva@ethesis.edu.vn",
            Password: "SecurePassword123",
            Role: "Student",
            StudentId: "SV01",
            Department: "CNTT"
        );

        var service = new AuthService(context, _mockConfig.Object);
        await Assert.ThrowsAsync<InvalidOperationException>(async () => await service.RegisterAsync(request));
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsLoginResponse()
    {
        using var context = CreateContext();
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Password123");
        var user = new User
        {
            Id = 20,
            FullName = "Test User",
            Email = "testuser@ethesis.edu.vn",
            PasswordHash = passwordHash,
            Role = "Student",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var request = new LoginRequest(Email: "testuser@ethesis.edu.vn", Password: "Password123");
        var service = new AuthService(context, _mockConfig.Object);
        var result = await service.LoginAsync(request);

        Assert.NotNull(result);
        Assert.Equal("testuser@ethesis.edu.vn", result.Email);
        Assert.NotNull(result.Token);
    }

    [Fact]
    public async Task LoginAsync_InvalidEmail_ThrowsUnauthorizedAccessException()
    {
        using var context = CreateContext();
        var request = new LoginRequest(Email: "wrongemail@ethesis.edu.vn", Password: "Password123");
        var service = new AuthService(context, _mockConfig.Object);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () => await service.LoginAsync(request));
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ThrowsUnauthorizedAccessException()
    {
        using var context = CreateContext();
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Password123");
        var user = new User
        {
            Id = 30,
            FullName = "Test User",
            Email = "testuser@ethesis.edu.vn",
            PasswordHash = passwordHash,
            Role = "Student",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var request = new LoginRequest(Email: "testuser@ethesis.edu.vn", Password: "WrongPassword");
        var service = new AuthService(context, _mockConfig.Object);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () => await service.LoginAsync(request));
    }

    [Fact]
    public async Task LoginAsync_InactiveUser_ThrowsUnauthorizedAccessException()
    {
        using var context = CreateContext();
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Password123");
        var user = new User
        {
            Id = 40,
            FullName = "Inactive User",
            Email = "inactive@ethesis.edu.vn",
            PasswordHash = passwordHash,
            Role = "Student",
            IsActive = false,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var request = new LoginRequest(Email: "inactive@ethesis.edu.vn", Password: "Password123");
        var service = new AuthService(context, _mockConfig.Object);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () => await service.LoginAsync(request));
    }

    [Fact]
    public async Task LoginWithGoogleInfoAsync_ExistingAdminUser_LinksGoogleAccount()
    {
        using var context = CreateContext();
        // The default seeder in AppDbContext creates Admin user at Id = 1.
        // Let's modify or fetch that admin user.
        var admin = await context.Users.FindAsync(1);
        Assert.NotNull(admin);

        var service = new AuthService(context, _mockConfig.Object);
        var result = await service.LoginWithGoogleInfoAsync(admin.Email, "New Admin Name");

        Assert.NotNull(result);
        Assert.Equal("Admin", result.Role);
        
        var dbAdmin = await context.Users.FindAsync(1);
        Assert.Equal("New Admin Name", dbAdmin.FullName);
    }

    [Theory]
    [InlineData("Name 1", "email1@ethesis.edu.vn", "pw1", "Student", "S01")]
    [InlineData("Name 2", "email2@ethesis.edu.vn", "pw2", "Student", "S02")]
    [InlineData("Name 3", "email3@ethesis.edu.vn", "pw3", "Advisor", null)]
    [InlineData("Name 4", "email4@ethesis.edu.vn", "pw4", "Advisor", null)]
    [InlineData("Name 5", "email5@ethesis.edu.vn", "pw5", "Admin", null)]
    [InlineData("Name 6", "email6@ethesis.edu.vn", "pw6", "Student", "S06")]
    [InlineData("Name 7", "email7@ethesis.edu.vn", "pw7", "Student", "S07")]
    [InlineData("Name 8", "email8@ethesis.edu.vn", "pw8", "Student", "S08")]
    [InlineData("Name 9", "email9@ethesis.edu.vn", "pw9", "Student", "S09")]
    [InlineData("Name 10", "email10@ethesis.edu.vn", "pw10", "Student", "S10")]
    [InlineData("Name 11", "email11@ethesis.edu.vn", "pw11", "Student", "S11")]
    [InlineData("Name 12", "email12@ethesis.edu.vn", "pw12", "Student", "S12")]
    [InlineData("Name 13", "email13@ethesis.edu.vn", "pw13", "Student", "S13")]
    public async Task RegisterAsync_VariousInputs_RegistersSuccessfully(
        string name, string email, string pw, string role, string? studentId)
    {
        using var context = CreateContext();
        var request = new RegisterRequest(
            FullName: name,
            Email: email,
            Password: pw,
            Role: role,
            StudentId: studentId,
            Department: "Science"
        );

        var service = new AuthService(context, _mockConfig.Object);
        var result = await service.RegisterAsync(request);

        Assert.NotNull(result);
        Assert.Equal(email, result.Email);
    }
}
