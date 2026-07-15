using PlatformAdmin.DTOs.Thesis;
using PlatformAdmin.Interfaces;
using PlatformAdmin.Entities;
using PlatformAdmin.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Hangfire;
using PlatformAdmin.Jobs;

namespace PlatformAdmin.Services;

public class ThesisService : IThesisService
{
    private readonly AppDbContext _db;
    private readonly string _uploadPath;
    private readonly IGoogleDriveStorageService _driveService;
    private readonly Microsoft.AspNetCore.SignalR.IHubContext<NotificationHub> _hubContext;

    public ThesisService(AppDbContext db, IGoogleDriveStorageService driveService, Microsoft.AspNetCore.SignalR.IHubContext<NotificationHub> hubContext)
    {
        _db = db;
        _driveService = driveService;
        _hubContext = hubContext;
        _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        Directory.CreateDirectory(_uploadPath);
    }

    private IQueryable<Thesis> BaseQuery() => _db.Theses
        .Include(t => t.Student)
        .Include(t => t.Advisor)
        .Include(t => t.Reviews)
        .Include(t => t.Submissions);

    private static ThesisDto Map(Thesis t) => new(
        t.Id, t.Title, t.Description, t.Status, t.FilePath,
        t.CreatedAt, t.UpdatedAt, t.SubmittedAt, t.ApprovedAt,
        t.StudentId, t.Student.FullName, t.Student.StudentId,
        t.AdvisorId, t.Advisor?.FullName,
        t.Student.Department,
        t.Reviews.Count,
        t.Reviews.Any() ? t.Reviews.Max(r => r.Score) : null,
        t.Major,
        t.Subject,
        t.SubjectCode,
        t.Category,
        t.Batch,
        t.Submissions?.Select(s => new ThesisSubmissionDto(s.Id, s.FileName, s.FilePath, s.FileSize, s.SubmittedAt)).ToList()
    );

    public async Task<ThesisListResponse> GetAllAsync(int page, int pageSize, string? status, string? search, int? studentId, int? advisorId, string? category = null, int? batch = null)
    {
        var q = BaseQuery().AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(t => t.Status == status);
        if (!string.IsNullOrEmpty(search)) q = q.Where(t => t.Title.Contains(search) || t.Student.FullName.Contains(search) || t.Student.StudentId.Contains(search));
        
        if (studentId.HasValue && advisorId.HasValue)
        {
            q = q.Where(t => t.StudentId == studentId || t.AdvisorId == advisorId || t.Status == "Approved");
        }
        else if (studentId.HasValue)
        {
            q = q.Where(t => t.StudentId == studentId || t.Status == "Approved" || t.Status == "Submitted" || t.Status == "UnderReview");
        }
        else if (advisorId.HasValue)
        {
            q = q.Where(t => t.AdvisorId == advisorId || t.Status == "Approved");
        }

        if (!string.IsNullOrEmpty(category)) q = q.Where(t => t.Category == category);
        if (batch.HasValue) q = q.Where(t => t.Batch == batch.Value);

        var total = await q.CountAsync();
        var items = await q.OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new ThesisListResponse(items.Select(Map), total, page, pageSize);
    }

    public async Task<ThesisDto?> GetByIdAsync(int id)
    {
        var t = await BaseQuery().FirstOrDefaultAsync(t => t.Id == id);
        return t is null ? null : Map(t);
    }

    public async Task<ThesisDto> CreateAsync(int studentId, CreateThesisRequest request)
    {
        var thesis = new Thesis
        {
            Title = request.Title,
            Description = request.Description,
            StudentId = studentId,
            Status = string.IsNullOrEmpty(request.Status) ? "Pending" : request.Status,
            CreatedAt = DateTime.UtcNow,
            Major = request.Major,
            Subject = request.Subject,
            SubjectCode = request.SubjectCode,
            Category = request.Category,
            AdvisorId = request.AdvisorId == 0 ? null : request.AdvisorId,
            FilePath = request.FilePath,
            Batch = request.Batch
        };
        _db.Theses.Add(thesis);
        await _db.SaveChangesAsync();

        if (thesis.Category == "Project")
        {
            // Sync to Google Drive via Hangfire
            BackgroundJob.Enqueue<DriveSyncJob>(x => x.SyncThesisToDriveAsync(thesis.Id));
        }

        // Notify Advisor if assigned
        if (thesis.AdvisorId.HasValue && thesis.AdvisorId.Value > 0)
        {
            var student = await _db.Users.FindAsync(studentId);
            var studentName = student?.FullName ?? "Sinh viên";
            await DispatchNotificationAsync(thesis.AdvisorId.Value, "Đề tài mới được đăng ký", $"Sinh viên {studentName} đã đăng ký hướng dẫn đề tài: {thesis.Title} [link:/lecturer/controller/{thesis.Id}]");
        }

        return Map(await BaseQuery().FirstAsync(t => t.Id == thesis.Id));
    }

    public async Task<ThesisDto> UpdateAsync(int id, UpdateThesisRequest request)
    {
        var thesis = await _db.Theses.FindAsync(id) ?? throw new KeyNotFoundException();
        thesis.Title = request.Title;
        thesis.Description = request.Description;
        thesis.Major = request.Major;
        thesis.Subject = request.Subject;
        thesis.SubjectCode = request.SubjectCode;
        thesis.Category = request.Category;
        thesis.Batch = request.Batch;
        if (request.StudentId.HasValue && request.StudentId.Value != 0)
        {
            thesis.StudentId = request.StudentId.Value;
        }
        if (request.AdvisorId.HasValue)
        {
            thesis.AdvisorId = request.AdvisorId.Value == 0 ? null : request.AdvisorId;
        }
        if (!string.IsNullOrEmpty(request.Status))
        {
            thesis.Status = request.Status;
        }
        if (request.FilePath != null)
        {
            thesis.FilePath = request.FilePath == "" ? null : request.FilePath;
        }
        thesis.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Map(await BaseQuery().FirstAsync(t => t.Id == id));
    }

    public async Task DeleteAsync(int id)
    {
        var thesis = await BaseQuery().FirstOrDefaultAsync(t => t.Id == id) ?? throw new KeyNotFoundException();

        if (thesis.Category == "Project" && thesis.Student != null)
        {
            var studentUid = thesis.Student.StudentId ?? $"SV{thesis.StudentId}";
            var sanitizedName = DrivePathParser.SanitizeFolderName(thesis.Title);
            var folderName = $"Nhom01_{sanitizedName}_{studentUid}";
            
            // Delete folder from Drive
            BackgroundJob.Enqueue<DriveSyncJob>(job => job.DeleteDriveFolderAsync(folderName, AcademicCategory.Project));
            
            // Clean up any local DriveFileRecords
            var relatedRecords = await _db.DriveFileRecords
                .Where(r => r.StudentUid == studentUid && r.SubjectCode == thesis.SubjectCode)
                .ToListAsync();
            foreach (var record in relatedRecords)
            {
                record.IsActive = false;
            }
        }

        _db.Theses.Remove(thesis);
        await _db.SaveChangesAsync();
    }

    public async Task<ThesisDto> SubmitAsync(int id)
    {
        var thesis = await _db.Theses.FindAsync(id) ?? throw new KeyNotFoundException();
        thesis.Status = "Submitted";
        thesis.SubmittedAt = DateTime.UtcNow;
        thesis.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Map(await BaseQuery().FirstAsync(t => t.Id == id));
    }

    public async Task<ThesisDto> AssignAdvisorAsync(int id, AssignAdvisorRequest request)
    {
        var thesis = await _db.Theses.FindAsync(id) ?? throw new KeyNotFoundException();
        thesis.AdvisorId = request.AdvisorId;
        thesis.Status = "InProgress";
        thesis.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Notify Advisor
        await DispatchNotificationAsync(request.AdvisorId, "Phân công hướng dẫn đề tài", $"Bạn đã được phân công hướng dẫn đề tài: {thesis.Title} [link:/lecturer/controller/{thesis.Id}]");

        // Notify Student
        await DispatchNotificationAsync(thesis.StudentId, "Phân công giảng viên hướng dẫn", $"Đề tài {thesis.Title} của bạn đã được phân công cho giảng viên hướng dẫn. [link:/theses/{thesis.Id}]");

        return Map(await BaseQuery().FirstAsync(t => t.Id == id));
    }

    public async Task<ThesisDto> ApproveAsync(int id)
    {
        var thesis = await _db.Theses.FindAsync(id) ?? throw new KeyNotFoundException();
        thesis.Status = "Approved";
        thesis.ApprovedAt = DateTime.UtcNow;
        thesis.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Notify Student
        await DispatchNotificationAsync(thesis.StudentId, "Đề tài đã được phê duyệt", $"Đề tài {thesis.Title} của bạn đã được duyệt thành công. [link:/theses/{thesis.Id}]");

        return Map(await BaseQuery().FirstAsync(t => t.Id == id));
    }

    public async Task<ThesisDto> RejectAsync(int id, string reason)
    {
        var thesis = await _db.Theses.FindAsync(id) ?? throw new KeyNotFoundException();
        thesis.Status = "Rejected";
        thesis.RejectReason = reason;
        thesis.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Notify Student
        await DispatchNotificationAsync(thesis.StudentId, "Đề tài bị từ chối", $"Đề tài {thesis.Title} của bạn đã bị từ chối. Lý do: {reason}. [link:/theses/{thesis.Id}]");

        return Map(await BaseQuery().FirstAsync(t => t.Id == id));
    }

    public async Task<ThesisDto> SetRevisionAsync(int id)
    {
        var thesis = await _db.Theses.FindAsync(id) ?? throw new KeyNotFoundException();
        thesis.Status = "Revision";
        thesis.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Notify Student
        await DispatchNotificationAsync(thesis.StudentId, "Yêu cầu chỉnh sửa đề tài", $"Đề tài {thesis.Title} của bạn có yêu cầu chỉnh sửa từ giảng viên. [link:/theses/{thesis.Id}]");

        return Map(await BaseQuery().FirstAsync(t => t.Id == id));
    }

    public async Task<string> UploadFileAsync(int id, Stream fileStream, string fileName, string contentType)
    {
        var thesis = await _db.Theses.Include(t => t.Student).FirstOrDefaultAsync(t => t.Id == id) ?? throw new KeyNotFoundException();
        
        // Read file bytes
        byte[] fileBytes;
        using (var memoryStream = new MemoryStream())
        {
            await fileStream.CopyToAsync(memoryStream);
            fileBytes = memoryStream.ToArray();
        }

        // Save locally first as a backup
        var ext = Path.GetExtension(fileName);
        var savedName = $"thesis_{id}_{DateTime.UtcNow.Ticks}{ext}";
        var fullPath = Path.Combine(_uploadPath, savedName);
        await File.WriteAllBytesAsync(fullPath, fileBytes);

        // Upload to Google Drive matching standard majors and subjects
        AcademicCategory driveCategory = AcademicCategory.Project;
        if (Enum.TryParse<AcademicCategory>(thesis.Category, true, out var parsedCategory))
        {
            driveCategory = parsedCategory;
        }

        var majorDisplayName = GetMajorDisplayName(thesis.Major);

        var driveResult = await _driveService.UploadAcademicPdfAsync(
            fileName,
            fileBytes,
            driveCategory,
            driveCategory == AcademicCategory.Project ? (thesis.Subject ?? "General") : majorDisplayName,
            thesis.Title,
            thesis.SubjectCode,
            thesis.Student?.StudentId ?? "UnknownUid",
            thesis.Title,
            majorDisplayName
        );

        string finalPath = driveResult.Success ? driveResult.SharedWebUrl : $"/uploads/{savedName}";

        var submission = new ThesisSubmission
        {
            ThesisId = id,
            FilePath = finalPath,
            FileName = fileName,
            FileSize = fileBytes.Length,
            Version = await _db.ThesisSubmissions.CountAsync(s => s.ThesisId == id) + 1,
            SubmittedAt = DateTime.UtcNow
        };
        _db.ThesisSubmissions.Add(submission);

        thesis.FilePath = finalPath;
        thesis.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return thesis.FilePath;
    }

    private static string GetMajorDisplayName(string? majorKey)
    {
        if (string.IsNullOrEmpty(majorKey)) return "Chuyên ngành";
        return majorKey.ToLowerInvariant() switch
        {
            "ai" => "Trí tuệ nhân tạo",
            "networking" or "computer-networks" => "Mạng máy tính",
            "is" or "information-systems" or "systems" => "Hệ thống thông tin DN",
            "security" or "cybersecurity" => "An toàn không gian mạng",
            "software-engineering" => "Công nghệ phần mềm",
            "programming" => "Kỹ thuật lập trình",
            _ => majorKey
        };
    }

    public async Task<ThesisStatsDto> GetStatsAsync()
    {
        var theses = await _db.Theses.ToListAsync();
        return new ThesisStatsDto(
            theses.Count,
            theses.Count(t => t.Status == "Pending"),
            theses.Count(t => t.Status == "InProgress"),
            theses.Count(t => t.Status == "Submitted"),
            theses.Count(t => t.Status == "UnderReview"),
            theses.Count(t => t.Status == "Approved"),
            theses.Count(t => t.Status == "Rejected")
        );
    }

    public async Task SyncDriveFoldersAsync(string category)
    {
        // Chỉ Đồ án mới sync theo cấu trúc chuyên ngành + học phần
        if (!string.Equals(category, "Project", StringComparison.OrdinalIgnoreCase))
            return;

        // Toàn bộ chuyên ngành và học phần — tạo đủ thư mục bất kể DB
        var subjectsByMajor = new Dictionary<string, List<(string Name, string Code)>>
        {
            ["Trí tuệ nhân tạo"] = new List<(string, string)>
            {
                ("Máy học",                                       "ITE1173E"),
                ("Phát triển ứng dụng trí tuệ nhân tạo",         "ITE1174E"),
                ("Đồ án chuyên ngành trí tuệ nhân tạo",          "ITE1491"),
                ("Khai thác dữ liệu và ứng dụng",                "ITE1176E"),
                ("Thị giác máy tính",                             "ITE1181E"),
            },
            ["Mạng máy tính"] = new List<(string, string)>
            {
                ("Mạng máy tính nâng cao",                        "ITE1235E"),
                ("Thiết kế mạng máy tính",                        "ITE1267E"),
                ("Lập trình mạng máy tính",                       "ITE1255E"),
                ("Quản trị mạng",                                 "ITE1241E"),
                ("Đồ án chuyên ngành mạng máy tính",              "ITE1489"),
            },
            ["Hệ thống thông tin DN"] = new List<(string, string)>
            {
                ("Cơ sở dữ liệu nâng cao",                        "ITE1224E"),
                ("Hoạch định nguồn nhân lực doanh nghiệp",        "ITE1285E"),
                ("Hệ thống thông tin quản lý",                    "ITE1129E"),
                ("Phân tích nghiệp vụ kinh doanh",                "ITE1284E"),
                ("Đồ án chuyên ngành hệ thống thông tin DN",      "ITE1488"),
            },
            ["An toàn không gian mạng"] = new List<(string, string)>
            {
                ("An toàn thông tin cho ứng dụng web",            "ITE1268E"),
                ("An toàn hệ thống mạng máy tính",                "ITE1232E"),
                ("Phân tích và đánh giá an toàn thông tin",       "ITE1239E"),
                ("Điều tra số",                                    "ITE1258E"),
                ("Đồ án chuyên ngành an toàn không gian mạng",    "ITE1490"),
            },
            ["Kỹ thuật lập trình"] = new List<(string, string)>
            {
                ("Lập trình Front-End",                          "SWE1208E"),
                ("Mạng máy tính và bảo mật thông tin",             "SWE1204E"),
                ("Phân tích và thiết kế phần mềm",                "SWE1107E"),
                ("Lập trình ứng dụng",                            "SWE1205E"),
                ("Phát triển ứng dụng Full-Stack",                "SWE1209E"),
                ("Công cụ phát triển ứng dụng",                    "SWE1210E"),
                ("Đồ án kỹ thuật phần mềm",                        "SWE1422"),
                ("Đảm bảo chất lượng phần mềm",                   "SWE1111E"),
                ("Kiểm thử phần mềm",                             "SWE1212E"),
                ("Quản lý dự án kiểm thử",                        "SWE1114E"),
                ("Công cụ và kỹ thuật kiểm thử tự động",            "SWE1213E"),
                ("Đồ án chuyên ngành kiểm thử phần mềm",           "SWE1415"),
                ("Phát triển ứng dụng đa nền tảng",                "SWE1216E"),
                ("Phát triển Game",                               "ITE1279E"),
                ("Phát triển và vận hành hệ thống công nghệ thông tin", "SWE1219E"),
                ("Phát triển ứng dụng web nâng cao",              "SWE1218E"),
                ("Đồ án chuyên ngành phát triển ứng dụng",         "SWE1420"),
            },
        };

        foreach (var majorEntry in subjectsByMajor)
        {
            foreach (var subject in majorEntry.Value)
            {
                await _driveService.GetOrCreateSubjectFolderAsync(
                    AcademicCategory.Project,
                    majorEntry.Key,
                    subject.Name,
                    subject.Code
                );
            }
        }
    }

    private async Task DispatchNotificationAsync(int recipientUserId, string title, string message)
    {
        try
        {
            var user = await _db.Users.FindAsync(recipientUserId);
            if (user == null) return;

            // Save to Database
            var notif = new Notification
            {
                UserId = user.Id,
                Title = title,
                Message = message,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _db.Notifications.Add(notif);
            await _db.SaveChangesAsync();

            // Push via SignalR
            if (!string.IsNullOrEmpty(user.Email))
            {
                string icon = "info";
                string color = "text-primary";
                string bg = "bg-slate-50";

                var t = title.ToLower();
                if (t.Contains("phê duyệt") || t.Contains("duyệt") || t.Contains("thành công"))
                {
                    icon = "check_circle";
                    color = "text-emerald-600";
                    bg = "bg-emerald-50";
                }
                else if (t.Contains("từ chối") || t.Contains("hủy"))
                {
                    icon = "cancel";
                    color = "text-red-600";
                    bg = "bg-red-50";
                }
                else if (t.Contains("chỉnh sửa") || t.Contains("yêu cầu"))
                {
                    icon = "edit";
                    color = "text-orange-600";
                    bg = "bg-orange-50";
                }
                else if (t.Contains("đăng ký") || t.Contains("mới") || t.Contains("phân công"))
                {
                    icon = "description";
                    color = "text-blue-600";
                    bg = "bg-blue-50";
                }

                await _hubContext.Clients.Group(user.Email).SendAsync("ReceiveNotification", new
                {
                    title = title,
                    desc = message,
                    time = "Vừa xong",
                    icon = icon,
                    color = color,
                    bg = bg
                });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ThesisService] Error sending notification: {ex.Message}");
        }
    }

}
