using System.Text;
using Microsoft.AspNetCore.SignalR;
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

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
var builder = WebApplication.CreateBuilder(args);

// Load local secrets if present
builder.Configuration.AddJsonFile("appsettings.local.json", optional: true, reloadOnChange: true);
builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: true, reloadOnChange: true);

// Create google-credentials.json dynamically from environment variables on Render
var googleCredsJson = builder.Configuration["GoogleDrive:CredentialsJson"];
if (!string.IsNullOrEmpty(googleCredsJson))
{
    try
    {
        var targetFile = Path.Combine(Directory.GetCurrentDirectory(), "google-credentials.json");
        File.WriteAllText(targetFile, googleCredsJson);
        Console.WriteLine("🔑 Dynamically created 'google-credentials.json' from environment variable.");
        
        var baseDirFile = Path.Combine(AppContext.BaseDirectory, "google-credentials.json");
        if (baseDirFile != targetFile)
        {
            File.WriteAllText(baseDirFile, googleCredsJson);
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Failed to write dynamic Google credentials file: {ex.Message}");
    }
}

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
        var rawConn = builder.Configuration.GetConnectionString("PostgreSqlConnection");
        options.UseNpgsql(ConnectionStringParser.Parse(rawConn));
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
        var jwtKey = builder.Configuration["Jwt:Key"];
        if (string.IsNullOrEmpty(jwtKey) || jwtKey == "YOUR_JWT_SECRET_KEY" || jwtKey.Length < 32)
        {
            jwtKey = "ThisIsAVerySecretKeyForEthesisProject2026!KeepItSafe";
        }
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// Dependency Injection
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IThesisService, ThesisService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<ISocialService, SocialService>();
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IPlagiarismService, PlagiarismService>();
builder.Services.AddSingleton<IGoogleDriveStorageService, GoogleDriveStorageService>();
builder.Services.AddSingleton<ILibreOfficePdfConverter, LibreOfficePdfConverter>();
builder.Services.AddSingleton<IDriveSampleDataSeeder, DriveSampleDataSeeder>();
builder.Services.AddHttpClient();

// Chatbot Double-Guardrail and ShellScope DI registrations
builder.Services.AddSingleton(typeof(IElasticSearchRepository<>), typeof(ElasticSearchRepository<>));
builder.Services.AddSingleton<IShellScopeFactory, ShellScopeFactory>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient<IGeminiService, GeminiService>();
builder.Services.AddHostedService<PlagiarismQueueConsumer>();
builder.Services.AddHostedService<DriveSyncSchedulerService>();

// SignalR service
builder.Services.AddSignalR();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
    options.AddPolicy("AllowSignalR", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://ethesis-frontend-portal.onrender.com")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Hangfire — Background Job Processing
var rawHangfireConn = builder.Configuration.GetConnectionString("PostgreSqlConnection");
var hangfireConnStr = ConnectionStringParser.Parse(rawHangfireConn);
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(options => options.UseNpgsqlConnection(hangfireConnStr), new PostgreSqlStorageOptions
    {
        SchemaName = "public"
    })
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

app.UseRouting();
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
    RequestPath = "/uploads",
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers["Access-Control-Allow-Origin"] = "*";
        ctx.Context.Response.Headers["Access-Control-Allow-Headers"] = "*";
        ctx.Context.Response.Headers["Access-Control-Allow-Methods"] = "*";
    }
});

var tempPdfPath = Path.Combine(Directory.GetCurrentDirectory(), builder.Configuration["GoogleDrive:TemporaryPdfLocalPath"] ?? "temporary_pdf");
if (!Directory.Exists(tempPdfPath)) Directory.CreateDirectory(tempPdfPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(tempPdfPath),
    RequestPath = "/temporary_pdf",
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers["Access-Control-Allow-Origin"] = "*";
        ctx.Context.Response.Headers["Access-Control-Allow-Headers"] = "*";
        ctx.Context.Response.Headers["Access-Control-Allow-Methods"] = "*";
    }
});

// Database initialization & migrations
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        
        // Wait and retry for DB connection to handle sleeping DBs or temporary DNS issues on Render
        int dbRetries = 12;
        bool dbConnected = false;
        while (dbRetries > 0 && !dbConnected)
        {
            try
            {
                if (context.Database.CanConnect())
                {
                    dbConnected = true;
                    Console.WriteLine("Database connection established successfully.");
                }
                else
                {
                    throw new Exception("CanConnect returned false.");
                }
            }
            catch (Exception ex)
            {
                dbRetries--;
                Console.WriteLine($"⚠️ Database connection attempt failed ({12 - dbRetries}/12): {ex.Message}. Retrying in 3 seconds...");
                if (dbRetries > 0)
                {
                    System.Threading.Thread.Sleep(3000);
                }
            }
        }

        context.Database.EnsureCreated();

        try
        {
            var provider = builder.Configuration["Database:Provider"]?.Trim().ToLowerInvariant();
            if (provider == "postgresql" || provider == "postgres")
            {
                try { context.Database.ExecuteSqlRaw("ALTER TABLE \"ChatHistory\" ADD COLUMN IF NOT EXISTS \"UserId\" INTEGER;"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE \"Theses\" ADD COLUMN IF NOT EXISTS \"Major\" VARCHAR(500);"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE \"Theses\" ADD COLUMN IF NOT EXISTS \"Subject\" VARCHAR(500);"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE \"Theses\" ADD COLUMN IF NOT EXISTS \"SubjectCode\" VARCHAR(100);"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE \"Theses\" ADD COLUMN IF NOT EXISTS \"Category\" VARCHAR(50) DEFAULT 'Project';"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE \"Theses\" ADD COLUMN IF NOT EXISTS \"Batch\" INTEGER DEFAULT 1;"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                
                try { context.Database.ExecuteSqlRaw(@"UPDATE ""Theses"" SET ""Category"" = 'Project', ""Major"" = 'ai', ""Subject"" = 'Phát triển ứng dụng trí tuệ nhân tạo', ""SubjectCode"" = 'ITE1174E' WHERE ""Id"" = 2 AND (""Major"" IS NULL OR ""Major"" = '');"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                try { context.Database.ExecuteSqlRaw(@"UPDATE ""Theses"" SET ""Category"" = 'Thesis', ""Major"" = 'ai' WHERE ""Id"" = 1 AND (""Major"" IS NULL OR ""Major"" = '');"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                try { context.Database.ExecuteSqlRaw(@"UPDATE ""Theses"" SET ""Category"" = 'Topic', ""Major"" = 'networking' WHERE ""Id"" = 3 AND (""Major"" IS NULL OR ""Major"" = '');"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                
                try 
                { 
                    context.Database.ExecuteSqlRaw(@"
                        CREATE TABLE IF NOT EXISTS ""PlagiarismReports"" (
                            ""Id"" SERIAL PRIMARY KEY,
                            ""ThesisId"" INTEGER NOT NULL REFERENCES ""Theses""(""Id"") ON DELETE CASCADE,
                            ""SimilarityPercentage"" DOUBLE PRECISION NOT NULL,
                            ""ReportJson"" TEXT NOT NULL,
                            ""CheckedAt"" TIMESTAMP WITHOUT TIME ZONE NOT NULL
                        );"); 
                } 
                catch (Exception ex) { Console.WriteLine($"Migration error: {ex.Message}"); }

                try
                {
                    context.Database.ExecuteSqlRaw(@"
                        CREATE TABLE IF NOT EXISTS ""ThesisSubmissions"" (
                            ""Id"" SERIAL PRIMARY KEY,
                            ""ThesisId"" INTEGER NOT NULL REFERENCES ""Theses""(""Id"") ON DELETE CASCADE,
                            ""FilePath"" VARCHAR(2000) NOT NULL,
                            ""FileName"" VARCHAR(1000) NOT NULL,
                            ""FileSize"" BIGINT NOT NULL,
                            ""Version"" INTEGER NOT NULL DEFAULT 1,
                            ""Notes"" TEXT,
                            ""SubmittedAt"" TIMESTAMP WITHOUT TIME ZONE NOT NULL
                        );");
                }
                catch (Exception ex) { Console.WriteLine($"Migration error: {ex.Message}"); }

                try
                {
                    context.Database.ExecuteSqlRaw(@"
                        CREATE TABLE IF NOT EXISTS ""ThesisReviews"" (
                            ""Id"" SERIAL PRIMARY KEY,
                            ""ThesisId"" INTEGER NOT NULL REFERENCES ""Theses""(""Id"") ON DELETE CASCADE,
                            ""ReviewerId"" INTEGER NOT NULL REFERENCES ""Users""(""Id"") ON DELETE RESTRICT,
                            ""Comments"" TEXT,
                            ""Score"" NUMERIC,
                            ""Decision"" VARCHAR(100) NOT NULL DEFAULT 'Pending',
                            ""ReviewedAt"" TIMESTAMP WITHOUT TIME ZONE NOT NULL
                        );");
                }
                catch (Exception ex) { Console.WriteLine($"Migration error: {ex.Message}"); }

                try
                {
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
                }
                catch (Exception ex) { Console.WriteLine($"Migration error: {ex.Message}"); }

                try { context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""RelativePath"" VARCHAR(2000) NOT NULL DEFAULT '';"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                try { context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""Major"" VARCHAR(500) NOT NULL DEFAULT '';"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                try { context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""MajorKey"" VARCHAR(100) NOT NULL DEFAULT '';"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                try { context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""Subject"" VARCHAR(500) NOT NULL DEFAULT '';"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                try { context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""SubjectCode"" VARCHAR(100) NOT NULL DEFAULT '';"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                try { context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""StudentUid"" VARCHAR(100) NOT NULL DEFAULT '';"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                try { context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""ProjectName"" VARCHAR(1000) NOT NULL DEFAULT '';"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                try { context.Database.ExecuteSqlRaw(@"ALTER TABLE ""DriveFileRecords"" ADD COLUMN IF NOT EXISTS ""LocalPdfPath"" VARCHAR(2000) NOT NULL DEFAULT '';"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
                try { context.Database.ExecuteSqlRaw(@"ALTER TABLE ""SocialPosts"" ADD COLUMN IF NOT EXISTS ""CloudinaryStatus"" VARCHAR(50) DEFAULT 'None';"); } catch (Exception ex) { Console.WriteLine($"Migration warning: {ex.Message}"); }
            }
            else
            {
                try { context.Database.ExecuteSqlRaw("ALTER TABLE ChatHistory ADD UserId INT;"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD Major NVARCHAR(500);"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD Subject NVARCHAR(500);"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD SubjectCode NVARCHAR(100);"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD Category NVARCHAR(50) DEFAULT 'Project';"); } catch { }
                try { context.Database.ExecuteSqlRaw("ALTER TABLE Theses ADD Batch INT DEFAULT 1;"); } catch { }
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

            // Update posts 1, 2, 3 with professional googleusercontent image URLs and long contents
            var post1 = context.SocialPosts.Find(1);
            if (post1 != null)
            {
                post1.Title = "Công bố danh sách các sáng kiến tiêu biểu học kỳ 1 năm 2024";
                post1.Desc = "Hội đồng chuyên môn Khoa học và Công nghệ nhà trường đã hoàn tất công tác đánh giá, chấm điểm và chính thức công bố danh sách 10 sáng kiến tiêu biểu nhất trong học kỳ 1 năm học 2024 - 2025. Các đề tài đạt giải năm nay trải rộng trên nhiều lĩnh vực mũi nhọc như Trí tuệ nhân tạo, Công nghệ mạng thế hệ mới, Hệ thống nhúng và IoT, mở ra nhiều hướng phát triển thực tiễn đầy triển vọng.";
                post1.Content = "Sau hơn 2 tháng làm việc nghiêm túc, khách quan và chuyên nghiệp, Hội đồng chuyên môn Khoa học và Công nghệ nhà trường đã hoàn tất việc đánh giá toàn diện hơn 80 đề tài nộp về từ các Khoa thành viên. Ban tổ chức xin chúc mừng 10 sáng kiến tiêu biểu nhất đã xuất sắc vượt qua các vòng phản biện gắt gao để đạt chứng nhận cấp Trường. Các đề tài đạt giải không chỉ thể hiện sự đầu tư bài bản về mặt học thuật mà còn giải quyết trực tiếp nhiều bài toán thực tế của doanh nghiệp và xã hội. Những nghiên cứu tiêu biểu bao gồm dự án phát hiện vi phạm giao thông bằng AI của nhóm sinh viên CNTT, và giải pháp tối ưu hệ thống IoT trong nông nghiệp công nghệ cao của sinh viên Điện tử.\n\nHội đồng đánh giá năm nay quy tụ các phó giáo sư, tiến sĩ đầu ngành cùng các giám đốc công nghệ từ các tập đoàn đối tác lớn, đảm bảo tính thực tiễn cao cho mỗi đề tài được lựa chọn. Theo quy chế mới, các nhóm tác giả sở hữu đề tài tiêu biểu sẽ nhận được gói tài trợ phát triển sản phẩm trị giá lên tới 50 triệu đồng mỗi đề tài từ Quỹ Phát triển Khoa học Công nghệ nhà trường. Bên cạnh đó, Văn phòng Chuyển giao Công nghệ và Sở hữu Trí tuệ sẽ trực tiếp hỗ trợ 100% chi phí đăng ký bảo hộ quyền tác giả hoặc sáng chế cho các sáng kiến này, đồng thời kết nối trực tiếp các nhóm nghiên cứu với mạng lưới hơn 50 doanh nghiệp đối tác lớn để thực hiện chuyển giao công nghệ hoặc ươm tạo doanh nghiệp khởi nghiệp (spin-off) ngay trong khuôn viên trường trong học kỳ tới.";
                if (!post1.Image.Contains("aida-public/AB6AXuDVaKckFBO6OahgQhL5POM9H"))
                {
                    post1.Image = "https://lh3.googleusercontent.com/aida-public/AB6AXuDVaKckFBO6OahgQhL5POM9HkyyecIPbbQpO1dWLvQHUSBcj49wyeR69ByLr8G1HshrXjAzidE5A-wOT6RA7V7eLvC33ch_y8-bNDvNRg1HwmmnaJTAcz8NBYG9tH7A-4q9Aydwy8_z9zEL6dgejrSFafcXOHrBluNSxzC-1l68EVFbA93qGEExIzjN4r7IEyBbD-vnEDCAtJDWdRszsVJdArxh12IA2eUzDBOvizUG5zZuFjD1jL69T8qDOK5VDX_pqXpNUf76mRsk";
                    post1.CloudinaryStatus = "None";
                }
            }

            var post2 = context.SocialPosts.Find(2);
            if (post2 != null)
            {
                post2.Title = "Hướng dẫn tra cứu và tham khảo kho dữ liệu sáng kiến học thuật";
                post2.Desc = "Để hỗ trợ sinh viên trong quá trình học tập, nghiên cứu và làm đồ án tốt nghiệp, Ban Thư viện phối hợp cùng Khoa CNTT xây dựng tài liệu hướng dẫn tra cứu kho dữ liệu số hóa. Hệ thống mới tích hợp công cụ tìm kiếm thông minh theo từ khóa, ngành học và mã số giảng viên hướng dẫn, giúp việc tiếp cận kho tri thức số hóa trở nên dễ dàng và nhanh chóng hơn bao giờ hết.";
                post2.Content = "Nhằm nâng cao chất lượng tự học và thúc đẩy phong trào nghiên cứu khoa học trong sinh viên, Thư viện số chính thức giới thiệu cẩm nang hướng dẫn sử dụng kho dữ liệu sáng kiến học thuật số hóa. Sinh viên có thể truy cập hệ thống trực tuyến thông qua tài khoản sinh viên được cấp. Quy trình tra cứu gồm 4 bước đơn giản: 1. Đăng nhập hệ thống; 2. Sử dụng thanh tìm kiếm thông minh kết hợp các bộ lọc chuyên sâu (Lĩnh vực, Học kỳ, Giảng viên); 3. Đọc tóm tắt và đánh giá mức độ tương quan của đề tài; 4. Đăng ký mượn bản PDF đầy đủ hoặc tham khảo trực tuyến qua trình đọc sách tương tác.\n\nKho dữ liệu học thuật số hóa hiện lưu giữ hơn 5.000 đề tài khóa luận tốt nghiệp, đồ án môn học tiêu biểu và các bài báo khoa học đã được công bố của sinh viên và giảng viên qua các thời kỳ. Hệ thống mới được trang bị công nghệ nhận dạng ký tự quang học (OCR) tiên tiến, cho phép sinh viên tìm kiếm trực tiếp các cụm từ nằm sâu trong nội dung tài liệu quét cũ. Để phục vụ tốt nhất cho quá trình trích dẫn và nghiên cứu, hệ thống cũng tích hợp công cụ tự động xuất file trích dẫn chuẩn APA, MLA hoặc IEEE, tương thích tốt với các phần mềm quản lý thư mục phổ biến như Mendeley, EndNote và Zotero. Ban quản lý cũng lưu ý sinh viên tuân thủ nghiêm ngặt các quy định về trích dẫn tài liệu tham khảo để tránh các vi phạm liên quan đến quyền tác giả và đạo văn trong nghiên cứu khoa học.";
                if (!post2.Image.Contains("aida-public/AB6AXuC9CBcdVbi_lVPZdj1fMXkDrm"))
                {
                    post2.Image = "https://lh3.googleusercontent.com/aida-public/AB6AXuC9CBcdVbi_lVPZdj1fMXkDrm6UXNpgAQzAbT5BzIzcVc1wXGTHcmwvFTTaIEgcFm1wFyYIkxuYp8LKwSkizyelJ4bjIqymKLSgFfukFSODI8QlHCdYgYlzoIpXWPGJ6pwNFnkIc54kH5CFyy19WYTo0HdQ9cSVQ1CNsuV41pZn1z5hhO7krZslwN6YtBpL_fRpzCvXn5HpiOcH4ntw_v0VI8GftCgk9T6IiQz7ikPDYxY5Gr4t4CGGG3_-YsRIM4rMsyCMlTMvyufS";
                    post2.CloudinaryStatus = "None";
                }
            }

            var post3 = context.SocialPosts.Find(3);
            if (post3 != null)
            {
                post3.Title = "Hệ thống AI Gemini hỗ trợ phân tích và tóm tắt sáng kiến";
                post3.Desc = "Nhà trường chính thức đưa vào thử nghiệm hệ thống Trí tuệ nhân tạo (AI) tích hợp mô hình ngôn ngữ lớn Gemini của Google. Hệ thống mới này sẽ hỗ trợ sinh viên tóm tắt các tài liệu nghiên cứu dày hàng trăm trang, phân tích xu hướng đề tài tự động, đồng thời cung cấp giao diện chấm điểm cấu trúc bài viết và kiểm tra mức độ trùng lặp nội dung theo thời gian thực.";
                post3.Content = "Nằm trong chiến lược xây dựng Đại học Thông minh và Chuyển đổi số toàn diện, hệ thống eThesis chính thức tích hợp trợ lý học thuật AI Gemini. Trợ lý AI này cung cấp 3 tính năng cốt lõi cho sinh viên và giảng viên: Thứ nhất là 'Tóm tắt thông minh', giúp trích xuất các luận điểm, phương pháp và kết quả chính của một bài nghiên cứu dài chỉ trong vài giây; Thứ hai là 'Kiểm tra cấu trúc', AI sẽ đối chiếu bản thảo của sinh viên với các tiêu chuẩn trình bày khóa luận tốt nghiệp để đưa ra nhận xét định dạng, từ ngữ và lỗi ngữ pháp; Thứ ba là 'Gợi ý tài liệu liên quan', dựa trên ngữ nghĩa của bản thảo để đề xuất các bài báo khoa học liên quan trực tiếp.\n\nĐiểm đặc biệt của hệ thống tích hợp AI Gemini là mô hình bảo mật dữ liệu cấp cao. Toàn bộ bản thảo đồ án hoặc nghiên cứu do sinh viên đăng tải lên để phân tích sẽ được xử lý trong một phân vùng bảo mật riêng biệt và cam kết không sử dụng để huấn luyện lại mô hình công cộng, đảm bảo tuyệt đối tính bản quyền và tránh rò rỉ ý tưởng công nghệ trước khi công bố. Trong giai đoạn thử nghiệm đầu tiên (từ nay đến hết tháng 8/2026), mỗi tài khoản sinh viên sẽ được cung cấp 50 lượt sử dụng AI miễn phí mỗi ngày. Mọi ý kiến phản hồi về chất lượng phản hồi của AI có thể gửi trực tiếp qua nút đóng góp ý kiến ở góc phải màn hình để đội ngũ phát triển tinh chỉnh thuật toán tốt hơn trước khi chính thức vận hành thương mại vào học kỳ sau.";
                if (!post3.Image.Contains("aida-public/AB6AXuANxGO4D6ojuZlYk7MEhtq_38"))
                {
                    post3.Image = "https://lh3.googleusercontent.com/aida-public/AB6AXuANxGO4D6ojuZlYk7MEhtq_38tsfUs324mV9MOXepahz-7q_MfJXjqjvHbgLt27PAjQquIgxNbU4l8TFLxxTqokf9fiaJRq8mxeZIqQU-_fhU1ho_Omjv4xl_49kl_cJIIr3tyg5-3Lu3GYiLPM2N3psKIdMJtF-p6DcwYjflkXf24kayQ57904JAS0eyc8PMffw-nv4NNzDqKse0KbLJ4YWmW0Hqys7UoOYciK4A2BTM_k2g3B1Slq6NwqcMgwtqtuEWUyLaQ7lH_W";
                    post3.CloudinaryStatus = "None";
                }
            }

            var post4 = context.SocialPosts.Find(4);
            if (post4 == null)
            {
                post4 = new SocialPost
                {
                    Id = 4,
                    Title = "Phát động Cuộc thi Khởi nghiệp Sáng tạo và Đổi mới Công nghệ Liên trường 2025",
                    Category = "Báo chí",
                    BadgeClass = "bg-red-600 text-white",
                    Image = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&q=80",
                    Desc = "Với mục tiêu thúc đẩy tinh thần đổi mới sáng tạo và phát triển các giải pháp công nghệ mang tính thực tiễn cao, Ban Tổ chức chính thức công bố phát động Cuộc thi Khởi nghiệp Sáng tạo & Đổi mới Công nghệ Liên trường quy tụ hơn 15 trường đại học lớn trên toàn quốc như UEF, HUTECH, ĐHQG-HCM, Bách Khoa... Cuộc thi mang đến cơ hội lớn giúp sinh viên đưa các đề tài nghiên cứu khoa học từ giảng đường vào giải quyết trực tiếp các bài toán chuyển đổi số, tối ưu hoá năng lượng và ứng dụng AI thực tế của doanh nghiệp hiện nay.",
                    Content = "Sáng ngày 16/06/2026, tại hội trường lớn, Lễ ký kết và chính thức phát động Cuộc thi Khởi nghiệp Sáng tạo và Đổi mới Công nghệ Liên trường đã diễn ra long trọng với sự tham gia của đại diện Sở Khoa học và Công nghệ, Ban giám hiệu các trường cùng hơn 1.000 sinh viên. Cuộc thi năm nay lấy chủ đề 'Chuyển đổi số và Phát triển bền vững', khuyến khích ứng dụng AI, Blockchain, IoT và Big Data. Cơ cấu giải thưởng năm nay được nâng lên tổng trị giá hơn 600 triệu đồng tiền mặt cùng gói hỗ trợ hạ tầng đám mây trị giá hàng chục nghìn USD từ Google Cloud và AWS.\n\nCuộc thi năm nay đánh dấu sự hợp tác sâu rộng giữa 15 trường đại học lớn trên toàn quốc, mở ra một sân chơi liên kết liên ngành quy mô lớn chưa từng có. Theo thể lệ cuộc thi, các đội thi được phép tuyển thành viên liên trường để kết hợp các thế mạnh chuyên môn khác nhau, ví dụ nhóm kỹ thuật từ trường CNTT, nhóm kinh doanh từ trường Kinh tế và nhóm truyền thông từ trường Xã hội nhân văn. Quy trình cuộc thi gồm 3 giai đoạn: Vòng Sơ loại ý tưởng (đến hết ngày 30/08) chọn ra Top 30; Vòng Bán kết & Huấn luyện (Bootcamp) kéo dài 2 tuần tại vườn ươm doanh nghiệp công nghệ cao với sự đồng hành 1-1 từ các Mentor là các Founder đã gọi vốn thành công; và Vòng Chung kết & Triển lãm (Tháng 11) thuyết trình gọi vốn trực tiếp trước các quỹ đầu tư mạo hiểm quốc tế. Đây là bệ phóng vững chắc đưa nghiên cứu khoa học của sinh viên tiệm cận nhu cầu thực tế của doanh nghiệp và xã hội.",
                    Published = true,
                    CloudinaryStatus = "None",
                    CreatedAt = DateTime.UtcNow.AddDays(-10)
                };
                context.SocialPosts.Add(post4);
            }
            else
            {
                post4.Title = "Phát động Cuộc thi Khởi nghiệp Sáng tạo và Đổi mới Công nghệ Liên trường 2025";
                post4.Image = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&q=80";
                post4.Desc = "Với mục tiêu thúc đẩy tinh thần đổi mới sáng tạo và phát triển các giải pháp công nghệ mang tính thực tiễn cao, Ban Tổ chức chính thức công bố phát động Cuộc thi Khởi nghiệp Sáng tạo & Đổi mới Công nghệ Liên trường quy tụ hơn 15 trường đại học lớn trên toàn quốc như UEF, HUTECH, ĐHQG-HCM, Bách Khoa... Cuộc thi mang đến cơ hội lớn giúp sinh viên đưa các đề tài nghiên cứu khoa học từ giảng đường vào giải quyết trực tiếp các bài toán chuyển đổi số, tối ưu hoá năng lượng và ứng dụng AI thực tế của doanh nghiệp hiện nay.";
                post4.Content = "Sáng ngày 16/06/2026, tại hội trường lớn, Lễ ký kết và chính thức phát động Cuộc thi Khởi nghiệp Sáng tạo và Đổi mới Công nghệ Liên trường đã diễn ra long trọng với sự tham gia của đại diện Sở Khoa học và Công nghệ, Ban giám hiệu các trường cùng hơn 1.000 sinh viên. Cuộc thi năm nay lấy chủ đề 'Chuyển đổi số và Phát triển bền vững', khuyến khích ứng dụng AI, Blockchain, IoT và Big Data. Cơ cấu giải thưởng năm nay được nâng lên tổng trị giá hơn 600 triệu đồng tiền mặt cùng gói hỗ trợ hạ tầng đám mây trị giá hàng chục nghìn USD từ Google Cloud và AWS.\n\nCuộc thi năm nay đánh dấu sự hợp tác sâu rộng giữa 15 trường đại học lớn trên toàn quốc, mở ra một sân chơi liên kết liên ngành quy mô lớn chưa từng có. Theo thể lệ cuộc thi, các đội thi được phép tuyển thành viên liên trường để kết hợp các thế mạnh chuyên môn khác nhau, ví dụ nhóm kỹ thuật từ trường CNTT, nhóm kinh doanh từ trường Kinh tế và nhóm truyền thông từ trường Xã hội nhân văn. Quy trình cuộc thi gồm 3 giai đoạn: Vòng Sơ loại ý tưởng (đến hết ngày 30/08) chọn ra Top 30; Vòng Bán kết & Huấn luyện (Bootcamp) kéo dài 2 tuần tại vườn ươm doanh nghiệp công nghệ cao với sự đồng hành 1-1 từ các Mentor là các Founder đã gọi vốn thành công; và Vòng Chung kết & Triển lãm (Tháng 11) thuyết trình gọi vốn trực tiếp trước các quỹ đầu tư mạo hiểm quốc tế. Đây là bệ phóng vững chắc đưa nghiên cứu khoa học của sinh viên tiệm cận nhu cầu thực tế của doanh nghiệp và xã hội.";
                post4.CloudinaryStatus = "None";
            }

            var post5 = context.SocialPosts.Find(5);
            if (post5 == null)
            {
                post5 = new SocialPost
                {
                    Id = 5,
                    Title = "Chung kết Cuộc thi Ý tưởng Đổi mới Sáng tạo Xanh Liên trường: Điểm hẹn của các giải pháp phát triển bền vững",
                    Category = "Báo chí",
                    BadgeClass = "bg-emerald-600 text-white",
                    Image = "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1000&q=80",
                    Desc = "Vượt qua hơn 200 đề tài nghiên cứu từ 18 trường Đại học đối tác trên khắp cả nước, Top 10 dự án công nghệ xanh xuất sắc nhất đã bước vào vòng Chung kết xếp hạng đầy kịch tính. Các dự án nổi bật năm nay tập trung vào công nghệ xử lý rác thải hữu cơ thông minh, vật liệu sinh học thay thế nhựa dùng một lần và ứng dụng mô hình học sâu (Deep Learning) tối ưu hóa năng lượng cho các toà nhà thông minh. Sự kiện nhận được sự quan tâm lớn từ giới chuyên môn, các cơ quan báo chí truyền thông cùng các nhà tài trợ lớn.",
                    Content = "Đêm Chung kết Cuộc thi Ý tưởng Sáng tạo Xanh Liên trường vừa khép lại với những màn tranh tài nảy lửa giữa các tài năng trẻ đến từ nhiều trường đại học hàng đầu cả nước. Sau hơn 5 giờ thuyết trình và phản biện trực tiếp với Hội đồng giám khảo, dự án 'Hệ thống quản lý và tối ưu hóa năng lượng thông minh cho đô thị lớn' sử dụng trí tuệ nhân tạo của nhóm sinh viên liên trường đã xuất sắc giành ngôi vị Quán quân. Hội đồng giám khảo gồm các chuyên gia đầu ngành trong nước và quốc tế đánh giá cao tính thực tiễn và khả năng triển khai thương mại của các đề tài năm nay. Nhiều dự án đã có sản phẩm thử nghiệm thực tế (MVP) hoạt động rất ổn định và bắt đầu thử nghiệm thương mại hoá ở quy mô nhỏ.\n\nBên cạnh giải Quán quân, giải Nhì đã thuộc về dự án 'Vật liệu xây dựng sinh học sản xuất từ phế phẩm nông nghiệp tái chế' và giải Ba trao cho 'Hệ thống lọc nước nhiễm mặn quy mô hộ gia đình ứng dụng năng lượng mặt trời'. Tổng giải thưởng trị giá 150 triệu đồng tiền mặt cùng gói ươm tạo doanh nghiệp công nghệ cao trong vòng 1 năm tại Khu Công nghệ cao TP.HCM đã được trao trực tiếp cho đội thi xứng đáng nhất. Đại diện Hội đồng Giám khảo nhận xét: 'Chúng tôi thực sự bất ngờ trước sự trưởng thành trong tư duy và kỹ năng trình bày dự án của sinh viên. Các bạn không chỉ có kiến thức kỹ thuật vững chắc mà còn có tầm nhìn chiến lược về kinh doanh, marketing và ý thức trách nhiệm cao với cộng đồng, môi trường. Đây chính là thế hệ trẻ tiên phong sẽ dẫn dắt cuộc cách mạng xanh và chuyển đổi số tại Việt Nam trong tương lai.' Ban tổ trì cuộc thi cũng tiết lộ rằng ngay tại đêm chung kết, 3 dự án xuất sắc nhất đã nhận được thư bày tỏ ý định đầu tư vòng thiên thần từ các quỹ đầu tư mạo hiểm nội địa với tổng giá trị cam kết ban đầu lên đến 2 tỷ đồng.",
                    Published = true,
                    CloudinaryStatus = "None",
                    CreatedAt = DateTime.UtcNow.AddDays(-5)
                };
                context.SocialPosts.Add(post5);
            }
            else
            {
                post5.Title = "Chung kết Cuộc thi Ý tưởng Đổi mới Sáng tạo Xanh Liên trường: Điểm hẹn của các giải pháp phát triển bền vững";
                post5.Image = "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1000&q=80";
                post5.Desc = "Vượt qua hơn 200 đề tài nghiên cứu từ 18 trường Đại học đối tác trên khắp cả nước, Top 10 dự án công nghệ xanh xuất sắc nhất đã bước vào vòng Chung kết xếp hạng đầy kịch tính. Các dự án nổi bật năm nay tập trung vào công nghệ xử lý rác thải hữu cơ thông minh, vật liệu sinh học thay thế nhựa dùng một lần và ứng dụng mô hình học sâu (Deep Learning) tối ưu hóa năng lượng cho các toà nhà thông minh. Sự kiện nhận được sự quan tâm lớn từ giới chuyên môn, các cơ quan báo chí truyền thông cùng các nhà tài trợ lớn.";
                post5.Content = "Đêm Chung kết Cuộc thi Ý tưởng Sáng tạo Xanh Liên trường vừa khép lại với những màn tranh tài nảy lửa giữa các tài năng trẻ đến từ nhiều trường đại học hàng đầu cả nước. Sau hơn 5 giờ thuyết trình và phản biện trực tiếp với Hội đồng giám khảo, dự án 'Hệ thống quản lý và tối ưu hóa năng lượng thông minh cho đô thị lớn' sử dụng trí tuệ nhân tạo của nhóm sinh viên liên trường đã xuất sắc giành ngôi vị Quán quân. Hội đồng giám khảo gồm các chuyên gia đầu ngành trong nước và quốc tế đánh giá cao tính thực tiễn và khả năng triển khai thương mại của các đề tài năm nay. Nhiều dự án đã có sản phẩm thử nghiệm thực tế (MVP) hoạt động rất ổn định và bắt đầu thử nghiệm thương mại hoá ở quy mô nhỏ.\n\nBên cạnh giải Quán quân, giải Nhì đã thuộc về dự án 'Vật liệu xây dựng sinh học sản xuất từ phế phẩm nông nghiệp tái chế' và giải Ba trao cho 'Hệ thống lọc nước nhiễm mặn quy mô hộ gia đình ứng dụng năng lượng mặt trời'. Tổng giải thưởng trị giá 150 triệu đồng tiền mặt cùng gói ươm tạo doanh nghiệp công nghệ cao trong vòng 1 năm tại Khu Công nghệ cao TP.HCM đã được trao trực tiếp cho đội thi xứng đáng nhất. Đại diện Hội đồng Giám khảo nhận xét: 'Chúng tôi thực sự bất ngờ trước sự trưởng thành trong tư duy và kỹ năng trình bày dự án của sinh viên. Các bạn không chỉ có kiến thức kỹ thuật vững chắc mà còn có tầm nhìn chiến lược về kinh doanh, marketing và ý thức trách nhiệm cao với cộng đồng, môi trường. Đây chính là thế hệ trẻ tiên phong sẽ dẫn dắt cuộc cách mạng xanh và chuyển đổi số tại Việt Nam trong tương lai.' Ban tổ trì cuộc thi cũng tiết lộ rằng ngay tại đêm chung kết, 3 dự án xuất sắc nhất đã nhận được thư bày tỏ ý định đầu tư vòng thiên thần từ các quỹ đầu tư mạo hiểm nội địa với tổng giá trị cam kết ban đầu lên đến 2 tỷ đồng.";
                post5.CloudinaryStatus = "None";
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

// Map SignalR NotificationHub using explicit CORS policy
app.MapHub<NotificationHub>("/notificationHub").RequireCors("AllowSignalR");

// REST Endpoint to publish notifications (to be called by other microservices or testers)
app.MapPost("/api/notifications", async (NotificationHubRequest request, Microsoft.AspNetCore.SignalR.IHubContext<NotificationHub> hubContext, PlatformAdmin.Data.AppDbContext db) =>
{
    if (string.IsNullOrEmpty(request.RecipientEmail))
    {
        return Results.BadRequest(new { message = "RecipientEmail is required." });
    }

    // Try to find the user in DB to save notification persistently
    var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.RecipientEmail);
    if (user != null)
    {
        var notif = new PlatformAdmin.Entities.Notification
        {
            UserId = user.Id,
            Title = request.Title,
            Message = request.Desc,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        db.Notifications.Add(notif);
        await db.SaveChangesAsync();
    }

    // Push the notification object to the specific user's group
    await hubContext.Clients.Group(request.RecipientEmail).SendAsync("ReceiveNotification", new
    {
        title = request.Title,
        desc = request.Desc,
        time = "Vừa xong",
        icon = request.Icon ?? "info",
        color = request.Color ?? "text-blue-600",
        bg = request.Bg ?? "bg-blue-50"
    });

    return Results.Ok(new { message = "Notification sent successfully." });
}).RequireCors("AllowSignalR");

// Custom middleware to intercept /hangfire (without trailing slash) and preserve token query parameters on redirect to /hangfire/
app.Use((context, next) =>
{
    var path = context.Request.Path.Value ?? "";
    if (path.Equals("/hangfire", StringComparison.OrdinalIgnoreCase))
    {
        var queryString = context.Request.QueryString.Value ?? "";
        context.Response.Redirect("/hangfire/" + queryString);
        return Task.CompletedTask;
    }
    return next();
});

// Hangfire Dashboard (accessible at /hangfire)
try
{
    app.UseHangfireDashboard("/hangfire", new DashboardOptions
    {
        Authorization = new[] { new HangfireAdminAuthorizationFilter(app.Configuration) }
    });
    Console.WriteLine("Hangfire Dashboard initialized successfully.");
}
catch (Exception ex)
{
    Console.WriteLine($"⚠️ Hangfire Dashboard initialization failed: {ex.Message}");
}

// Register recurring job: sync Drive files every 1 minute in a background task to prevent startup crashes from lock timeouts
_ = Task.Run(async () =>
{
    int retries = 6;
    while (retries > 0)
    {
        try
        {
            RecurringJob.AddOrUpdate<DriveSyncJob>(
                "drive-sync-all",
                job => job.SyncAllAsync(),
                "*/1 * * * *"
            );
            Console.WriteLine("Successfully registered recurring job 'drive-sync-all'.");
            break;
        }
        catch (Exception ex)
        {
            retries--;
            Console.WriteLine($"Warning: Failed to register recurring job 'drive-sync-all' (retries left: {retries}): {ex.Message}");
            if (retries > 0)
            {
                await Task.Delay(10000); // Wait 10 seconds before retrying
            }
        }
    }
});

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
    // Wait 30 seconds to ensure Kestrel has successfully bound to port 80 first.
    await Task.Delay(30000);
    try
    {
        using var scope = app.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<IDriveSampleDataSeeder>();
        var result = await seeder.GenerateSampleDataAsync(force: false);
        Console.WriteLine($"📁 Drive auto-seed: {result.Message} (uploaded={result.Uploaded}, failed={result.Failed})");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️ Drive auto-seed failed: {ex.Message}");
    }
});

Console.WriteLine("🚀 Hangfire: http://localhost:5145/hangfire");
Console.WriteLine("🔄 DriveSyncJob: every 10 seconds (Google Drive → DB → API → Frontend)");
Console.WriteLine("❤️  Health: http://localhost:5145/api/health/dependencies");

// Auto-migrate database on startup
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Console.WriteLine("⏳ Running database migrations...");
        db.Database.Migrate();
        Console.WriteLine("✅ Database migrations applied successfully.");
        
        Console.WriteLine("⏳ Seeding default users...");
        SeedDefaultUsers(db);
        Console.WriteLine("✅ Default users seeded successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Database migration/seeding failed: {ex.Message}");
    }
}

app.Run();

public class HangfireAdminAuthorizationFilter : Hangfire.Dashboard.IDashboardAuthorizationFilter
{
    private readonly IConfiguration _config;

    public HangfireAdminAuthorizationFilter(IConfiguration config)
    {
        _config = config;
    }

    public bool Authorize(Hangfire.Dashboard.DashboardContext context)
    {
        var httpContextProperty = context.GetType().GetProperty("HttpContext");
        if (httpContextProperty == null) return false;
        
        var httpContext = httpContextProperty.GetValue(context) as Microsoft.AspNetCore.Http.HttpContext;
        if (httpContext == null) return false;

        var path = httpContext.Request.Path.Value ?? "";
        if (path.Contains("/js", StringComparison.OrdinalIgnoreCase) || 
            path.Contains("/css", StringComparison.OrdinalIgnoreCase) || 
            path.Contains("/fonts", StringComparison.OrdinalIgnoreCase) || 
            path.Contains("/images", StringComparison.OrdinalIgnoreCase) ||
            path.Contains("/img", StringComparison.OrdinalIgnoreCase) ||
            path.Contains("/favicons", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // 1. Read token from Query parameter
        string? token = httpContext.Request.Query["token"];

        // Extract from Referer header if missing (common in cross-origin iframes where cookies are blocked)
        if (string.IsNullOrEmpty(token))
        {
            var referer = httpContext.Request.Headers["Referer"].ToString();
            if (!string.IsNullOrEmpty(referer) && referer.Contains("token="))
            {
                var match = System.Text.RegularExpressions.Regex.Match(referer, @"[?&]token=([^&]+)");
                if (match.Success)
                {
                    token = Uri.UnescapeDataString(match.Groups[1].Value);
                }
            }
        }

        // 2. Read token from Authorization Header
        if (string.IsNullOrEmpty(token))
        {
            var authHeader = httpContext.Request.Headers["Authorization"].ToString();
            if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                token = authHeader.Substring("Bearer ".Length).Trim();
            }
        }

        // 3. Read token from Cookie
        if (string.IsNullOrEmpty(token))
        {
            token = httpContext.Request.Cookies["hangfireToken"];
        }

        if (string.IsNullOrEmpty(token))
        {
            return false;
        }

        try
        {
            var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var jwtKey = _config["Jwt:Key"];
            if (string.IsNullOrEmpty(jwtKey) || jwtKey == "YOUR_JWT_SECRET_KEY" || jwtKey.Length < 32)
            {
                jwtKey = "ThisIsAVerySecretKeyForEthesisProject2026!KeepItSafe";
            }

            var validationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtKey)),
                ValidateIssuer = true,
                ValidIssuer = _config["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _config["Jwt:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
            
            // Store token in HttpOnly cookie for subsequent static assets/ajax requests of Hangfire (requires SameSite=None and Secure=true in cross-origin iframes)
            httpContext.Response.Cookies.Append("hangfireToken", token, new CookieOptions 
            { 
                Expires = DateTimeOffset.UtcNow.AddHours(8),
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None
            });

            var roleClaim = principal.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            return roleClaim == "Admin";
        }
        catch
        {
            return false;
        }
    }
}

public static class ConnectionStringParser
{
    public static string? Parse(string? connStr)
    {
        if (string.IsNullOrEmpty(connStr)) return connStr;
        if (connStr.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
            connStr.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uri = new Uri(connStr);
                var userInfo = uri.UserInfo.Split(':');
                var username = userInfo[0];
                var password = userInfo.Length > 1 ? userInfo[1] : "";
                var host = uri.Host;
                var port = uri.Port > 0 ? uri.Port : 5432;
                var database = uri.AbsolutePath.TrimStart('/');
                
                return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Failed to parse PostgreSQL Connection URL: {ex.Message}");
            }
        }
        return connStr;
    }
}

public partial class Program 
{ 
    public static void SeedDefaultUsers(AppDbContext db)
    {
        bool dbChanged = false;
        
        var adminUser = db.Users.FirstOrDefault(u => u.Email == "admin@ethesis.edu.vn");
        if (adminUser == null)
        {
            adminUser = new User
            {
                FullName = "Admin User",
                Email = "admin@ethesis.edu.vn",
                PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("123"),
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(adminUser);
            dbChanged = true;
            Console.WriteLine("🔑 Seeded 'admin@ethesis.edu.vn' user in database.");
        }

        var advisorUser = db.Users.FirstOrDefault(u => u.Email == "advisor@ethesis.edu.vn");
        if (advisorUser == null)
        {
            advisorUser = new User
            {
                FullName = "Nguyễn Hà Giang",
                Email = "advisor@ethesis.edu.vn",
                PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("123"),
                Role = "Advisor",
                Department = "Trưởng khoa",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(advisorUser);
            dbChanged = true;
            Console.WriteLine("🔑 Seeded 'advisor@ethesis.edu.vn' user in database.");
        }
        else if (advisorUser.FullName == "Dr. Nguyen Van A")
        {
            advisorUser.FullName = "Nguyễn Hà Giang";
            advisorUser.Department = "Trưởng khoa";
            db.Users.Update(advisorUser);
            dbChanged = true;
            Console.WriteLine("🔑 Updated 'advisor@ethesis.edu.vn' name to 'Nguyễn Hà Giang' and department to 'Trưởng khoa'.");
        }

        // Seed other 11 lecturers
        var lecturersSeed = new List<User>
        {
            new User { FullName = "Văn Thị Thiên Trang", Email = "trang.van@ethesis.edu.vn", Role = "Advisor", Department = "Phó Trưởng khoa", IsActive = true, CreatedAt = DateTime.UtcNow },
            new User { FullName = "Nguyễn Minh Tuấn", Email = "tuan.nguyen@ethesis.edu.vn", Role = "Advisor", Department = "Phó Trưởng khoa", IsActive = true, CreatedAt = DateTime.UtcNow },
            new User { FullName = "Hoàng Văn Hiếu", Email = "hieu.hoang@ethesis.edu.vn", Role = "Advisor", Department = "Trưởng ngành CNTT", IsActive = true, CreatedAt = DateTime.UtcNow },
            new User { FullName = "Nguyễn Thị Hoài Linh", Email = "linh.nguyen@ethesis.edu.vn", Role = "Advisor", Department = "Trưởng ngành Khoa học dữ liệu", IsActive = true, CreatedAt = DateTime.UtcNow },
            new User { FullName = "Trần Thành Công", Email = "cong.tran@ethesis.edu.vn", Role = "Advisor", Department = "Trưởng ngành TMĐT", IsActive = true, CreatedAt = DateTime.UtcNow },
            new User { FullName = "Ngô Văn Công Bằng", Email = "bang.ngo@ethesis.edu.vn", Role = "Advisor", Department = "Trưởng bộ môn", IsActive = true, CreatedAt = DateTime.UtcNow },
            new User { FullName = "Nguyễn Quang Minh", Email = "minh.nguyen@ethesis.edu.vn", Role = "Advisor", Department = "Giảng viên", IsActive = true, CreatedAt = DateTime.UtcNow },
            new User { FullName = "Nguyễn Minh Thắng", Email = "thang.nguyen@ethesis.edu.vn", Role = "Advisor", Department = "Giảng viên", IsActive = true, CreatedAt = DateTime.UtcNow },
            new User { FullName = "Huỳnh Đệ Thủ", Email = "thu.huynh@ethesis.edu.vn", Role = "Advisor", Department = "Giảng viên", IsActive = true, CreatedAt = DateTime.UtcNow },
            new User { FullName = "Võ Đình Ngà", Email = "nga.vo@ethesis.edu.vn", Role = "Advisor", Department = "Giảng viên", IsActive = true, CreatedAt = DateTime.UtcNow },
            new User { FullName = "Hoàng Minh", Email = "minh.hoang@ethesis.edu.vn", Role = "Advisor", Department = "Giảng viên", IsActive = true, CreatedAt = DateTime.UtcNow }
        };

        foreach (var lec in lecturersSeed)
        {
            var existing = db.Users.FirstOrDefault(u => u.Email == lec.Email);
            if (existing == null)
            {
                lec.PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("123");
                db.Users.Add(lec);
                dbChanged = true;
                Console.WriteLine($"🔑 Seeded lecturer '{lec.FullName}' in database.");
            }
        }

        var studentUser = db.Users.FirstOrDefault(u => u.Email == "student@ethesis.edu.vn");
        if (studentUser == null)
        {
            studentUser = new User
            {
                FullName = "Tran Thi B",
                Email = "student@ethesis.edu.vn",
                PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("123"),
                Role = "Student",
                StudentId = "SV001",
                Department = "Công nghệ thông tin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(studentUser);
            dbChanged = true;
            Console.WriteLine("🔑 Seeded 'student@ethesis.edu.vn' user in database.");
        }

        if (dbChanged)
        {
            db.SaveChanges();
        }

        // Auto-update all seeded ethesis users' passwords to "123" if they are not already
        var ethesisUsers = db.Users
            .Where(u => u.Email != null && u.Email.EndsWith("@ethesis.edu.vn"))
            .ToList();
            
        bool changed = false;
        foreach (var user in ethesisUsers)
        {
            try
            {
                if (!global::BCrypt.Net.BCrypt.Verify("123", user.PasswordHash))
                {
                    user.PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("123");
                    changed = true;
                }
            }
            catch
            {
                user.PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("123");
                changed = true;
            }
        }
        
        if (changed)
        {
            db.SaveChanges();
        }
    }
}

// SignalR Hub definition
public class NotificationHub : Microsoft.AspNetCore.SignalR.Hub
{
    public async System.Threading.Tasks.Task JoinUserGroup(string email)
    {
        if (!string.IsNullOrEmpty(email))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, email);
            System.Console.WriteLine($"[NotificationHub] User with connection {Context.ConnectionId} joined group: {email}");
        }
    }

    public async System.Threading.Tasks.Task LeaveUserGroup(string email)
    {
        if (!string.IsNullOrEmpty(email))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, email);
            System.Console.WriteLine($"[NotificationHub] User with connection {Context.ConnectionId} left group: {email}");
        }
    }
}

// Request DTO definition for hub notifications
public class NotificationHubRequest
{
    [System.Text.Json.Serialization.JsonPropertyName("recipientEmail")]
    public string RecipientEmail { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("desc")]
    public string Desc { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("icon")]
    public string Icon { get; set; } = "info";

    [System.Text.Json.Serialization.JsonPropertyName("color")]
    public string Color { get; set; } = "text-blue-600";

    [System.Text.Json.Serialization.JsonPropertyName("bg")]
    public string Bg { get; set; } = "bg-blue-50";
}
