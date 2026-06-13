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

// Load local secrets if present
builder.Configuration.AddJsonFile("appsettings.local.json", optional: true, reloadOnChange: true);
builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: true, reloadOnChange: true);

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
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
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
                context.Database.ExecuteSqlRaw(@"ALTER TABLE ""SocialPosts"" ADD COLUMN IF NOT EXISTS ""CloudinaryStatus"" VARCHAR(50) DEFAULT 'None';");
            }
            else
            {
                try { context.Database.ExecuteSqlRaw("ALTER TABLE ChatHistory ADD UserId INT;"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD Major NVARCHAR(500);"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD Subject NVARCHAR(500);"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD SubjectCode NVARCHAR(100);"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD Category NVARCHAR(50) DEFAULT 'Project';"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE SocialPosts ADD CloudinaryStatus NVARCHAR(50) DEFAULT 'None';"); } catch { }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Could not run DB migrations: {ex.Message}");
        }

        Console.WriteLine("Database initialized and seeded successfully.");

        try
        {
            // Reset categories containing "Tin má»›i" to "Tin mới"
            var corruptedPosts = context.SocialPosts.Where(p => p.Category == "Tin má»›i" || p.Category.Contains("má»›i")).ToList();
            foreach (var cp in corruptedPosts)
            {
                cp.Category = "Tin mới";
            }
            if (corruptedPosts.Any())
            {
                context.SaveChanges();
                Console.WriteLine($"Corrected category encoding for {corruptedPosts.Count} posts.");
            }

            // Update posts 1, 2, 3 with real image URLs if they still have the googleusercontent ones or empty
            var post1 = context.SocialPosts.Find(1);
            if (post1 != null && (post1.Image.Contains("googleusercontent.com") || post1.Image.Contains("photo-1523050854058-8df90110c9f1") || string.IsNullOrEmpty(post1.Image)))
            {
                post1.Image = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4";
                post1.CloudinaryStatus = "None";
            }

            var post2 = context.SocialPosts.Find(2);
            if (post2 != null && (post2.Image.Contains("googleusercontent.com") || string.IsNullOrEmpty(post2.Image)))
            {
                post2.Image = "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop";
                post2.CloudinaryStatus = "None";
            }

            var post3 = context.SocialPosts.Find(3);
            if (post3 != null && (post3.Image.Contains("googleusercontent.com") || string.IsNullOrEmpty(post3.Image)))
            {
                post3.Image = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop";
                post3.CloudinaryStatus = "None";
            }

            context.SaveChanges();

            // Enqueue all Pending / None / Failed posts to Cloudinary
            var socialPosts = context.SocialPosts
                .Where(p => (p.CloudinaryStatus == "None" || p.CloudinaryStatus == "Failed" || p.CloudinaryStatus == "Pending") && !string.IsNullOrEmpty(p.Image))
                .ToList();

            if (socialPosts.Any())
            {
                Console.WriteLine($"Found {socialPosts.Count} posts to push to Cloudinary. Enqueuing Hangfire jobs...");
                foreach (var post in socialPosts)
                {
                    post.CloudinaryStatus = "Pending";
                }
                context.SaveChanges();

                var jobClient = services.GetRequiredService<IBackgroundJobClient>();
                foreach (var post in socialPosts)
                {
                    jobClient.Enqueue<ISocialService>(s => s.UploadPostImageToCloudinaryAsync(post.Id));
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error updating posts/enqueuing Cloudinary jobs: {ex.Message}");
        }
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

// Auto-seed default major images to Cloudinary
_ = Task.Run(async () =>
{
    await Task.Delay(5000);
    try
    {
        using var scope = app.Services.CreateScope();
        var cloudinaryService = scope.ServiceProvider.GetRequiredService<ICloudinaryService>();
        
        var defaultImages = new Dictionary<string, string>
        {
            { "ai_1", "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800" },
            { "ai_2", "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800" },
            { "ai_3", "https://images.unsplash.com/photo-1507146426996-ef05306b995a?q=80&w=800" },

            { "networking_1", "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800" },
            { "networking_2", "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800" },
            { "networking_3", "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=800" },

            { "is_1", "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800" },
            { "is_2", "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800" },
            { "is_3", "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=800" },

            { "security_1", "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800" },
            { "security_2", "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800" },
            { "security_3", "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=800" },

            { "software-engineering_1", "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800" },
            { "software-engineering_2", "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=800" },
            { "software-engineering_3", "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800" },

            { "programming_1", "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800" },
            { "programming_2", "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800" },
            { "programming_3", "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800" },

            { "general_1", "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=800" },
            { "general_2", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800" },
            { "general_3", "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800" }
        };

        Console.WriteLine("☁️ Cloudinary: Starting default major images seeding...");
        foreach (var kvp in defaultImages)
        {
            try
            {
                var result = await cloudinaryService.UploadImageFromUrlAsync(kvp.Value, "thesis", $"{kvp.Key}.jpg");
                if (result.Success)
                {
                    Console.WriteLine($"☁️ Cloudinary: Seeded default image for '{kvp.Key}' -> {result.SecureUrl}");
                }
                else
                {
                    Console.WriteLine($"☁️ Cloudinary WARNING: Failed to seed default image for '{kvp.Key}': {result.ErrorMessage}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"☁️ Cloudinary ERROR seeding '{kvp.Key}': {ex.Message}");
            }
        }
        Console.WriteLine("☁️ Cloudinary: Completed default major images seeding.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Cloudinary seeder failed to initialize: {ex.Message}");
    }
});

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
