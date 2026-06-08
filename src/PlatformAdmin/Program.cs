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

// Chatbot Double-Guardrail and ShellScope DI registrations
builder.Services.AddSingleton(typeof(IElasticSearchRepository<>), typeof(ElasticSearchRepository<>));
builder.Services.AddSingleton<IShellScopeFactory, ShellScopeFactory>();
builder.Services.AddHttpClient<IGeminiService, GeminiService>();
builder.Services.AddHostedService<PlagiarismQueueConsumer>();

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

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
                }
                catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD Major NVARCHAR(500);"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD Subject NVARCHAR(500);"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD SubjectCode NVARCHAR(100);"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD Category NVARCHAR(50) DEFAULT 'Project';"); } catch { }
                try {
                    context.Database.ExecuteSqlRaw(@"
                        UPDATE Theses 
                        SET Category = 'Project', Major = 'ai', Subject = N'Phát triển ứng dụng trí tuệ nhân tạo', SubjectCode = 'ITE1174E'
                        WHERE Id = 2 AND (Major IS NULL OR Major = '');
                    ");
                    context.Database.ExecuteSqlRaw(@"
                        UPDATE Theses 
                        SET Category = 'Thesis', Major = 'ai'
                        WHERE Id = 1 AND (Major IS NULL OR Major = '');
                    ");
                    context.Database.ExecuteSqlRaw(@"
                        UPDATE Theses 
                        SET Category = 'Topic', Major = 'networking'
                        WHERE Id = 3 AND (Major IS NULL OR Major = '');
                    ");
                } catch {}
                context.Database.ExecuteSqlRaw(@"
                    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PlagiarismReports' AND xtype='U')
                    BEGIN
                        CREATE TABLE PlagiarismReports (
                            Id INT IDENTITY(1,1) PRIMARY KEY,
                            ThesisId INT NOT NULL FOREIGN KEY REFERENCES Theses(Id) ON DELETE CASCADE,
                            SimilarityPercentage FLOAT NOT NULL,
                            ReportJson NVARCHAR(MAX) NOT NULL,
                            CheckedAt DATETIME NOT NULL
                        );
                    END");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Could not manually verify PlagiarismReports table or columns: {ex.Message}");
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
    // Allow unauthenticated access in development
    Authorization = new[] { new Hangfire.Dashboard.LocalRequestsOnlyAuthorizationFilter() }
});

// Register recurring job: sync Drive files every 1 minute
RecurringJob.AddOrUpdate<DriveSyncJob>(
    "drive-sync-temporary-pdf",
    job => job.SyncTemporaryPdfAsync(),
    "*/1 * * * *"  // Every 1 minute
);

Console.WriteLine("🚀 Hangfire is running! Dashboard: http://localhost:5145/hangfire");
Console.WriteLine("🔄 DriveSyncJob scheduled: every 1 minute (Temporary_PDF → Database)");

app.Run();
