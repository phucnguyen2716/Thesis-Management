using System.IO.Compression;
using System.Text;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using PlatformAdmin.Data;
using PlatformAdmin.Entities;

namespace PlatformAdmin.Services;

public class DriveGenerateResult
{
    public int Uploaded { get; set; }
    public int Failed { get; set; }
    public int Skipped { get; set; }
    public string Message { get; set; } = string.Empty;
}

public interface IDriveSampleDataSeeder
{
    Task<int> SeedIfEmptyAsync();
    Task<DriveGenerateResult> GenerateSampleDataAsync(bool force = false);
}

public class DriveSampleDataSeeder : IDriveSampleDataSeeder
{
    private readonly IGoogleDriveStorageService _drive;
    private readonly ILogger<DriveSampleDataSeeder> _logger;
    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _scopeFactory;

    public DriveSampleDataSeeder(IGoogleDriveStorageService drive, ILogger<DriveSampleDataSeeder> logger, IConfiguration configuration, IServiceScopeFactory scopeFactory)
    {
        _drive = drive;
        _logger = logger;
        _configuration = configuration;
        _scopeFactory = scopeFactory;
    }

    public async Task<int> SeedIfEmptyAsync()
    {
        var result = await GenerateSampleDataAsync(force: false);
        return result.Uploaded;
    }

    public async Task<DriveGenerateResult> GenerateSampleDataAsync(bool force = false)
    {
        var useMock = _configuration.GetValue<bool>("GoogleDrive:UseMock", true);

        // 1. Seed database users and theses first (Database-First seeding)
        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var existingThesesCount = await db.Theses.CountAsync();
            if (existingThesesCount < 10)
            {
                _logger.LogInformation("Database has only {Count} theses. Seeding all subjects and student groups into PostgreSQL...", existingThesesCount);
                
                // Keep track of added student UIDs to avoid duplicate user creation
                var userCache = await db.Users.ToDictionaryAsync(u => u.StudentId ?? u.Email);

                var defaultAdvisor = await db.Users.FirstOrDefaultAsync(u => u.Role == "Advisor")
                    ?? new User
                    {
                        FullName = "Dr. Nguyen Van A",
                        Email = "advisor@ethesis.edu.vn",
                        PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("advisor123"),
                        Role = "Advisor",
                        Department = "Công nghệ thông tin",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };

                if (defaultAdvisor.Id == 0)
                {
                    db.Users.Add(defaultAdvisor);
                    await db.SaveChangesAsync();
                }

                foreach (var g in DriveSampleCatalog.EnumerateAllGroups())
                {
                    // Find or create student user
                    if (!userCache.TryGetValue(g.Uid, out var student))
                    {
                        student = new User
                        {
                            FullName = $"Sinh viên {g.Uid}",
                            Email = $"{g.Uid.ToLower()}@ethesis.edu.vn",
                            PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("student123"),
                            Role = "Student",
                            StudentId = g.Uid,
                            Department = "Công nghệ thông tin",
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        };
                        db.Users.Add(student);
                        await db.SaveChangesAsync();
                        userCache[g.Uid] = student;
                    }

                    // Check if thesis already exists in database
                    var exists = await db.Theses.AnyAsync(t => t.StudentId == student.Id && t.SubjectCode == g.Code);
                    if (!exists)
                    {
                        var thesis = new Thesis
                        {
                            StudentId = student.Id,
                            AdvisorId = defaultAdvisor.Id,
                            Title = g.Project,
                            Description = $"Đề tài {g.Project} thuộc học phần {g.Subject} ({g.Code}). Dữ liệu tự động tự sinh.",
                            Major = g.MajorKey,
                            Subject = g.Subject,
                            SubjectCode = g.Code,
                            Category = "Project",
                            Status = "Approved",
                            CreatedAt = DateTime.UtcNow.AddDays(-30 + (g.Uid.GetHashCode() % 15)),
                            UpdatedAt = DateTime.UtcNow
                        };
                        db.Theses.Add(thesis);
                    }
                }
                await db.SaveChangesAsync();
                _logger.LogInformation("Successfully seeded database theses.");
            }
        }

        var existing = await _drive.CountFilesInCourseProjectStorageAsync();
        const int minDemoFiles = 80;

        if (!force && existing >= minDemoFiles)
        {
            _logger.LogInformation("DriveSampleDataSeeder: Drive đã có {Count} file (>= {Min}) — bỏ qua.", existing, minDemoFiles);
            return new DriveGenerateResult
            {
                Skipped = existing,
                Message = $"Drive đã có đủ {existing} file demo."
            };
        }

        _logger.LogInformation("DriveSampleDataSeeder: Bắt đầu tạo dữ liệu mẫu (force={Force})...", force);

        // Đảm bảo cấu trúc thư mục học phần tồn tại
        foreach (var major in DriveSampleCatalog.Majors)
        {
            foreach (var subject in major.Subjects)
            {
                try
                {
                    await _drive.GetOrCreateSubjectFolderAsync(
                        AcademicCategory.Project, major.DisplayName, subject.Name, subject.Code);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Không tạo được thư mục {Subject}", subject.Name);
                }
            }
        }

        int uploaded = 0, failed = 0;
        foreach (var g in DriveSampleCatalog.EnumerateAllGroups())
        {
            foreach (var fileName in g.Files)
            {
                try
                {
                    byte[] content;
                    if (fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                    {
                        content = BuildSamplePdf(g.Major, g.Subject, g.Code, g.Uid, g.Project, fileName);
                    }
                    else if (fileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
                    {
                        content = BuildSampleXlsx(g.Major, g.Subject, g.Code, g.Uid, g.Project, fileName);
                    }
                    else
                    {
                        content = BuildSampleDocx(g.Major, g.Subject, g.Code, g.Uid, g.Project, fileName);
                    }

                    var result = await _drive.UploadAcademicPdfAsync(
                        fileName, content, AcademicCategory.Project,
                        g.Subject, g.Project, g.Code, g.Uid, g.Project, g.Major,
                        documentFolderName: g.FolderName);

                    if (result.Success) uploaded++;
                    else
                    {
                        failed++;
                        _logger.LogWarning("Upload thất bại: {File} — {Err}", fileName, result.ErrorMessage);
                    }
                }
                catch (Exception ex)
                {
                    failed++;
                    _logger.LogWarning(ex, "Upload lỗi: {File}", fileName);
                }
            }
        }

        var msg = useMock
            ? $"Đã mô phỏng upload {uploaded} file (mock mode). Hangfire sẽ đồng bộ sang DB."
            : $"Đã upload {uploaded} file lên Google Drive ({failed} lỗi).";

        _logger.LogInformation("DriveSampleDataSeeder: {Message}", msg);
        return new DriveGenerateResult { Uploaded = uploaded, Failed = failed, Message = msg };
    }

    public static byte[] BuildSampleDocx(string major, string subject, string code, string uid, string project, string fileName)
    {
        var body = $"""
            ĐỒ ÁN MÔN HỌC — eThesis
            Chuyên ngành: {major}
            Học phần: {subject} ({code})
            MSSV: {uid}
            Tên đồ án: {project}
            Tài liệu: {fileName}

            CHƯƠNG 1. GIỚI THIỆU
            1.1. Lý do chọn đề tài
            Đề tài ứng dụng kiến thức {subject} vào bài toán thực tế tại UEF.

            1.2. Mục tiêu
            - Xây dựng hệ thống phần mềm hoàn chỉnh
            - Áp dụng quy trình phát triển hiện đại (Agile/Scrum)
            - Triển khai Full-Stack: React + ASP.NET Core + PostgreSQL

            CHƯƠNG 2. CƠ SỞ LÝ THUYẾT
            Trình bày các công nghệ và phương pháp liên quan đến {subject}.

            CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ
            Use case, ERD, kiến trúc hệ thống, giao diện người dùng.

            CHƯƠNG 4. CÀI ĐẶT VÀ KIỂM THỬ
            Triển khai module, kiểm thử chức năng và hiệu năng.

            CHƯƠNG 5. KẾT LUẬN
            Tổng kết kết quả và hướng phát triển.

            (eThesis — dữ liệu mẫu tự sinh cho Tra cứu / Lookup)
            """;

        return MinimalDocxBuilder.Create(body);
    }

    public static byte[] BuildSamplePdf(string major, string subject, string code, string uid, string project, string fileName)
    {
        var body = $"eThesis - Do An Mon Hoc: {project} - MSSV: {uid} - Mon hoc: {subject} ({code}) - Nganh: {major} - File: {fileName}";
        return MinimalPdfBuilder.Create(body);
    }

    public static byte[] BuildSampleXlsx(string major, string subject, string code, string uid, string project, string fileName)
    {
        var body = $"eThesis - Bang tinh cho do an {project} (MSSV: {uid}) - Mon hoc {subject} ({code})";
        return MinimalXlsxBuilder.Create("BangTinh", body);
    }
}

internal static class MinimalDocxBuilder
{
    public static byte[] Create(string plainText)
    {
        using var ms = new MemoryStream();
        using (var archive = new ZipArchive(ms, ZipArchiveMode.Create, true))
        {
            WriteEntry(archive, "[Content_Types].xml", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
                  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
                  <Default Extension="xml" ContentType="application/xml"/>
                  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
                </Types>
                """);

            WriteEntry(archive, "_rels/.rels", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
                </Relationships>
                """);

            var escaped = System.Security.SecurityElement.Escape(plainText) ?? plainText;
            var paragraphs = escaped.Split('\n').Select(line => $"<w:p><w:r><w:t xml:space=\"preserve\">{line}</w:t></w:r></w:p>");
            var documentXml = $"""
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                  <w:body>{string.Join("", paragraphs)}</w:body>
                </w:document>
                """;
            WriteEntry(archive, "word/document.xml", documentXml);
        }
        return ms.ToArray();
    }

    private static void WriteEntry(ZipArchive archive, string name, string content)
    {
        var entry = archive.CreateEntry(name, CompressionLevel.Fastest);
        using var writer = new StreamWriter(entry.Open(), new UTF8Encoding(false));
        writer.Write(content);
    }
}

internal static class MinimalPdfBuilder
{
    public static byte[] Create(string text)
    {
        var content = $"""
            %PDF-1.4
            1 0 obj
            << /Type /Catalog /Pages 2 0 R >>
            endobj
            2 0 obj
            << /Type /Pages /Kids [3 0 R] /Count 1 >>
            endobj
            3 0 obj
            << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>
            endobj
            4 0 obj
            << /Length {text.Length + 40} >>
            stream
            BT
            /F1 12 Tf
            70 750 Td
            ({text}) Tj
            ET
            endstream
            endobj
            xref
            0 5
            0000000000 65535 f 
            0000000009 00000 n 
            0000000058 00000 n 
            0000000115 00000 n 
            0000000270 00000 n 
            trailer
            << /Size 5 /Root 1 0 R >>
            startxref
            370
            %%EOF
            """;
        return Encoding.UTF8.GetBytes(content);
    }
}

internal static class MinimalXlsxBuilder
{
    public static byte[] Create(string sheetName, string cellValue)
    {
        using var ms = new MemoryStream();
        using (var archive = new ZipArchive(ms, ZipArchiveMode.Create, true))
        {
            WriteEntry(archive, "[Content_Types].xml", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
                  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
                  <Default Extension="xml" ContentType="application/xml"/>
                  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
                  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
                </Types>
                """);

            WriteEntry(archive, "_rels/.rels", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
                </Relationships>
                """);

            WriteEntry(archive, "xl/workbook.xml", $"""
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
                  <sheets>
                    <sheet name="{sheetName}" sheetId="1" r:id="rId1"/>
                  </sheets>
                </workbook>
                """);

            WriteEntry(archive, "xl/_rels/workbook.xml.rels", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/relationships/worksheet" Target="worksheets/sheet1.xml"/>
                </Relationships>
                """);

            WriteEntry(archive, "xl/worksheets/sheet1.xml", $"""
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
                  <sheetData>
                    <row r="1">
                      <c r="A1" t="inlineStr">
                        <is><t>{System.Security.SecurityElement.Escape(cellValue)}</t></is>
                      </c>
                    </row>
                  </sheetData>
                </worksheet>
                """);
        }
        return ms.ToArray();
    }

    private static void WriteEntry(ZipArchive archive, string name, string content)
    {
        var entry = archive.CreateEntry(name, CompressionLevel.Fastest);
        using var writer = new StreamWriter(entry.Open(), new UTF8Encoding(false));
        writer.Write(content);
    }
}
