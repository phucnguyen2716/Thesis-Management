using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatformAdmin.Data;
using PlatformAdmin.Entities;
using PlatformAdmin.Services;
using PlatformAdmin.Interfaces;
using PlatformAdmin.Jobs;

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
    private readonly IAuthService _authService;
    private readonly DriveSyncJob _syncJob;
    private readonly IConfiguration _configuration;
    private readonly ILibreOfficePdfConverter _pdfConverter;

    public DriveController(AppDbContext db, IGoogleDriveStorageService driveService, IAuthService authService, DriveSyncJob syncJob, IConfiguration configuration, ILibreOfficePdfConverter pdfConverter)
    {
        _db = db;
        _driveService = driveService;
        _authService = authService;
        _syncJob = syncJob;
        _configuration = configuration;
        _pdfConverter = pdfConverter;
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

    [HttpGet("debug-sync")]
    [AllowAnonymous]
    public async Task<IActionResult> DebugSync([FromQuery] string? uid)
    {
        var total = await _db.DriveFileRecords.CountAsync(f => f.IsActive);
        var pending = await _db.DriveFileRecords.CountAsync(f => f.IsActive && string.IsNullOrEmpty(f.LocalPdfPath));
        
        var files = await _db.DriveFileRecords
            .Where(f => f.IsActive)
            .Select(f => new { f.FileName, f.StudentUid, f.LocalPdfPath, f.WebViewLink })
            .ToListAsync();

        var svFiles = files.Where(f => f.StudentUid == uid).ToList();

        return Ok(new
        {
            TotalActive = total,
            PendingConversions = pending,
            RequestedUid = uid,
            SvFiles = svFiles,
            AllFilesSample = files.Take(20)
        });
    }

    [HttpGet("force-sync-academic")]
    [AllowAnonymous]
    public async Task<IActionResult> ForceSyncAcademic()
    {
        try
        {
            await _syncJob.SyncTopicStorageAsync();
            await _syncJob.SyncThesisStorageAsync();
            await _syncJob.SyncThesesFromDriveRecordsAsync();
            return Ok(new { Message = "Academic folders (Topic & Thesis) scanned and synced successfully!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = ex.Message });
        }
    }


    [HttpPost("convert")]
    [AllowAnonymous]
    public async Task<IActionResult> ConvertDriveFile([FromQuery] string filePath)
    {
        if (string.IsNullOrEmpty(filePath))
        {
            return BadRequest(new { success = false, message = "File path is required." });
        }

        // If it is already a local PDF path, return it directly
        if (filePath.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase) && (filePath.StartsWith("/temporary_pdf") || filePath.StartsWith("/uploads")))
        {
            return Ok(new { success = true, localPath = filePath });
        }

        // Check if it is a local non-PDF file in /uploads or /temporary_pdf that needs conversion
        if (filePath.StartsWith("/uploads/") || filePath.StartsWith("/temporary_pdf/"))
        {
            var relativePath = filePath.TrimStart('/');
            var absolutePath = Path.Combine(Directory.GetCurrentDirectory(), relativePath);
            if (System.IO.File.Exists(absolutePath))
            {
                var safeName = DrivePathParser.SanitizeFolderName(Path.GetFileNameWithoutExtension(absolutePath));
                var workDir = Path.Combine(Directory.GetCurrentDirectory(), "temporary_pdf", $"local_{safeName}");
                Directory.CreateDirectory(workDir);

                var convertedPdfPath = await _pdfConverter.ConvertToPdfAsync(absolutePath, workDir);
                if (convertedPdfPath != null && System.IO.File.Exists(convertedPdfPath))
                {
                    var relativePdfPath = $"/temporary_pdf/local_{safeName}/{Path.GetFileName(convertedPdfPath)}";

                    // Upload to Drive Temporary_PDF folder as requested
                    try
                    {
                        var pdfBytes = await System.IO.File.ReadAllBytesAsync(convertedPdfPath);
                        await _driveService.UploadFileToFolderAsync("Temporary_PDF", Path.GetFileName(convertedPdfPath), pdfBytes, "application/pdf", AcademicCategory.Project);
                    }
                    catch (Exception ex)
                    {
                        // Ignore upload failures (e.g. if credentials are dummy or missing) and proceed
                    }

                    return Ok(new { success = true, localPath = relativePdfPath });
                }
            }
        }

        // Find in active records by WebViewLink, WebContentLink, or LocalPdfPath
        var record = await _db.DriveFileRecords
            .FirstOrDefaultAsync(r => r.IsActive && (r.WebViewLink == filePath || r.WebContentLink == filePath || r.LocalPdfPath == filePath));

        if (record == null)
        {
            // Fallback: try parsing file ID or matching by ID extracted
            var extractedId = ExtractDriveId(filePath);
            if (!string.IsNullOrEmpty(extractedId))
            {
                record = await _db.DriveFileRecords
                    .FirstOrDefaultAsync(r => r.IsActive && r.DriveFileId == extractedId);
            }
        }

        if (record == null)
        {
            return NotFound(new { success = false, message = $"Drive file record not found for path: {filePath}" });
        }

        if (!string.IsNullOrEmpty(record.LocalPdfPath) && record.LocalPdfPath.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            return Ok(new { success = true, localPath = record.LocalPdfPath });
        }

        // Perform conversion on-demand
        var localPath = await _syncJob.ConvertFileRecordOnDemandAsync(record.DriveFileId);

        if (string.IsNullOrEmpty(localPath))
        {
            return StatusCode(500, new { success = false, message = "Failed to convert file to PDF." });
        }

        return Ok(new { success = true, localPath });
    }

    private static string ExtractDriveId(string url)
    {
        if (string.IsNullOrEmpty(url)) return "";
        
        var match = System.Text.RegularExpressions.Regex.Match(url, @"/d/([^/&?]+)");
        if (match.Success) return match.Groups[1].Value;
        
        match = System.Text.RegularExpressions.Regex.Match(url, @"id=([^&]+)");
        if (match.Success) return match.Groups[1].Value;

        return "";
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

    [HttpPost("test-connection")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> TestConnection()
    {
        try
        {
            var users = await _db.Users.Take(10).ToListAsync();
            var theses = await _db.Theses.Take(10).ToListAsync();

            var sb = new System.Text.StringBuilder();
            sb.AppendLine("=== PostgreSQL Connection Test Report ===");
            sb.AppendLine($"Exported At: {DateTime.UtcNow} (UTC)");
            sb.AppendLine($"Total Users in system: {await _db.Users.CountAsync()}");
            sb.AppendLine($"Total Theses in system: {await _db.Theses.CountAsync()}");
            sb.AppendLine();
            sb.AppendLine("--- Sample Users ---");
            foreach (var u in users)
            {
                sb.AppendLine($"- ID: {u.Id}, Email: {u.Email}, Name: {u.FullName}, Role: {u.Role}");
            }
            sb.AppendLine();
            sb.AppendLine("--- Sample Theses ---");
            foreach (var t in theses)
            {
                sb.AppendLine($"- ID: {t.Id}, Title: {t.Title}, Category: {t.Category}, StudentId: {t.StudentId}");
            }

            var fileBytes = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
            var fileName = $"postgres_drive_test_{DateTime.UtcNow:yyyyMMdd_HHmmss}.txt";

            var uploadResult = await _driveService.UploadFileToFolderAsync(
                "Temporary_PDF", 
                fileName, 
                fileBytes, 
                "text/plain", 
                AcademicCategory.Project
            );

            if (uploadResult != null)
            {
                return Ok(new
                {
                    success = true,
                    message = "Successfully exported PostgreSQL data and uploaded to Google Drive!",
                    driveFileId = uploadResult.Id,
                    driveFileName = uploadResult.Name,
                    webViewLink = uploadResult.WebViewLink,
                    relativePath = uploadResult.RelativePath
                });
            }
            else
            {
                return StatusCode(500, new { success = false, message = "Database connection ok, but failed to upload test file to Google Drive." });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = $"Test connection failed: {ex.Message}" });
        }
    }

    [HttpGet("authorize-url")]
    [AllowAnonymous]
    public IActionResult GetAuthorizeUrl([FromQuery] string? from)
    {
        var clientId = _configuration["GoogleDrive:ClientId"];
        if (string.IsNullOrEmpty(clientId))
        {
            return BadRequest(new { success = false, message = "Google OAuth Client ID is not configured." });
        }
        var scheme = Request.Scheme;
        if (Request.Host.Host.Contains("onrender.com"))
        {
            scheme = "https";
        }
        var redirectUri = $"{scheme}://{Request.Host}/api/drive/oauth-callback";
        
        var scopes = "openid email profile https://www.googleapis.com/auth/drive";
        var state = from ?? "link_drive";

        var url = $"https://accounts.google.com/o/oauth2/v2/auth?client_id={clientId}&redirect_uri={System.Uri.EscapeDataString(redirectUri)}&response_type=code&scope={System.Uri.EscapeDataString(scopes)}&access_type=offline&prompt=consent&state={state}";
        return Ok(new { url });
    }

    [HttpGet("oauth-callback")]
    [AllowAnonymous]
    public async Task<IActionResult> OAuthCallback(
        [FromQuery] string? code, 
        [FromQuery] string? error,
        [FromQuery] string? state)
    {
        var frontendBase = "http://localhost:5173";
        if (Request.Host.Host.Contains("onrender.com"))
        {
            frontendBase = "https://ethesis-frontend-portal.onrender.com";
        }

        var isLoginFlow = (state == "login");
        var errorRedirectBase = isLoginFlow 
            ? $"{frontendBase}/login?error=" 
            : $"{frontendBase}/admin/theses/project";

        if (!string.IsNullOrEmpty(error))
        {
            if (isLoginFlow)
            {
                return Redirect(errorRedirectBase + System.Uri.EscapeDataString(error));
            }
            return Redirect(errorRedirectBase);
        }

        if (string.IsNullOrEmpty(code))
        {
            if (isLoginFlow)
            {
                return Redirect(errorRedirectBase + "Missing+code");
            }
            return Redirect(errorRedirectBase);
        }

        try
        {
            var clientId = _configuration["GoogleDrive:ClientId"];
            var clientSecret = _configuration["GoogleDrive:ClientSecret"];
            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            {
                return Redirect(errorRedirectBase + System.Uri.EscapeDataString("OAuth configuration is missing."));
            }
            var scheme = Request.Scheme;
            if (Request.Host.Host.Contains("onrender.com"))
            {
                scheme = "https";
            }
            var redirectUri = $"{scheme}://{Request.Host}/api/drive/oauth-callback";

            using var client = new System.Net.Http.HttpClient();
            var values = new Dictionary<string, string>
            {
                { "code", code },
                { "client_id", clientId },
                { "client_secret", clientSecret },
                { "redirect_uri", redirectUri },
                { "grant_type", "authorization_code" }
            };

            var content = new System.Net.Http.FormUrlEncodedContent(values);
            var response = await client.PostAsync("https://oauth2.googleapis.com/token", content);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                if (isLoginFlow)
                {
                    return Redirect(errorRedirectBase + System.Uri.EscapeDataString(responseString));
                }
                return Redirect(errorRedirectBase);
            }

            // Always save token for Drive integration
            var tokenPath = Path.Combine(Directory.GetCurrentDirectory(), "google-oauth-token.json");
            await System.IO.File.WriteAllTextAsync(tokenPath, responseString);

            if (isLoginFlow)
            {
                var tokenData = System.Text.Json.JsonSerializer.Deserialize<OAuthTokenResponse>(responseString);
                var accessToken = tokenData?.AccessToken;

                if (string.IsNullOrEmpty(accessToken))
                {
                    return Redirect($"{frontendBase}/login?error=Failed+to+retrieve+access+token");
                }

                // Fetch user info
                using var userinfoClient = new System.Net.Http.HttpClient();
                userinfoClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
                var userinfoResponse = await userinfoClient.GetAsync("https://www.googleapis.com/oauth2/v2/userinfo");
                var userinfoString = await userinfoResponse.Content.ReadAsStringAsync();

                if (!userinfoResponse.IsSuccessStatusCode)
                {
                    return Redirect($"{frontendBase}/login?error=" + System.Uri.EscapeDataString(userinfoString));
                }

                var userInfo = System.Text.Json.JsonSerializer.Deserialize<GoogleUserInfo>(userinfoString);
                if (userInfo == null || string.IsNullOrEmpty(userInfo.Email))
                {
                    return Redirect($"{frontendBase}/login?error=Failed+to+retrieve+google+user+info");
                }

                // Log in user and link with admin account
                var loginResponse = await _authService.LoginWithGoogleInfoAsync(userInfo.Email, userInfo.Name);
                
                var serializedUser = System.Text.Json.JsonSerializer.Serialize(new
                {
                    id = loginResponse.UserId,
                    fullName = loginResponse.FullName,
                    email = loginResponse.Email,
                    role = loginResponse.Role
                });

                return Redirect($"{frontendBase}/login?google_token={System.Uri.EscapeDataString(loginResponse.Token)}&google_user={System.Uri.EscapeDataString(serializedUser)}");
            }

            return Redirect($"{frontendBase}/admin/theses/project");
        }
        catch (Exception ex)
        {
            if (isLoginFlow)
            {
                return Redirect(errorRedirectBase + System.Uri.EscapeDataString(ex.Message));
            }
            return Redirect(errorRedirectBase);
        }
    }

    private class OAuthTokenResponse
    {
        [System.Text.Json.Serialization.JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }
    }

    private class GoogleUserInfo
    {
        [System.Text.Json.Serialization.JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }
}
