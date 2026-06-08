using System.Security.Claims;
using PlatformAdmin.DTOs.Thesis;
using PlatformAdmin.Interfaces;
using PlatformAdmin.Attributes;
using PlatformAdmin.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

namespace PlatformAdmin.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ThesisController : ControllerBase
{
    private readonly IThesisService _thesisService;
    private readonly IReviewService _reviewService;
    private readonly ICommentService _commentService;
    private readonly IGoogleDriveStorageService _driveService;

    public ThesisController(IThesisService thesisService, IReviewService reviewService, ICommentService commentService, IGoogleDriveStorageService driveService)
    {
        _thesisService = thesisService;
        _reviewService = reviewService;
        _commentService = commentService;
        _driveService = driveService;
    }

    private int GetCurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [ApiResponse(typeof(ThesisListResponse), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ThesisListResponse>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? status = null, [FromQuery] string? search = null, [FromQuery] string? category = null)
    {
        var userId = GetCurrentUserId();
        var role = User.FindFirstValue(ClaimTypes.Role);

        int? studentId = role == "Student" ? userId : null;
        int? advisorId = role == "Advisor" ? userId : null;

        var result = await _thesisService.GetAllAsync(page, pageSize, status, search, studentId, advisorId, category);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [ApiResponse(typeof(ThesisDto), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ThesisDto>> GetById(int id)
    {
        var thesis = await _thesisService.GetByIdAsync(id);
        if (thesis == null) return NotFound();
        return Ok(thesis);
    }

    [HttpPost]
    [Authorize(Roles = "Student,Admin")]
    [ApiResponse(typeof(ThesisDto), StatusCodes.Status201Created)]
    [ApiResponse(StatusCodes.Status400BadRequest)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ThesisDto>> Create(CreateThesisRequest request)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        int studentId;
        if (role == "Admin")
        {
            if (request.StudentId == null || request.StudentId == 0)
            {
                return BadRequest("StudentId is required for Admin to create a thesis.");
            }
            studentId = request.StudentId.Value;
        }
        else
        {
            studentId = GetCurrentUserId();
        }

        var result = await _thesisService.CreateAsync(studentId, request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [ApiResponse(typeof(ThesisDto), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status400BadRequest)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ThesisDto>> Update(int id, UpdateThesisRequest request)
    {
        var result = await _thesisService.UpdateAsync(id, request);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [ApiResponse(StatusCodes.Status204NoContent)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        await _thesisService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id}/submit")]
    [ApiResponse(typeof(ThesisDto), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status400BadRequest)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ThesisDto>> Submit(int id)
    {
        var result = await _thesisService.SubmitAsync(id);
        return Ok(result);
    }

    [HttpPost("{id}/assign-advisor")]
    [Authorize(Roles = "Admin")]
    [ApiResponse(typeof(ThesisDto), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status400BadRequest)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status403Forbidden)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ThesisDto>> AssignAdvisor(int id, AssignAdvisorRequest request)
    {
        var result = await _thesisService.AssignAdvisorAsync(id, request);
        return Ok(result);
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Admin,Advisor")]
    [ApiResponse(typeof(ThesisDto), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status400BadRequest)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status403Forbidden)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ThesisDto>> Approve(int id)
    {
        var result = await _thesisService.ApproveAsync(id);
        return Ok(result);
    }

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "Admin,Advisor")]
    [ApiResponse(typeof(ThesisDto), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status400BadRequest)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status403Forbidden)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ThesisDto>> Reject(int id, [FromBody] string reason)
    {
        var result = await _thesisService.RejectAsync(id, reason);
        return Ok(result);
    }

    [HttpPost("{id}/upload")]
    [ApiResponse(typeof(object), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status400BadRequest)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<string>> Upload(int id, IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("No file uploaded.");
        using var stream = file.OpenReadStream();
        var result = await _thesisService.UploadFileAsync(id, stream, file.FileName, file.ContentType);
        return Ok(new { filePath = result });
    }

    [HttpPost("sync-drive")]
    [Authorize(Roles = "Admin")]
    [ApiResponse(StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status400BadRequest)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SyncDrive([FromQuery] string category)
    {
        if (string.IsNullOrEmpty(category)) return BadRequest("Category is required.");
        await _thesisService.SyncDriveFoldersAsync(category);
        return Ok(new { message = "Drive folders synchronized successfully." });
    }

    [HttpGet("stats")]
    [ApiResponse(typeof(ThesisStatsDto), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ThesisStatsDto>> GetStats()
    {
        var result = await _thesisService.GetStatsAsync();
        return Ok(result);
    }

    // Reviews & Comments nested endpoints
    [HttpGet("{id}/reviews")]
    [ApiResponse(typeof(IEnumerable<ThesisReviewDto>), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<ThesisReviewDto>>> GetReviews(int id)
    {
        return Ok(await _reviewService.GetByThesisAsync(id));
    }

    [HttpPost("{id}/reviews")]
    [Authorize(Roles = "Advisor,Admin")]
    [ApiResponse(typeof(ThesisReviewDto), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status400BadRequest)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status403Forbidden)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ThesisReviewDto>> AddReview(int id, CreateReviewRequest request)
    {
        var result = await _reviewService.CreateAsync(id, GetCurrentUserId(), request);
        return Ok(result);
    }

    [HttpGet("{id}/comments")]
    [ApiResponse(typeof(IEnumerable<ThesisCommentDto>), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<ThesisCommentDto>>> GetComments(int id)
    {
        return Ok(await _commentService.GetByThesisAsync(id));
    }

    [HttpPost("{id}/comments")]
    [ApiResponse(typeof(ThesisCommentDto), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status400BadRequest)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ThesisCommentDto>> AddComment(int id, CreateCommentRequest request)
    {
        var result = await _commentService.CreateAsync(id, GetCurrentUserId(), request);
        return Ok(result);
    }

    [HttpGet("drive-files")]
    [ApiResponse(typeof(List<DriveFileInfo>), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status400BadRequest)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<DriveFileInfo>>> ListDriveFiles([FromQuery] string folder = "Temporary_PDF", [FromQuery] string category = "Project")
    {
        if (string.IsNullOrEmpty(folder)) return BadRequest("Folder name is required.");

        AcademicCategory cat;
        switch (category.ToLower())
        {
            case "project": cat = AcademicCategory.Project; break;
            case "topic": cat = AcademicCategory.Topic; break;
            case "thesis": cat = AcademicCategory.Thesis; break;
            default: return BadRequest($"Invalid category: {category}. Use Project, Topic, or Thesis.");
        }

        var files = await _driveService.ListFilesFromFolderAsync(folder, cat);
        return Ok(files);
    }
}
