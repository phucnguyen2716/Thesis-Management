using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatformAdmin.Data;
using PlatformAdmin.Entities;
using PlatformAdmin.Services;

namespace PlatformAdmin.Controllers;

/// <summary>
/// Google Drive sync API — tách riêng để tránh conflict route /api/thesis/{id}
/// </summary>
[Authorize]
[ApiController]
[Route("api/drive")]
public class DriveController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IGoogleDriveStorageService _driveService;

    public DriveController(AppDbContext db, IGoogleDriveStorageService driveService)
    {
        _db = db;
        _driveService = driveService;
    }

    [HttpGet("status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetStatus()
    {
        var driveCount = await _driveService.CountFilesInCourseProjectStorageAsync();
        var dbCount = await _db.DriveFileRecords.CountAsync(f => f.IsActive);
        var lastSync = await _db.DriveFileRecords
            .OrderByDescending(f => f.LastCheckedAt)
            .Select(f => (DateTime?)f.LastCheckedAt)
            .FirstOrDefaultAsync();

        return Ok(new
        {
            driveFileCount = driveCount,
            dbRecordCount = dbCount,
            lastSyncAt = lastSync,
            hangfireInterval = "1 phút",
            syncMode = "tự động (Hangfire)",
            folderStructure = "CourseProjectStorage / Chuyên ngành / Môn học (Mã) / NhomXX_Ten_SVxxxx / files"
        });
    }

    [HttpGet("files")]
    public async Task<ActionResult<List<DriveFileRecord>>> ListFiles(
        [FromQuery] string folder = "all",
        [FromQuery] string? category = null)
    {
        var query = _db.DriveFileRecords.Where(f => f.IsActive);
        if (!string.IsNullOrEmpty(folder) && !folder.Equals("all", StringComparison.OrdinalIgnoreCase))
            query = query.Where(f => f.SourceFolder == folder);
        if (!string.IsNullOrEmpty(category))
            query = query.Where(f => f.Category == category);

        var files = await query.OrderByDescending(f => f.DriveModifiedAt ?? f.SyncedAt).ToListAsync();
        return Ok(files);
    }
}
