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
            var allUsers = await db.Users.ToListAsync();
            var userCache = new Dictionary<string, User>(StringComparer.OrdinalIgnoreCase);
            foreach (var u in allUsers)
            {
                var key = u.StudentId ?? u.Email;
                if (!string.IsNullOrEmpty(key))
                {
                    userCache[key] = u;
                }
            }

            var defaultAdvisor = await db.Users.FirstOrDefaultAsync(u => u.Role == "Advisor")
                ?? new User
                {
                    FullName = "Dr. Nguyen Van A",
                    Email = "advisor@ethesis.edu.vn",
                    PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("123"),
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
                            PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("123"),
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

            // Seed Topic and Thesis database records if they don't exist (need at least 60 of each)
            var topicCount = await db.Theses.CountAsync(t => t.Category == "Topic");
            var thesisCount = await db.Theses.CountAsync(t => t.Category == "Thesis");

            if (topicCount < 60 || thesisCount < 60)
            {
                _logger.LogInformation("Seeding Topic and Thesis database records (Topic count={TopicCount}, Thesis count={ThesisCount})...", topicCount, thesisCount);
                
                int majorIndex = -1;
                foreach (var major in DriveSampleCatalog.Majors)
                {
                    majorIndex++;
                    var topicTitles = DriveSampleCatalog.TopicTitles[major.MajorKey];
                    var thesisTitles = DriveSampleCatalog.ThesisTitles[major.MajorKey];

                    for (int k = 1; k <= 10; k++)
                    {
                        var topicUid = $"SV{2026300 + majorIndex * 10 + k}";
                        var topicTitle = topicTitles[k - 1];

                        if (!userCache.TryGetValue(topicUid, out var topicStudent))
                        {
                            topicStudent = new User
                            {
                                FullName = $"Sinh viên Chuyên đề {topicUid}",
                                Email = $"{topicUid.ToLower()}@ethesis.edu.vn",
                                PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("123"),
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
                                Title = topicTitle,
                                Description = $"Đề tài chuyên đề thuộc chuyên ngành {major.DisplayName}. Dữ liệu tự động tự sinh.",
                                Major = major.MajorKey,
                                Subject = "Chuyên đề tốt nghiệp",
                                SubjectCode = "TOPIC101",
                                Category = "Topic",
                                Status = "Approved",
                                CreatedAt = DateTime.UtcNow.AddDays(-20 + k),
                                UpdatedAt = DateTime.UtcNow
                            };
                            db.Theses.Add(thesis);
                        }

                        var thesisUid = $"SV{2026400 + majorIndex * 10 + k}";
                        var thesisTitle = thesisTitles[k - 1];

                        if (!userCache.TryGetValue(thesisUid, out var thesisStudent))
                        {
                            thesisStudent = new User
                            {
                                FullName = $"Sinh viên Khóa luận {thesisUid}",
                                Email = $"{thesisUid.ToLower()}@ethesis.edu.vn",
                                PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("123"),
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
                                Title = thesisTitle,
                                Description = $"Đề tài khóa luận tốt nghiệp thuộc chuyên ngành {major.DisplayName}. Dữ liệu tự động tự sinh.",
                                Major = major.MajorKey,
                                Subject = "Khóa luận tốt nghiệp",
                                SubjectCode = "THESIS202",
                                Category = "Thesis",
                                Status = "Approved",
                                CreatedAt = DateTime.UtcNow.AddDays(-25 + k),
                                UpdatedAt = DateTime.UtcNow
                            };
                            db.Theses.Add(thesis);
                        }
                    }
                }
                await db.SaveChangesAsync();
                _logger.LogInformation("Successfully seeded Topic and Thesis database records.");
            }

            // Seed custom student: Nguyễn Hoàng Phúc (runs unconditionally)
            var customUid = "225050646";
            if (!userCache.TryGetValue(customUid, out var customStudent))
            {
                customStudent = new User
                {
                    FullName = "Nguyễn Hoàng Phúc",
                    Email = "225050646@ethesis.edu.vn",
                    PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("123"),
                    Role = "Student",
                    StudentId = customUid,
                    Department = "Công nghệ thông tin",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                db.Users.Add(customStudent);
                await db.SaveChangesAsync();
                userCache[customUid] = customStudent;
            }

            var customThesisExists = await db.Theses.AnyAsync(t => t.StudentId == customStudent.Id && t.Title == "Xây dựng hệ thống quản lý và kiểm tra đạo văn khóa luận tốt nghiệp eThesis");
            
            // Ensure the docx files exist in the uploads directory so they can be dynamically converted
            var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);
            
            // First file
            var targetDocxPath = Path.Combine(uploadsDir, "225050646_NguyenHoangPhuc.docx");
            var sourceDocxPath = "";
            try
            {
                var mockDriveRoot = Path.Combine(Directory.GetCurrentDirectory(), "mock_google_drive");
                if (Directory.Exists(mockDriveRoot))
                {
                    sourceDocxPath = Directory.GetFiles(mockDriveRoot, "225050646_NguyenHoangPhuc.docx", SearchOption.AllDirectories).FirstOrDefault() ?? "";
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to search for custom docx template.");
            }

            if (!string.IsNullOrEmpty(sourceDocxPath) && File.Exists(sourceDocxPath))
            {
                try
                {
                    File.Copy(sourceDocxPath, targetDocxPath, true);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to copy custom docx template to uploads folder.");
                }
            }

            // Second file (new sample data)
            var targetDocxPathNew = Path.Combine(uploadsDir, "225050646_NguyenHoangPhuc_New.docx");
            var sourceDocxPathNew = "";
            try
            {
                var mockDriveRoot = Path.Combine(Directory.GetCurrentDirectory(), "mock_google_drive");
                if (Directory.Exists(mockDriveRoot))
                {
                    sourceDocxPathNew = Directory.GetFiles(mockDriveRoot, "225050646_NguyenHoangPhuc (2).docx", SearchOption.AllDirectories).FirstOrDefault() ?? "";
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to search for custom docx template new.");
            }

            if (!string.IsNullOrEmpty(sourceDocxPathNew) && File.Exists(sourceDocxPathNew))
            {
                try
                {
                    File.Copy(sourceDocxPathNew, targetDocxPathNew, true);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to copy custom docx template new to uploads folder.");
                }
            }

            // Seed Thesis 1
            if (!customThesisExists)
            {
                var thesis = new Thesis
                {
                    StudentId = customStudent.Id,
                    AdvisorId = defaultAdvisor.Id,
                    Title = "Xây dựng hệ thống quản lý và kiểm tra đạo văn khóa luận tốt nghiệp eThesis",
                    Description = "Đề tài nghiên cứu khoa học chuyên sâu về quản lý tài liệu học thuật và tích hợp công nghệ phân tích đạo văn thời gian thực.",
                    Major = "software-engineering",
                    Subject = "Khóa luận tốt nghiệp",
                    SubjectCode = "THESIS202",
                    Category = "Thesis",
                    Status = "Approved",
                    FilePath = "/uploads/225050646_NguyenHoangPhuc.docx",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                db.Theses.Add(thesis);
                await db.SaveChangesAsync();
            }
            else
            {
                // Force update existing record's FilePath to point to the docx
                var existingThesis = await db.Theses.FirstOrDefaultAsync(t => t.StudentId == customStudent.Id && t.Title == "Xây dựng hệ thống quản lý và kiểm tra đạo văn khóa luận tốt nghiệp eThesis");
                if (existingThesis != null)
                {
                    existingThesis.FilePath = "/uploads/225050646_NguyenHoangPhuc.docx";
                    await db.SaveChangesAsync();
                }
            }

            // Seed Thesis 2 (New Thesis)
            const string newThesisTitle = "Nghiên cứu ứng dụng Học máy trong Phát hiện bất thường mạng";
            var customThesisNewExists = await db.Theses.AnyAsync(t => t.StudentId == customStudent.Id && t.Title == newThesisTitle);
            if (!customThesisNewExists)
            {
                var thesis = new Thesis
                {
                    StudentId = customStudent.Id,
                    AdvisorId = defaultAdvisor.Id,
                    Title = newThesisTitle,
                    Description = "Nghiên cứu các thuật toán học máy giám sát và bán giám sát áp dụng vào phát hiện các mối đe dọa và hành vi bất thường trên hạ tầng mạng UEF.",
                    Major = "information-security",
                    Subject = "Khóa luận tốt nghiệp",
                    SubjectCode = "THESIS203",
                    Category = "Thesis",
                    Status = "Approved",
                    FilePath = "/uploads/225050646_NguyenHoangPhuc_New.docx",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                db.Theses.Add(thesis);
                await db.SaveChangesAsync();
            }
            else
            {
                var existingThesis = await db.Theses.FirstOrDefaultAsync(t => t.StudentId == customStudent.Id && t.Title == newThesisTitle);
                if (existingThesis != null)
                {
                    existingThesis.FilePath = "/uploads/225050646_NguyenHoangPhuc_New.docx";
                    await db.SaveChangesAsync();
                }
            }
        }

        var existing = await _drive.CountFilesInCourseProjectStorageAsync();
        const int minDemoFiles = 80;

        var topicFilesList = await _drive.ListAcademicFilesRecursiveAsync(AcademicCategory.Topic);
        var thesisFilesList = await _drive.ListAcademicFilesRecursiveAsync(AcademicCategory.Thesis);
        bool needsTopicThesisSeed = topicFilesList.Count < 180 || thesisFilesList.Count < 180;

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
        if (force || topicFilesList.Count < 180)
        {
            int majorIndex = -1;
            foreach (var major in DriveSampleCatalog.Majors)
            {
                majorIndex++;
                var topicTitles = DriveSampleCatalog.TopicTitles[major.MajorKey];

                for (int k = 1; k <= 10; k++)
                {
                    var studentUid = $"SV{2026300 + majorIndex * 10 + k}";
                    var title = topicTitles[k - 1];

                    // Clean up old xlsx files on Google Drive for this student
                    var oldXlsxFiles = topicFilesList.Where(f => f.StudentUid == studentUid && f.Name.EndsWith("_Bang_tinh_Chi_phi.xlsx", StringComparison.OrdinalIgnoreCase)).ToList();
                    foreach (var oldFile in oldXlsxFiles)
                    {
                        _logger.LogInformation("Deleting obsolete XLSX file '{FileName}' for student {StudentUid} on Google Drive", oldFile.Name, studentUid);
                        await _drive.DeleteFileAsync(oldFile.Id, AcademicCategory.Topic);
                    }

                    string[] topicFiles = new[] { 
                        $"{studentUid}_Bao_cao_Chuyen_de.docx", 
                        $"{studentUid}_Slide_ThuyetTrinh.pdf", 
                        $"{studentUid}_README.docx" 
                    };

                    foreach (var fileName in topicFiles)
                    {
                        try
                        {
                            // Avoid uploading existing file (except README which we want to update)
                            var fileExists = topicFilesList.Any(f => f.StudentUid == studentUid && f.Name == fileName);
                            bool forceThisFile = fileName.Contains("README", StringComparison.OrdinalIgnoreCase);
                            if (fileExists && !force && !forceThisFile)
                            {
                                continue;
                            }

                            byte[] content;
                            if (fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                            {
                                content = BuildSamplePdf(major.DisplayName, "Chuyên đề tốt nghiệp", "TOPIC101", studentUid, title, fileName);
                            }
                            else
                            {
                                content = BuildSampleDocx(major.DisplayName, "Chuyên đề tốt nghiệp", "TOPIC101", studentUid, title, fileName);
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
        }

        // Seed Thesis files directly under Chuyên ngành (Major)
        if (force || thesisFilesList.Count < 180)
        {
            int majorIndex = -1;
            foreach (var major in DriveSampleCatalog.Majors)
            {
                majorIndex++;
                var thesisTitles = DriveSampleCatalog.ThesisTitles[major.MajorKey];

                for (int k = 1; k <= 10; k++)
                {
                    var studentUid = $"SV{2026400 + majorIndex * 10 + k}";
                    var title = thesisTitles[k - 1];

                    // Clean up old xlsx files on Google Drive for this student
                    var oldXlsxFiles = thesisFilesList.Where(f => f.StudentUid == studentUid && f.Name.EndsWith("_Bang_tinh_Chi_phi.xlsx", StringComparison.OrdinalIgnoreCase)).ToList();
                    foreach (var oldFile in oldXlsxFiles)
                    {
                        _logger.LogInformation("Deleting obsolete XLSX file '{FileName}' for student {StudentUid} on Google Drive", oldFile.Name, studentUid);
                        await _drive.DeleteFileAsync(oldFile.Id, AcademicCategory.Thesis);
                    }

                    string[] thesisFiles = new[] { 
                        $"{studentUid}_Khoa_luan_Tot_nghiep.docx", 
                        $"{studentUid}_Slide_ThuyetTrinh.pdf", 
                        $"{studentUid}_README.docx" 
                    };

                    foreach (var fileName in thesisFiles)
                    {
                        try
                        {
                            // Avoid uploading existing file (except README which we want to update)
                            var fileExists = thesisFilesList.Any(f => f.StudentUid == studentUid && f.Name == fileName);
                            bool forceThisFile = fileName.Contains("README", StringComparison.OrdinalIgnoreCase);
                            if (fileExists && !force && !forceThisFile)
                            {
                                continue;
                            }

                            byte[] content;
                            if (fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                            {
                                content = BuildSamplePdf(major.DisplayName, "Khóa luận tốt nghiệp", "THESIS202", studentUid, title, fileName);
                            }
                            else
                            {
                                content = BuildSampleDocx(major.DisplayName, "Khóa luận tốt nghiệp", "THESIS202", studentUid, title, fileName);
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

        string body;
        if (fileName.Contains("README", StringComparison.OrdinalIgnoreCase))
        {
            body = $"""
                THONG TIN TAI LIEU THAM KHAO (README) - UEF eThesis
                =================================================
                Ma so sinh vien: {uid}
                Ten de tai: {cleanedProject}
                Chuyen nganh: {cleanedMajor}
                Phan loai: {cleanedSubject}
                
                1. GIOI THIEU DE TAI
                   Tai lieu nay thuoc he thong thu vien so khoa luan va chuyen de tot nghiep.
                   De tai tap trung nghien cuu ve: {cleanedProject}.
                
                2. NOI DUNG NGHIEU CUU
                   - Tim hieu ly thuyet lien quan va cac nghien cuu truoc day.
                   - Nghien cuu giai phap ung dung thuc tien.
                   - Nhan xet, danh gia ket qua va dinh huong phat trien.
                
                3. HUONG DAN SU DUNG & THAM KHAO
                   - Day la tai lieu luu tru de doc va tham khao hoc thuat.
                   - Nghiem cam sao chep duoi moi hinh thuc khi chua duoc su dong y cua tac gia va nha truong.
                """;
        }
        else if (fileName.Contains("Chuyen_de", StringComparison.OrdinalIgnoreCase))
        {
            body = $"""
                BAO CAO CHUYEN DE TOT NGHIEP - UEF eThesis
                =========================================
                Chuyen nganh: {cleanedMajor}
                MSSV: {uid}
                Ten de tai: {cleanedProject}
                
                Tom tat:
                Chuyen de tot nghiep trinh bay cac ket qua nghien cuu thuc nghiem,
                phan tich thiet ke va danh gia chi tiet he thong ve {cleanedProject}.
                """;
        }
        else if (fileName.Contains("Khoa_luan", StringComparison.OrdinalIgnoreCase))
        {
            body = $"""
                KHOA LUAN TOT NGHIEP - UEF eThesis
                ==================================
                Chuyen nganh: {cleanedMajor}
                MSSV: {uid}
                Ten de tai: {cleanedProject}
                
                Tom tat:
                Khoa luan tot nghiep tap trung nghien cuu sau ve ly thuyet va
                trien khai ung dung thuc tien he thong {cleanedProject}.
                """;
        }
        else
        {
            body = $"""
                BAO CAO DO AN MON HOC - eThesis
                Hoc phan: {cleanedSubject} ({code})
                MSSV: {uid}
                Ten de tai: {cleanedProject}
                Chuyen nganh: {cleanedMajor}
                Tai lieu: {cleanedFileName}

                Tom tat: Do an nghien cuu va phat trien ung dung {cleanedProject}.
                """;
        }

        return MinimalDocxBuilder.Create(body);
    }

    public static byte[] BuildSamplePdf(string major, string subject, string code, string uid, string project, string fileName)
    {
        var cleanedMajor = RemoveDiacritics(major);
        var cleanedSubject = RemoveDiacritics(subject);
        var cleanedProject = RemoveDiacritics(project);
        var cleanedFileName = RemoveDiacritics(fileName);

        string categoryLabel = "DO AN MON HOC";
        string docLabel = "Do an";
        if (subject.Contains("Chuyên đề", StringComparison.OrdinalIgnoreCase))
        {
            categoryLabel = "CHUYEN DE TOT NGHIEP";
            docLabel = "Chuyen de";
        }
        else if (subject.Contains("Khóa luận", StringComparison.OrdinalIgnoreCase))
        {
            categoryLabel = "KHOA LUAN TOT NGHIEP";
            docLabel = "Khoa luan";
        }

        var page1 = $"""
            eThesis Fallback PDF Report - Page 1 (Cover Page)
            ------------------------------------------------
            File name: {cleanedFileName}
            Student UID: {uid}
            Type: {categoryLabel}
            Major: {cleanedMajor}
            Project: {cleanedProject}

            Tom tat: {docLabel} nghien cuu va phat trien ung dung {cleanedProject}.
            """;

        var page2 = $"""
            eThesis Fallback PDF Report - Page 2 (Literature Review)
            ------------------------------------------------
            Research Topic: {cleanedProject}
            Student: {uid}
            
            1. Introduction
            This research addresses key challenges in {cleanedMajor}. 
            We investigate various methodologies and state-of-the-art architectures.
            
            2. Related Work
            Prior studies in {cleanedSubject} have proposed several frameworks.
            However, limitations in performance and security remain to be solved.
            """;

        var page3 = $"""
            eThesis Fallback PDF Report - Page 3 (Methodology & Conclusion)
            ------------------------------------------------
            Research Topic: {cleanedProject}
            Student: {uid}

            3. Proposed Methodology
            We design an integrated system using secure cloud technologies.
            The experimental results demonstrate a significant improvement in efficiency.

            4. Conclusion
            This {docLabel.ToLower()} successfully achieves its primary objectives.
            Future work will focus on integrating advanced machine learning techniques.
            """;

        var page4 = $"""
            eThesis Fallback PDF Report - Page 4 (Evaluation & References)
            ------------------------------------------------
            Research Topic: {cleanedProject}
            Student: {uid}

            5. Evaluation Results
            The proposed system was evaluated against baseline configurations.
            We observed a 15% reduction in request latency and 99.9% uptime.

            6. References
            [1] Author A, "Advanced Systems in {cleanedMajor}", Journal of eThesis, 2025.
            [2] Author B, "Research and Applications in {cleanedSubject}", UEF Press, 2026.
            """;

        var body = $"{page1}\n---\n{page2}\n---\n{page3}\n---\n{page4}";
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
        var pageDelimiters = new[] { "\n---\n", "\r\n---\r\n" };
        var pagesText = text.Split(pageDelimiters, StringSplitOptions.RemoveEmptyEntries)
                            .Select(p => p.Trim())
                            .ToList();

        if (pagesText.Count == 0)
        {
            pagesText.Add("eThesis Empty Document");
        }

        var streams = new List<byte[]>();
        foreach (var pageText in pagesText)
        {
            var streamContent = new StringBuilder();
            streamContent.AppendLine("BT");
            streamContent.AppendLine("/F1 12 Tf");
            streamContent.AppendLine("70 750 Td");
            streamContent.AppendLine("14 TL"); // Set leading to 14 points

            var lines = pageText.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
            foreach (var line in lines)
            {
                var escapedLine = line.Replace("(", "\\(").Replace(")", "\\)");
                streamContent.AppendLine($"({escapedLine}) '"); // apostrophe moves down and writes line
            }
            streamContent.AppendLine("ET");
            streams.Add(Encoding.UTF8.GetBytes(streamContent.ToString()));
        }

        using var ms = new MemoryStream();
        using (var writer = new StreamWriter(ms, new UTF8Encoding(false)))
        {
            writer.Write("%PDF-1.4\r\n");

            // 1 0 obj: Catalog
            writer.Write("1 0 obj\r\n<< /Type /Catalog /Pages 2 0 R >>\r\nendobj\r\n");

            // 2 0 obj: Pages
            var kidsStr = string.Join(" ", Enumerable.Range(0, pagesText.Count).Select(i => $"{(3 + i * 2)} 0 R"));
            writer.Write($"2 0 obj\r\n<< /Type /Pages /Kids [{kidsStr}] /Count {pagesText.Count} >>\r\nendobj\r\n");
            writer.Flush();

            for (int i = 0; i < pagesText.Count; i++)
            {
                int pageObjId = 3 + i * 2;
                int streamObjId = pageObjId + 1;

                // Page object
                writer.Write($"{pageObjId} 0 obj\r\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents {streamObjId} 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\r\nendobj\r\n");

                // Stream object
                var streamBytes = streams[i];
                writer.Write($"{streamObjId} 0 obj\r\n<< /Length {streamBytes.Length} >>\r\nstream\r\n");
                writer.Flush();

                ms.Write(streamBytes, 0, streamBytes.Length);

                writer.Write("\r\nendstream\r\nendobj\r\n");
                writer.Flush();
            }

            // Footer (xref and trailer)
            writer.Write("xref\r\n0 1\r\n0000000000 65535 f \r\n");
            writer.Write($"trailer\r\n<< /Size {(3 + pagesText.Count * 2)} /Root 1 0 R >>\r\nstartxref\r\n370\r\n%%EOF\r\n");
            writer.Flush();
        }

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
