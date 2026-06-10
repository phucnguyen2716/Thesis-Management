using System.Text;
using PlatformAdmin.Interfaces;
using PlatformAdmin.Data;
using PlatformAdmin.Services;
using PlatformAdmin.Jobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using BuildingBlocks.SharedContracts;
using BuildingBlocks.SharedContracts.ShellScope;
using PlatformAdmin.Entities;
using Hangfire;
using Hangfire.PostgreSql;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger Configuration
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "eThesis API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var provider = builder.Configuration["Database:Provider"]?.Trim().ToLowerInvariant();
    if (provider == "postgresql" || provider == "postgres")
    {
        options.UseNpgsql(builder.Configuration.GetConnectionString("PostgreSqlConnection"));
    }
    else if (provider == "sqlite")
    {
        options.UseSqlite(builder.Configuration.GetConnectionString("SqliteConnection"));
    }
    else
    {
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
    }
});

// Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

// Dependency Injection
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IThesisService, ThesisService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<ISocialService, SocialService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddSingleton<IGoogleDriveStorageService, GoogleDriveStorageService>();
builder.Services.AddSingleton<ILibreOfficePdfConverter, LibreOfficePdfConverter>();
builder.Services.AddSingleton<IDriveSampleDataSeeder, DriveSampleDataSeeder>();
builder.Services.AddHttpClient();

// Chatbot Double-Guardrail and ShellScope DI registrations
builder.Services.AddSingleton(typeof(IElasticSearchRepository<>), typeof(ElasticSearchRepository<>));
builder.Services.AddSingleton<IShellScopeFactory, ShellScopeFactory>();
builder.Services.AddHttpClient<IGeminiService, GeminiService>();
builder.Services.AddHostedService<PlagiarismQueueConsumer>();
builder.Services.AddHostedService<DriveSyncSchedulerService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Hangfire — Background Job Processing
var hangfireConnStr = builder.Configuration.GetConnectionString("PostgreSqlConnection");
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(options => options.UseNpgsqlConnection(hangfireConnStr))
);
builder.Services.AddHangfireServer();

// Register DriveSyncJob
builder.Services.AddTransient<DriveSyncJob>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// Serve static files (uploads)
var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadPath),
    RequestPath = "/uploads"
});

var tempPdfPath = Path.Combine(Directory.GetCurrentDirectory(), builder.Configuration["GoogleDrive:TemporaryPdfLocalPath"] ?? "temporary_pdf");
if (!Directory.Exists(tempPdfPath)) Directory.CreateDirectory(tempPdfPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(tempPdfPath),
    RequestPath = "/temporary_pdf"
});

// Database initialization & migrations
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();

        try
        {
            var provider = builder.Configuration["Database:Provider"]?.Trim().ToLowerInvariant();
            if (provider == "postgresql" || provider == "postgres")
            {
                context.Database.ExecuteSqlRaw("ALTER TABLE \"ChatHistory\" ADD COLUMN IF NOT EXISTS \"UserId\" INTEGER;");
                context.Database.ExecuteSqlRaw("ALTER TABLE \"Theses\" ADD COLUMN IF NOT EXISTS \"Major\" VARCHAR(500);");
                context.Database.ExecuteSqlRaw("ALTER TABLE \"Theses\" ADD COLUMN IF NOT EXISTS \"Subject\" VARCHAR(500);");
                context.Database.ExecuteSqlRaw("ALTER TABLE \"Theses\" ADD COLUMN IF NOT EXISTS \"SubjectCode\" VARCHAR(100);");
                context.Database.ExecuteSqlRaw("ALTER TABLE \"Theses\" ADD COLUMN IF NOT EXISTS \"Category\" VARCHAR(50) DEFAULT 'Project';");
                context.Database.ExecuteSqlRaw(@"UPDATE ""Theses"" SET ""Category"" = 'Project', ""Major"" = 'ai', ""Subject"" = 'Phát triển ứng dụng trí tuệ nhân tạo', ""SubjectCode"" = 'ITE1174E' WHERE ""Id"" = 2 AND (""Major"" IS NULL OR ""Major"" = '');");
                context.Database.ExecuteSqlRaw(@"UPDATE ""Theses"" SET ""Category"" = 'Thesis', ""Major"" = 'ai' WHERE ""Id"" = 1 AND (""Major"" IS NULL OR ""Major"" = '');");
                context.Database.ExecuteSqlRaw(@"UPDATE ""Theses"" SET ""Category"" = 'Topic', ""Major"" = 'networking' WHERE ""Id"" = 3 AND (""Major"" IS NULL OR ""Major"" = '');");
                context.Database.ExecuteSqlRaw(@"
                    CREATE TABLE IF NOT EXISTS ""PlagiarismReports"" (
                        ""Id"" SERIAL PRIMARY KEY,
                        ""ThesisId"" INTEGER NOT NULL REFERENCES ""Theses""(""Id"") ON DELETE CASCADE,
                        ""SimilarityPercentage"" DOUBLE PRECISION NOT NULL,
                        ""ReportJson"" TEXT NOT NULL,
                        ""CheckedAt"" TIMESTAMP WITHOUT TIME ZONE NOT NULL
                    );");
                context.Database.ExecuteSqlRaw(@"
                    CREATE TABLE IF NOT EXISTS ""DriveFileRecords"" (
                        ""Id"" SERIAL PRIMARY KEY,
                        ""DriveFileId"" VARCHAR(500) NOT NULL,
                        ""FileName"" VARCHAR(1000) NOT NULL,
                        ""MimeType"" VARCHAR(200) NOT NULL DEFAULT '',
                        ""FileSize"" BIGINT,
                        ""WebViewLink"" VARCHAR(2000) NOT NULL DEFAULT '',
                        ""WebContentLink"" VARCHAR(2000) NOT NULL DEFAULT '',
                        ""SourceFolder"" VARCHAR(500) NOT NULL DEFAULT '',
                        ""Category"" VARCHAR(50) NOT NULL DEFAULT 'Project',
                        ""DriveCreatedAt"" TIMESTAMP WITHOUT TIME ZONE,
                        ""DriveModifiedAt"" TIMESTAMP WITHOUT TIME ZONE,
                        ""SyncedAt"" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
                        ""LastCheckedAt"" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
                        ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE
                    );");
                context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""RelativePath"" VARCHAR(2000) NOT NULL DEFAULT '';");
                context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""Major"" VARCHAR(500) NOT NULL DEFAULT '';");
                context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""MajorKey"" VARCHAR(100) NOT NULL DEFAULT '';");
                context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""Subject"" VARCHAR(500) NOT NULL DEFAULT '';");
                context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""SubjectCode"" VARCHAR(100) NOT NULL DEFAULT '';");
                context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""StudentUid"" VARCHAR(100) NOT NULL DEFAULT '';");
                context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""ProjectName"" VARCHAR(1000) NOT NULL DEFAULT '';");
                context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""LocalPdfPath"" VARCHAR(2000) NOT NULL DEFAULT '';");
            }
            else
            {
                try { context.Database.ExecuteSqlRaw("ALTER TABLE ChatHistory ADD UserId INT;"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD Major NVARCHAR(500);"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD Subject NVARCHAR(500);"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD SubjectCode NVARCHAR(100);"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD Category NVARCHAR(50) DEFAULT 'Project';"); } catch { }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Could not run DB migrations: {ex.Message}");
        }

        Console.WriteLine("Database initialized and seeded successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"An error occurred seeding the DB: {ex.Message}");
    }
}

app.MapControllers();

// Hangfire Dashboard (accessible at /hangfire)
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new Hangfire.Dashboard.LocalRequestsOnlyAuthorizationFilter() }
});

// Register recurring job: sync Drive files every 1 minute
RecurringJob.AddOrUpdate<DriveSyncJob>(
    "drive-sync-all",
    job => job.SyncAllAsync(),
    "*/1 * * * *"
);

// Auto-seed Google Drive sample data on startup (nếu Drive chưa có file)
_ = Task.Run(async () =>
{
    await Task.Delay(3000);
    try
    {
        using var scope = app.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<IDriveSampleDataSeeder>();
        var syncJob = scope.ServiceProvider.GetRequiredService<DriveSyncJob>();
        var result = await seeder.GenerateSampleDataAsync(force: false);
        Console.WriteLine($"📁 Drive auto-seed: {result.Message} (uploaded={result.Uploaded}, failed={result.Failed})");
        await syncJob.SyncAllAsync();
        Console.WriteLine("✅ Drive initial sync completed.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Drive auto-seed failed: {ex.Message}");
    }
});

Console.WriteLine("🚀 Hangfire: http://localhost:5145/hangfire");
Console.WriteLine("🔄 DriveSyncJob: every 10 seconds (Google Drive → DB → API → Frontend)");
Console.WriteLine("❤️  Health: http://localhost:5145/api/health/dependencies");

app.Run();
