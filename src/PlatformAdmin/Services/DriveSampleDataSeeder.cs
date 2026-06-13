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

            if (existingThesesCount < 10)
            {
                _logger.LogInformation("Database has only {Count} theses. Seeding all subjects and student groups into PostgreSQL...", existingThesesCount);

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
            }

            // Seed Topic and Thesis database records if they don't exist
            var hasTopics = await db.Theses.AnyAsync(t => t.Category == "Topic");
            var hasTheses = await db.Theses.AnyAsync(t => t.Category == "Thesis");

            if (!hasTopics || !hasTheses)
            {
                _logger.LogInformation("Seeding Topic and Thesis database records...");
                int topicUidCounter = 2026300;
                int thesisUidCounter = 2026400;

                foreach (var major in DriveSampleCatalog.Majors)
                {
                    if (!hasTopics)
                    {
                        topicUidCounter++;
                        var topicUid = $"SV{topicUidCounter}";
                        if (!userCache.TryGetValue(topicUid, out var topicStudent))
                        {
                            topicStudent = new User
                            {
                                FullName = $"Sinh viên Chuyên đề {topicUid}",
                                Email = $"{topicUid.ToLower()}@ethesis.edu.vn",
                                PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("student123"),
                                Role = "Student",
                                StudentId = topicUid,
                                Department = "Công nghệ thông tin",
                                IsActive = true,
                                CreatedAt = DateTime.UtcNow
                            };
                            db.Users.Add(topicStudent);
                            await db.SaveChangesAsync();
                            userCache[topicUid] = topicStudent;
                        }

                        var topicExists = await db.Theses.AnyAsync(t => t.StudentId == topicStudent.Id && t.Category == "Topic");
                        if (!topicExists)
                        {
                            var thesis = new Thesis
                            {
                                StudentId = topicStudent.Id,
                                AdvisorId = defaultAdvisor.Id,
                                Title = $"Nghiên cứu phát triển chuyên đề {major.DisplayName}",
                                Description = $"Đề tài chuyên đề thuộc chuyên ngành {major.DisplayName}. Dữ liệu tự động tự sinh.",
                                Major = major.MajorKey,
                                Subject = "Chuyên đề tốt nghiệp",
                                SubjectCode = "TOPIC101",
                                Category = "Topic",
                                Status = "Approved",
                                CreatedAt = DateTime.UtcNow.AddDays(-20),
                                UpdatedAt = DateTime.UtcNow
                            };
                            db.Theses.Add(thesis);
                        }
                    }

                    if (!hasTheses)
                    {
                        thesisUidCounter++;
                        var thesisUid = $"SV{thesisUidCounter}";
                        if (!userCache.TryGetValue(thesisUid, out var thesisStudent))
                        {
                            thesisStudent = new User
                            {
                                FullName = $"Sinh viên Khóa luận {thesisUid}",
                                Email = $"{thesisUid.ToLower()}@ethesis.edu.vn",
                                PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("student123"),
                                Role = "Student",
                                StudentId = thesisUid,
                                Department = "Công nghệ thông tin",
                                IsActive = true,
                                CreatedAt = DateTime.UtcNow
                            };
                            db.Users.Add(thesisStudent);
                            await db.SaveChangesAsync();
                            userCache[thesisUid] = thesisStudent;
                        }

                        var thesisExists = await db.Theses.AnyAsync(t => t.StudentId == thesisStudent.Id && t.Category == "Thesis");
                        if (!thesisExists)
                        {
                            var thesis = new Thesis
                            {
                                StudentId = thesisStudent.Id,
                                AdvisorId = defaultAdvisor.Id,
                                Title = $"Khóa luận tốt nghiệp chuyên sâu {major.DisplayName}",
                                Description = $"Đề tài khóa luận tốt nghiệp thuộc chuyên ngành {major.DisplayName}. Dữ liệu tự động tự sinh.",
                                Major = major.MajorKey,
                                Subject = "Khóa luận tốt nghiệp",
                                SubjectCode = "THESIS202",
                                Category = "Thesis",
                                Status = "Approved",
                                CreatedAt = DateTime.UtcNow.AddDays(-25),
                                UpdatedAt = DateTime.UtcNow
                            };
                            db.Theses.Add(thesis);
                        }
                    }
                }
                await db.SaveChangesAsync();
                _logger.LogInformation("Successfully seeded Topic and Thesis database records.");
            }
        }

        var existing = await _drive.CountFilesInCourseProjectStorageAsync();
        const int minDemoFiles = 80;

        var topicFilesList = await _drive.ListAcademicFilesRecursiveAsync(AcademicCategory.Topic);
        var thesisFilesList = await _drive.ListAcademicFilesRecursiveAsync(AcademicCategory.Thesis);
        bool needsTopicThesisSeed = topicFilesList.Count == 0 || thesisFilesList.Count == 0;

        if (!force && existing >= minDemoFiles && !needsTopicThesisSeed)
        {
            _logger.LogInformation("DriveSampleDataSeeder: Drive đã có {Count} file (>= {Min}) và đã seed Topic/Thesis — bỏ qua.", existing, minDemoFiles);
            return new DriveGenerateResult
            {
                Skipped = existing,
                Message = $"Drive đã có đủ {existing} file demo và Topic/Thesis đã được seed."
            };
        }

        _logger.LogInformation("DriveSampleDataSeeder: Bắt đầu tạo dữ liệu mẫu (force={Force}, needsTopicThesisSeed={NeedsTopicThesisSeed})...", force, needsTopicThesisSeed);

        int uploaded = 0, failed = 0;

        if (force || existing < minDemoFiles)
        {
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
        }

        // Seed Topic files directly under Chuyên ngành (Major)
        if (force || topicFilesList.Count == 0)
        {
            int tUid = 2026300;
            foreach (var major in DriveSampleCatalog.Majors)
            {
                tUid++;
                var studentUid = $"SV{tUid}";
                var title = $"Nghiên cứu phát triển chuyên đề {major.DisplayName}";
                
                string[] topicFiles = new[] { 
                    $"{studentUid}_Bao_cao_Chuyen_de.docx", 
                    $"{studentUid}_Slide_ThuyetTrinh.pdf", 
                    $"{studentUid}_Bang_tinh_Chi_phi.xlsx" 
                };

                foreach (var fileName in topicFiles)
                {
                    try
                    {
                        byte[] content;
                        if (fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                        {
                            content = BuildSamplePdf(major.DisplayName, title, "N/A", studentUid, title, fileName);
                        }
                        else if (fileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
                        {
                            content = BuildSampleXlsx(major.DisplayName, title, "N/A", studentUid, title, fileName);
                        }
                        else
                        {
                            content = BuildSampleDocx(major.DisplayName, title, "N/A", studentUid, title, fileName);
                        }

                        var result = await _drive.UploadAcademicPdfAsync(
                            fileName, content, AcademicCategory.Topic,
                            major.DisplayName, title, null, studentUid, title, major.DisplayName, null);

                        if (result.Success) uploaded++;
                        else failed++;
                    }
                    catch (Exception ex)
                    {
                        failed++;
                        _logger.LogWarning(ex, "Upload Topic lỗi: {File}", fileName);
                    }
                }
            }
        }

        // Seed Thesis files directly under Chuyên ngành (Major)
        if (force || thesisFilesList.Count == 0)
        {
            int thUid = 2026400;
            foreach (var major in DriveSampleCatalog.Majors)
            {
                thUid++;
                var studentUid = $"SV{thUid}";
                var title = $"Khóa luận tốt nghiệp chuyên sâu {major.DisplayName}";
                
                string[] thesisFiles = new[] { 
                    $"{studentUid}_Khoa_luan_Tot_nghiep.docx", 
                    $"{studentUid}_Slide_ThuyetTrinh.pdf", 
                    $"{studentUid}_Bang_tinh_Chi_phi.xlsx" 
                };

                foreach (var fileName in thesisFiles)
                {
                    try
                    {
                        byte[] content;
                        if (fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                        {
                            content = BuildSamplePdf(major.DisplayName, title, "N/A", studentUid, title, fileName);
                        }
                        else if (fileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
                        {
                            content = BuildSampleXlsx(major.DisplayName, title, "N/A", studentUid, title, fileName);
                        }
                        else
                        {
                            content = BuildSampleDocx(major.DisplayName, title, "N/A", studentUid, title, fileName);
                        }

                        var result = await _drive.UploadAcademicPdfAsync(
                            fileName, content, AcademicCategory.Thesis,
                            major.DisplayName, title, null, studentUid, title, major.DisplayName, null);

                        if (result.Success) uploaded++;
                        else failed++;
                    }
                    catch (Exception ex)
                    {
                        failed++;
                        _logger.LogWarning(ex, "Upload Thesis lỗi: {File}", fileName);
                    }
                }
            }
        }

        var msg = useMock
            ? $"Đã mô phỏng upload {uploaded} file (mock mode). Hangfire sẽ đồng bộ sang DB."
            : $"Đã upload {uploaded} file lên Google Drive ({failed} lỗi).";

        _logger.LogInformation("DriveSampleDataSeeder: {Message}", msg);
        return new DriveGenerateResult { Uploaded = uploaded, Failed = failed, Message = msg };
    }

    public static string RemoveDiacritics(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;
        var normalizedString = text.Normalize(System.Text.NormalizationForm.FormD);
        var stringBuilder = new StringBuilder();
        foreach (var c in normalizedString)
        {
            var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                if (c == 'đ') stringBuilder.Append('d');
                else if (c == 'Đ') stringBuilder.Append('D');
                else stringBuilder.Append(c);
            }
        }
        return stringBuilder.ToString().Normalize(System.Text.NormalizationForm.FormC);
    }

    public static byte[] BuildSampleDocx(string major, string subject, string code, string uid, string project, string fileName)
    {
        var cleanedMajor = RemoveDiacritics(major);
        var cleanedSubject = RemoveDiacritics(subject);
        var cleanedProject = RemoveDiacritics(project);
        var cleanedFileName = RemoveDiacritics(fileName);

        var body = $"""
            BAO CAO DO AN MON HOC - eThesis
            Hoc phan: {cleanedSubject} ({code})
            MSSV: {uid}
            Ten de tai: {cleanedProject}
            Chuyen nganh: {cleanedMajor}
            Tai lieu: {cleanedFileName}

            Tom tat: Do an nghien cuu va phat trien ung dung {cleanedProject}.
            """;

        return MinimalDocxBuilder.Create(body);
    }

    public static byte[] BuildSamplePdf(string major, string subject, string code, string uid, string project, string fileName)
    {
        var cleanedMajor = RemoveDiacritics(major);
        var cleanedSubject = RemoveDiacritics(subject);
        var cleanedProject = RemoveDiacritics(project);
        var cleanedFileName = RemoveDiacritics(fileName);

        var body = $"""
            eThesis Fallback PDF Report
            File name: {cleanedFileName}
            Student UID: {uid}
            Subject: {cleanedSubject} ({code})
            Major: {cleanedMajor}
            Project: {cleanedProject}

            Tom tat: Do an nghien cuu va phat trien ung dung {cleanedProject}.
            """;

        return MinimalPdfBuilder.Create(body);
    }

    public static byte[] BuildSampleXlsx(string major, string subject, string code, string uid, string project, string fileName)
    {
        var body = $"eThesis - Bang tinh cho do an {project} (MSSV: {uid}) - Mon hoc {subject} ({code})";
        return MinimalXlsxBuilder.Create("BangTinh", RemoveDiacritics(body));
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
        var streamContent = new StringBuilder();
        streamContent.AppendLine("BT");
        streamContent.AppendLine("/F1 12 Tf");
        streamContent.AppendLine("70 750 Td");
        streamContent.AppendLine("14 TL"); // Set leading to 14 points

        var lines = text.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
        foreach (var line in lines)
        {
            var escapedLine = line.Replace("(", "\\(").Replace(")", "\\)");
            streamContent.AppendLine($"({escapedLine}) '"); //apostrophe moves down and writes line
        }
        streamContent.AppendLine("ET");

        var streamBytes = Encoding.UTF8.GetBytes(streamContent.ToString());

        var pdf = new StringBuilder();
        pdf.AppendLine("%PDF-1.4");
        pdf.AppendLine("1 0 obj");
        pdf.AppendLine("<< /Type /Catalog /Pages 2 0 R >>");
        pdf.AppendLine("endobj");
        pdf.AppendLine("2 0 obj");
        pdf.AppendLine("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
        pdf.AppendLine("endobj");
        pdf.AppendLine("3 0 obj");
        pdf.AppendLine("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>");
        pdf.AppendLine("endobj");
        pdf.AppendLine("4 0 obj");
        pdf.AppendLine($"<< /Length {streamBytes.Length} >>");
        pdf.AppendLine("stream");

        var headerBytes = Encoding.UTF8.GetBytes(pdf.ToString());

        using var ms = new MemoryStream();
        ms.Write(headerBytes, 0, headerBytes.Length);
        ms.Write(streamBytes, 0, streamBytes.Length);

        var footer = "\r\nendstream\r\nendobj\r\nxref\r\n0 5\r\n0000000000 65535 f \r\n0000000009 00000 n \r\n0000000058 00000 n \r\n0000000115 00000 n \r\n0000000270 00000 n \r\ntrailer\r\n<< /Size 5 /Root 1 0 R >>\r\nstartxref\r\n370\r\n%%EOF\r\n";
        var footerBytes = Encoding.UTF8.GetBytes(footer);
        ms.Write(footerBytes, 0, footerBytes.Length);

        return ms.ToArray();
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
