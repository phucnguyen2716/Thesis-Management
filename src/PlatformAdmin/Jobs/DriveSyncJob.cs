using Microsoft.EntityFrameworkCore;
using PlatformAdmin.Data;
using PlatformAdmin.Entities;
using PlatformAdmin.Services;

namespace PlatformAdmin.Jobs;

/// <summary>
/// Hangfire recurring job — syncs Google Drive → Database every 1 minute.
/// Flow: Google Drive → Hangfire → DB → API → Frontend (Lookup)
/// </summary>
public class DriveSyncJob
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IGoogleDriveStorageService _driveService;
    private readonly ILibreOfficePdfConverter _pdfConverter;
    private readonly ILogger<DriveSyncJob> _logger;
    private readonly string _tempPdfRoot;

    public DriveSyncJob(
        IServiceScopeFactory scopeFactory,
        IGoogleDriveStorageService driveService,
        ILibreOfficePdfConverter pdfConverter,
        ILogger<DriveSyncJob> logger,
        IConfiguration configuration)
    {
        _scopeFactory = scopeFactory;
        _driveService = driveService;
        _pdfConverter = pdfConverter;
        _logger = logger;
        _tempPdfRoot = Path.Combine(Directory.GetCurrentDirectory(), configuration["GoogleDrive:TemporaryPdfLocalPath"] ?? "temporary_pdf");
        Directory.CreateDirectory(_tempPdfRoot);
    }

    private static readonly SemaphoreSlim _syncSemaphore = new SemaphoreSlim(1, 1);

    public async Task SyncAllAsync()
    {
        if (!await _syncSemaphore.WaitAsync(0))
        {
            _logger.LogWarning("⚠️ [DriveSyncJob] Sync is already running. Skipping this execution.");
            return;
        }

        try
        {
            _logger.LogInformation("🔄 [DriveSyncJob] Starting full Drive sync...");
            await _driveService.EnsureTemporaryPdfFolderAsync();

            await SyncFolderAsync("Temporary_PDF", AcademicCategory.Project);
            await SyncCourseProjectStorageAsync();
            await SyncThesesFromDriveRecordsAsync();
            await ProcessWordAndPdfFilesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [DriveSyncJob] Full sync failed");
        }
        finally
        {
            _syncSemaphore.Release();
        }
    }

    public Task SyncTemporaryPdfAsync() => SyncAllAsync();

    private async Task SyncFolderAsync(string folderName, AcademicCategory category)
    {
        var driveFiles = await _driveService.ListFilesFromFolderAsync(folderName, category);
        _logger.LogInformation("🔄 [DriveSyncJob] '{Folder}': {Count} files on Drive", folderName, driveFiles.Count);
        await UpsertDriveFilesAsync(driveFiles, folderName, "Project");
    }

    private async Task SyncCourseProjectStorageAsync()
    {
        var driveFiles = await _driveService.ListCourseProjectFilesRecursiveAsync();
        _logger.LogInformation("🔄 [DriveSyncJob] CourseProjectStorage: {Count} files on Drive", driveFiles.Count);
        await UpsertDriveFilesAsync(driveFiles, "CourseProjectStorage", "Project");
    }

    private async Task UpsertDriveFilesAsync(List<DriveFileInfo> driveFiles, string sourceFolder, string category)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var existingRecords = await db.DriveFileRecords
            .Where(r => r.SourceFolder == sourceFolder)
            .ToListAsync();

        // Clean up duplicate records in the database (recovery from previous concurrency race conditions)
        var duplicates = existingRecords
            .GroupBy(r => r.DriveFileId)
            .Where(g => g.Count() > 1)
            .ToList();

        if (duplicates.Any())
        {
            _logger.LogWarning("⚠️ [DriveSyncJob] Found {Count} duplicate DriveFileIds in {Folder}. Cleaning up...", duplicates.Count, sourceFolder);
            foreach (var group in duplicates)
            {
                var toDelete = group.Skip(1).ToList();
                db.DriveFileRecords.RemoveRange(toDelete);
                foreach (var del in toDelete)
                {
                    existingRecords.Remove(del);
                }
            }
            await db.SaveChangesAsync();
        }

        var existingByDriveId = existingRecords.ToDictionary(r => r.DriveFileId);
        var driveFileIds = new HashSet<string>();
        int newCount = 0, updatedCount = 0;

        // Dedup input driveFiles
        var uniqueDriveFiles = driveFiles
            .GroupBy(f => f.Id)
            .Select(g => g.First())
            .ToList();

        foreach (var df in uniqueDriveFiles)
        {
            driveFileIds.Add(df.Id);

            if (existingByDriveId.TryGetValue(df.Id, out var existing))
            {
                bool changed = ApplyDriveFileFields(existing, df, sourceFolder, category);
                existing.LastCheckedAt = DateTime.UtcNow;
                if (changed) updatedCount++;
            }
            else
            {
                var record = new DriveFileRecord();
                ApplyDriveFileFields(record, df, sourceFolder, category);
                record.DriveFileId = df.Id;
                record.SyncedAt = DateTime.UtcNow;
                record.LastCheckedAt = DateTime.UtcNow;
                record.IsActive = true;
                db.DriveFileRecords.Add(record);
                newCount++;
            }
        }

        int deactivatedCount = 0;
        foreach (var record in existingRecords)
        {
            if (record.IsActive && !driveFileIds.Contains(record.DriveFileId))
            {
                record.IsActive = false;
                record.LastCheckedAt = DateTime.UtcNow;
                deactivatedCount++;
            }
        }

        await db.SaveChangesAsync();
        _logger.LogInformation(
            "✅ [DriveSyncJob] {Folder} — New: {New}, Updated: {Updated}, Deactivated: {Deactivated}, Total: {Total}",
            sourceFolder, newCount, updatedCount, deactivatedCount, uniqueDriveFiles.Count);
    }

    private static bool ApplyDriveFileFields(DriveFileRecord record, DriveFileInfo df, string sourceFolder, string category)
    {
        bool changed = false;
        if (record.FileName != df.Name) { record.FileName = df.Name; changed = true; }
        if (record.MimeType != df.MimeType) { record.MimeType = df.MimeType; changed = true; }
        if (record.FileSize != df.Size) { record.FileSize = df.Size; changed = true; }
        if (record.WebViewLink != df.WebViewLink) { record.WebViewLink = df.WebViewLink; changed = true; }
        if (record.WebContentLink != df.WebContentLink) { record.WebContentLink = df.WebContentLink; changed = true; }
        if (record.DriveModifiedAt != df.ModifiedTime) { record.DriveModifiedAt = df.ModifiedTime; changed = true; }
        if (record.SourceFolder != sourceFolder) { record.SourceFolder = sourceFolder; changed = true; }
        if (record.Category != category) { record.Category = category; changed = true; }
        if (record.RelativePath != df.RelativePath) { record.RelativePath = df.RelativePath; changed = true; }
        if (record.Major != df.Major) { record.Major = df.Major; changed = true; }
        if (record.MajorKey != df.MajorKey) { record.MajorKey = df.MajorKey; changed = true; }
        if (record.Subject != df.Subject) { record.Subject = df.Subject; changed = true; }
        if (record.SubjectCode != df.SubjectCode) { record.SubjectCode = df.SubjectCode; changed = true; }
        if (record.StudentUid != df.StudentUid) { record.StudentUid = df.StudentUid; changed = true; }
        if (record.ProjectName != df.ProjectName) { record.ProjectName = df.ProjectName; changed = true; }
        if (df.CreatedTime.HasValue && record.DriveCreatedAt != df.CreatedTime) { record.DriveCreatedAt = df.CreatedTime; changed = true; }
        if (!record.IsActive) { record.IsActive = true; changed = true; }
        return changed;
    }

    private async Task ProcessWordAndPdfFilesAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Check if any files marked as downloaded are missing from the local disk
        var existingDownloads = await db.DriveFileRecords
            .Where(r => r.IsActive && !string.IsNullOrEmpty(r.LocalPdfPath))
            .ToListAsync();

        bool anyCleared = false;
        foreach (var r in existingDownloads)
        {
            if (r.LocalPdfPath.StartsWith("/temporary_pdf/"))
            {
                var subPath = r.LocalPdfPath.Substring("/temporary_pdf/".Length);
                var fullPath = Path.Combine(_tempPdfRoot, subPath.Replace('/', Path.DirectorySeparatorChar));
                if (!File.Exists(fullPath))
                {
                    _logger.LogInformation("📄 [DriveSyncJob] File {FileName} is marked as downloaded but missing on disk at {Path}. Clearing LocalPdfPath to force re-download.", r.FileName, fullPath);
                    r.LocalPdfPath = "";
                    anyCleared = true;
                }
            }
        }
        if (anyCleared)
        {
            await db.SaveChangesAsync();
        }

        var filesToDownload = await db.DriveFileRecords
            .Where(r => r.IsActive && string.IsNullOrEmpty(r.LocalPdfPath))
            .Take(400)
            .ToListAsync();

        foreach (var record in filesToDownload)
        {
            try
            {
                await ProcessSingleFileAsync(record, db);
                await db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [DriveSyncJob] Failed to download/convert file {FileName} ({FileId})", record.FileName, record.DriveFileId);
            }
        }
    }

    public async Task ProcessSingleFileAsync(DriveFileRecord record, AppDbContext db)
    {
        var uid = string.IsNullOrEmpty(record.StudentUid) ? "unknown" : record.StudentUid;
        var safeName = DrivePathParser.SanitizeFolderName(Path.GetFileNameWithoutExtension(record.FileName));
        var workDir = Path.Combine(_tempPdfRoot, $"{uid}_{safeName}");
        Directory.CreateDirectory(workDir);

        var ext = Path.GetExtension(record.FileName).ToLowerInvariant();
        var pdfPath = Path.Combine(workDir, Path.GetFileNameWithoutExtension(record.FileName) + ".pdf");
        
        if (ext == ".pdf")
        {
            byte[]? bytes = null;
            if (!File.Exists(pdfPath))
            {
                bytes = await _driveService.DownloadFileAsync(record.DriveFileId, AcademicCategory.Project);
                if (bytes == null || bytes.Length == 0)
                {
                    var majorDisplay = GetMajorName(record.MajorKey);
                    bytes = DriveSampleDataSeeder.BuildSamplePdf(majorDisplay, record.Subject, record.SubjectCode, uid, record.ProjectName, record.FileName);
                }
                await File.WriteAllBytesAsync(pdfPath, bytes);
            }
            else
            {
                bytes = await File.ReadAllBytesAsync(pdfPath);
            }

            record.LocalPdfPath = $"/temporary_pdf/{uid}_{safeName}/{record.FileName}";
            record.LastCheckedAt = DateTime.UtcNow;

            // Also upload to Drive under Temporary_PDF so that all viewed files are duplicated there
            try
            {
                if (bytes == null || bytes.Length == 0) bytes = await File.ReadAllBytesAsync(pdfPath);
                await _driveService.UploadFileToFolderAsync("Temporary_PDF", record.FileName, bytes, "application/pdf", AcademicCategory.Project);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not upload PDF '{PdfName}' to Temporary_PDF folder", record.FileName);
            }

            _logger.LogInformation("📄 [DriveSyncJob] Downloaded and replicated PDF: {File} → {LocalPath}", record.FileName, record.LocalPdfPath);
        }
        else
        {
            // Word, Excel, PowerPoint, etc.
            var inputPath = Path.Combine(workDir, record.FileName);
            if (!File.Exists(inputPath))
            {
                var bytes = await _driveService.DownloadFileAsync(record.DriveFileId, AcademicCategory.Project);
                if (bytes == null || bytes.Length == 0)
                {
                    var majorDisplay = GetMajorName(record.MajorKey);
                    if (ext is ".xlsx" or ".xls")
                    {
                        bytes = DriveSampleDataSeeder.BuildSampleXlsx(majorDisplay, record.Subject, record.SubjectCode, uid, record.ProjectName, record.FileName);
                    }
                    else
                    {
                        bytes = DriveSampleDataSeeder.BuildSampleDocx(majorDisplay, record.Subject, record.SubjectCode, uid, record.ProjectName, record.FileName);
                    }
                }
                await File.WriteAllBytesAsync(inputPath, bytes);
            }

            // Try converting using LibreOffice
            var convertedPdfPath = await _pdfConverter.ConvertToPdfAsync(inputPath, workDir);
            if (convertedPdfPath != null && File.Exists(convertedPdfPath))
            {
                pdfPath = convertedPdfPath;
            }
            else
            {
                // If LibreOffice conversion failed (not installed or error), build fallback PDF
                _logger.LogWarning("⚠️ [DriveSyncJob] PDF conversion failed/not supported for {File}. Generating fallback PDF...", record.FileName);
                var majorDisplay = GetMajorName(record.MajorKey);
                var fallbackBytes = DriveSampleDataSeeder.BuildSamplePdf(majorDisplay, record.Subject, record.SubjectCode, uid, record.ProjectName, record.FileName);
                await File.WriteAllBytesAsync(pdfPath, fallbackBytes);
            }

            var pdfName = Path.GetFileName(pdfPath);
            record.LocalPdfPath = $"/temporary_pdf/{uid}_{safeName}/{pdfName}";
            record.LastCheckedAt = DateTime.UtcNow;

            // Upload to Drive under Temporary_PDF if mock upload is needed
            try
            {
                var pdfBytes = await File.ReadAllBytesAsync(pdfPath);
                await _driveService.UploadFileToFolderAsync("Temporary_PDF", pdfName, pdfBytes, "application/pdf", AcademicCategory.Project);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not upload converted PDF '{PdfName}' to Temporary_PDF folder", pdfName);
            }

            _logger.LogInformation("📄 [DriveSyncJob] Converted/Fallback PDF: {File} → {Pdf}", record.FileName, record.LocalPdfPath);
        }
    }

    public async Task<string> ConvertFileRecordOnDemandAsync(string driveFileId)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var record = await db.DriveFileRecords
            .FirstOrDefaultAsync(r => r.DriveFileId == driveFileId && r.IsActive);

        if (record == null)
        {
            _logger.LogWarning("⚠️ [DriveSyncJob] On-demand conversion requested for non-existent or inactive file ID: {FileId}", driveFileId);
            return "";
        }

        if (!string.IsNullOrEmpty(record.LocalPdfPath))
        {
            return record.LocalPdfPath;
        }

        _logger.LogInformation("🔄 [DriveSyncJob] Starting on-demand conversion for {FileName} ({FileId})...", record.FileName, driveFileId);
        
        await ProcessSingleFileAsync(record, db);
        await db.SaveChangesAsync();

        // Now, update corresponding Thesis and ThesisSubmission records in DB
        if (!string.IsNullOrEmpty(record.LocalPdfPath))
        {
            var student = await db.Users.FirstOrDefaultAsync(u => u.StudentId == record.StudentUid);
            if (student != null)
            {
                var thesis = await db.Theses
                    .Include(t => t.Submissions)
                    .FirstOrDefaultAsync(t => t.StudentId == student.Id 
                                              && t.SubjectCode == record.SubjectCode 
                                              && t.Category == record.Category);

                if (thesis != null)
                {
                    // 1. Update the submission
                    var sub = thesis.Submissions.FirstOrDefault(s => s.FileName == record.FileName);
                    if (sub != null)
                    {
                        sub.FilePath = record.LocalPdfPath;
                        db.Entry(sub).State = EntityState.Modified;
                    }
                    else
                    {
                        var newSub = new ThesisSubmission
                        {
                            ThesisId = thesis.Id,
                            FileName = record.FileName,
                            FilePath = record.LocalPdfPath,
                            FileSize = record.FileSize ?? 0,
                            Version = 1,
                            SubmittedAt = EnsureUtc(record.DriveModifiedAt ?? DateTime.UtcNow)
                        };
                        db.ThesisSubmissions.Add(newSub);
                    }

                    // 2. Update the main thesis file path if appropriate
                    var groupFiles = await db.DriveFileRecords
                        .Where(r => r.IsActive && r.StudentUid == record.StudentUid && r.SubjectCode == record.SubjectCode && r.Category == record.Category)
                        .ToListAsync();

                    var mainFile = groupFiles.FirstOrDefault(r => r.FileName.Contains("Bao_cao", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(r.LocalPdfPath))
                                   ?? groupFiles.FirstOrDefault(r => !string.IsNullOrEmpty(r.LocalPdfPath))
                                   ?? record;

                    if (!string.IsNullOrEmpty(mainFile.LocalPdfPath))
                    {
                        thesis.FilePath = mainFile.LocalPdfPath;
                        db.Entry(thesis).State = EntityState.Modified;
                    }

                    await db.SaveChangesAsync();
                }
            }
        }

        return record.LocalPdfPath;
    }

    private string GetMajorName(string? majorKey)
    {
        if (string.IsNullOrEmpty(majorKey)) return "Chuyên ngành";
        return majorKey.ToLowerInvariant() switch
        {
            "ai" => "Trí tuệ nhân tạo",
            "networking" or "computer-networks" => "Mạng máy tính",
            "is" or "information-systems" or "systems" => "Hệ thống thông tin DN",
            "security" or "cybersecurity" => "An toàn không gian mạng",
            "programming" or "swe" => "Kỹ thuật lập trình",
            _ => majorKey
        };
    }

    private async Task SyncThesesFromDriveRecordsAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var activeRecords = await db.DriveFileRecords
            .Where(r => r.IsActive && !string.IsNullOrEmpty(r.StudentUid))
            .ToListAsync();

        var groupedRecords = activeRecords
            .GroupBy(r => new { r.StudentUid, r.SubjectCode, r.Category, r.MajorKey })
            .ToList();

        _logger.LogInformation("🔄 [DriveSyncJob] Syncing {Count} groups from Drive to DB theses...", groupedRecords.Count);

        foreach (var group in groupedRecords)
        {
            var studentUid = group.Key.StudentUid;
            var subjectCode = group.Key.SubjectCode;
            var category = group.Key.Category;
            var majorKey = group.Key.MajorKey;

            var firstFile = group.First();
            var majorName = firstFile.Major ?? GetMajorName(majorKey);
            var subjectName = firstFile.Subject ?? "Đồ án môn học";
            var projectName = firstFile.ProjectName ?? "Đồ án không tên";

            var student = await db.Users.FirstOrDefaultAsync(u => u.StudentId == studentUid);
            if (student == null)
            {
                student = new User
                {
                    FullName = $"Sinh viên {studentUid}",
                    Email = $"{studentUid.ToLower()}@ethesis.edu.vn",
                    PasswordHash = global::BCrypt.Net.BCrypt.HashPassword("student123"),
                    Role = "Student",
                    StudentId = studentUid,
                    Department = "Công nghệ thông tin",
                    IsActive = true,
                    CreatedAt = EnsureUtc(DateTime.UtcNow)
                };
                db.Users.Add(student);
                await db.SaveChangesAsync();
            }

            var thesis = await db.Theses
                .Include(t => t.Submissions)
                .FirstOrDefaultAsync(t => t.StudentId == student.Id 
                                          && t.SubjectCode == subjectCode 
                                          && t.Category == category);

            bool isNew = false;
            if (thesis == null)
            {
                thesis = new Thesis
                {
                    StudentId = student.Id,
                    Category = category,
                    SubjectCode = subjectCode,
                    Status = "Approved",
                    CreatedAt = EnsureUtc(firstFile.DriveCreatedAt ?? DateTime.UtcNow),
                    UpdatedAt = EnsureUtc(DateTime.UtcNow)
                };
                isNew = true;
            }

            thesis.Title = projectName;
            thesis.Description = $"Đề tài {projectName} thuộc học phần {subjectName} ({subjectCode}). Đồng bộ tự động từ Google Drive.";
            thesis.Major = majorKey;
            thesis.Subject = subjectName;

            var mainFile = group.FirstOrDefault(r => r.FileName.Contains("Bao_cao", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(r.LocalPdfPath))
                           ?? group.FirstOrDefault(r => !string.IsNullOrEmpty(r.LocalPdfPath))
                           ?? group.FirstOrDefault(r => r.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                           ?? firstFile;

            thesis.FilePath = !string.IsNullOrEmpty(mainFile.LocalPdfPath) ? mainFile.LocalPdfPath : mainFile.WebViewLink;

            if (isNew)
            {
                db.Theses.Add(thesis);
            }
            else
            {
                db.Entry(thesis).State = EntityState.Modified;
            }

            await db.SaveChangesAsync();

            var existingSubmissions = thesis.Submissions.GroupBy(s => s.FileName).ToDictionary(g => g.Key, g => g.First());
            var activeFileNames = new HashSet<string>();

            foreach (var file in group)
            {
                activeFileNames.Add(file.FileName);
                var filePath = !string.IsNullOrEmpty(file.LocalPdfPath) ? file.LocalPdfPath : file.WebViewLink;

                if (existingSubmissions.TryGetValue(file.FileName, out var sub))
                {
                    sub.FilePath = filePath ?? "";
                    sub.FileSize = file.FileSize ?? 0;
                    db.Entry(sub).State = EntityState.Modified;
                }
                else
                {
                    var newSub = new ThesisSubmission
                    {
                        ThesisId = thesis.Id,
                        FileName = file.FileName,
                        FilePath = filePath ?? "",
                        FileSize = file.FileSize ?? 0,
                        Version = 1,
                        SubmittedAt = EnsureUtc(file.DriveModifiedAt ?? DateTime.UtcNow)
                    };
                    db.ThesisSubmissions.Add(newSub);
                }
            }

            foreach (var sub in thesis.Submissions)
            {
                if (!activeFileNames.Contains(sub.FileName))
                {
                    db.ThesisSubmissions.Remove(sub);
                }
            }

            await db.SaveChangesAsync();
        }
    }

    public async Task SyncThesisToDriveAsync(int thesisId)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var thesis = await db.Theses
            .Include(t => t.Student)
            .FirstOrDefaultAsync(t => t.Id == thesisId);

        if (thesis == null || thesis.Category != "Project" || thesis.Student == null)
            return;

        var studentUid = thesis.Student.StudentId ?? $"SV{thesis.StudentId}";
        var majorKey = thesis.Major;
        var subjectCode = thesis.SubjectCode ?? "SWE1209E";
        var subjectName = thesis.Subject ?? "Đồ án môn học";
        var majorName = GetMajorName(majorKey);

        var sanitizedTitle = DrivePathParser.SanitizeFolderName(thesis.Title);
        var folderName = $"Nhom01_{sanitizedTitle}_{studentUid}";

        var alreadyHasFiles = await db.DriveFileRecords
            .AnyAsync(r => r.IsActive && r.StudentUid == studentUid && r.SubjectCode == subjectCode);

        if (alreadyHasFiles)
        {
            _logger.LogInformation("ℹ️ [DriveSyncJob] Drive folder for {Student} / {Subject} already exists, skipping seed upload.", studentUid, subjectCode);
            return;
        }

        _logger.LogInformation("🔄 [DriveSyncJob] Admin created new thesis. Uploading seed templates to Drive folder: {Folder}...", folderName);

        var docxBytes = DriveSampleDataSeeder.BuildSampleDocx(majorName, subjectName, subjectCode, studentUid, thesis.Title, "Bao_cao_DoAn.docx");
        var pdfBytes = DriveSampleDataSeeder.BuildSamplePdf(majorName, subjectName, subjectCode, studentUid, thesis.Title, "Slide_ThuyetTrinh.pdf");
        var xlsxBytes = DriveSampleDataSeeder.BuildSampleXlsx(majorName, subjectName, subjectCode, studentUid, thesis.Title, "Bang_tinh_chi_phi.xlsx");

        await _driveService.UploadAcademicPdfAsync("Bao_cao_DoAn.docx", docxBytes, AcademicCategory.Project, subjectName, thesis.Title, subjectCode, studentUid, thesis.Title, majorName, folderName);
        await _driveService.UploadAcademicPdfAsync("Slide_ThuyetTrinh.pdf", pdfBytes, AcademicCategory.Project, subjectName, thesis.Title, subjectCode, studentUid, thesis.Title, majorName, folderName);
        await _driveService.UploadAcademicPdfAsync("Bang_tinh_chi_phi.xlsx", xlsxBytes, AcademicCategory.Project, subjectName, thesis.Title, subjectCode, studentUid, thesis.Title, majorName, folderName);

        await SyncAllAsync();
    }

    public async Task DeleteDriveFolderAsync(string folderName, AcademicCategory category)
    {
        _logger.LogInformation("🔄 [DriveSyncJob] Deleting folder '{Folder}' from Google Drive...", folderName);
        await _driveService.DeleteFolderAsync(folderName, category);
    }

    private static DateTime EnsureUtc(DateTime dt)
    {
        return dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);
    }

    private static DateTime? EnsureUtc(DateTime? dt)
    {
        if (!dt.HasValue) return null;
        return dt.Value.Kind == DateTimeKind.Utc ? dt.Value : DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc);
    }
}
