using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PlatformAdmin.Data;
using PlatformAdmin.Entities;
using PlatformAdmin.Services;

namespace PlatformAdmin.Jobs;

/// <summary>
/// Hangfire recurring job that syncs files from Google Drive "Temporary_PDF" folder
/// into the local database every 1 minute.
/// 
/// Flow: Google Drive → Hangfire Job → Database → API → Frontend
/// </summary>
public class DriveSyncJob
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IGoogleDriveStorageService _driveService;
    private readonly ILogger<DriveSyncJob> _logger;

    public DriveSyncJob(
        IServiceScopeFactory scopeFactory,
        IGoogleDriveStorageService driveService,
        ILogger<DriveSyncJob> logger)
    {
        _scopeFactory = scopeFactory;
        _driveService = driveService;
        _logger = logger;
    }

    /// <summary>
    /// Main sync method called by Hangfire every minute.
    /// Lists files from Drive, upserts into DB, marks deleted files as inactive.
    /// </summary>
    public async Task SyncTemporaryPdfAsync()
    {
        const string folderName = "Temporary_PDF";
        _logger.LogInformation("🔄 [DriveSyncJob] Starting sync from Google Drive folder: '{Folder}'...", folderName);

        try
        {
            // 1. Get files from Google Drive
            var driveFiles = await _driveService.ListFilesFromFolderAsync(folderName, AcademicCategory.Project);
            _logger.LogInformation("🔄 [DriveSyncJob] Found {Count} files on Drive in '{Folder}'", driveFiles.Count, folderName);

            // 2. Upsert into database
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Get existing records for this folder
            var existingRecords = await db.DriveFileRecords
                .Where(r => r.SourceFolder == folderName)
                .ToListAsync();

            var existingByDriveId = existingRecords.ToDictionary(r => r.DriveFileId);
            var driveFileIds = new HashSet<string>();

            int newCount = 0, updatedCount = 0;

            foreach (var df in driveFiles)
            {
                driveFileIds.Add(df.Id);

                if (existingByDriveId.TryGetValue(df.Id, out var existing))
                {
                    // UPDATE: check if file was modified
                    bool changed = false;
                    if (existing.FileName != df.Name) { existing.FileName = df.Name; changed = true; }
                    if (existing.MimeType != df.MimeType) { existing.MimeType = df.MimeType; changed = true; }
                    if (existing.FileSize != df.Size) { existing.FileSize = df.Size; changed = true; }
                    if (existing.WebViewLink != df.WebViewLink) { existing.WebViewLink = df.WebViewLink; changed = true; }
                    if (existing.WebContentLink != df.WebContentLink) { existing.WebContentLink = df.WebContentLink; changed = true; }
                    if (existing.DriveModifiedAt != df.ModifiedTime) { existing.DriveModifiedAt = df.ModifiedTime; changed = true; }
                    if (!existing.IsActive) { existing.IsActive = true; changed = true; }

                    existing.LastCheckedAt = DateTime.UtcNow;

                    if (changed)
                    {
                        updatedCount++;
                        _logger.LogInformation("📝 [DriveSyncJob] Updated: {FileName}", df.Name);
                    }
                }
                else
                {
                    // INSERT: new file
                    db.DriveFileRecords.Add(new DriveFileRecord
                    {
                        DriveFileId = df.Id,
                        FileName = df.Name,
                        MimeType = df.MimeType,
                        FileSize = df.Size,
                        WebViewLink = df.WebViewLink,
                        WebContentLink = df.WebContentLink,
                        SourceFolder = folderName,
                        Category = "Project",
                        DriveCreatedAt = df.CreatedTime,
                        DriveModifiedAt = df.ModifiedTime,
                        SyncedAt = DateTime.UtcNow,
                        LastCheckedAt = DateTime.UtcNow,
                        IsActive = true
                    });
                    newCount++;
                    _logger.LogInformation("✅ [DriveSyncJob] New file: {FileName}", df.Name);
                }
            }

            // 3. Mark files that no longer exist on Drive as inactive
            int deactivatedCount = 0;
            foreach (var record in existingRecords)
            {
                if (record.IsActive && !driveFileIds.Contains(record.DriveFileId))
                {
                    record.IsActive = false;
                    record.LastCheckedAt = DateTime.UtcNow;
                    deactivatedCount++;
                    _logger.LogInformation("❌ [DriveSyncJob] Deactivated (removed from Drive): {FileName}", record.FileName);
                }
            }

            await db.SaveChangesAsync();

            _logger.LogInformation(
                "✅ [DriveSyncJob] Sync complete — New: {New}, Updated: {Updated}, Deactivated: {Deactivated}, Total on Drive: {Total}",
                newCount, updatedCount, deactivatedCount, driveFiles.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [DriveSyncJob] Failed to sync from Google Drive folder: '{Folder}'", folderName);
        }
    }
}
