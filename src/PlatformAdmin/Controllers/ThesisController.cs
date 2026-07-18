using System.Security.Claims;
using PlatformAdmin.DTOs.Thesis;
using PlatformAdmin.Interfaces;
using PlatformAdmin.Attributes;
using PlatformAdmin.Services;
using PlatformAdmin.Jobs;
using PlatformAdmin.Data;
using PlatformAdmin.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace PlatformAdmin.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ThesisController : ControllerBase
{
    private readonly IThesisService _thesisService;
    private readonly IReviewService _reviewService;
    private readonly IGoogleDriveStorageService _driveService;
    private readonly AppDbContext _db;

    public ThesisController(IThesisService thesisService, IReviewService reviewService, IGoogleDriveStorageService driveService, AppDbContext db)
    {
        _thesisService = thesisService;
        _reviewService = reviewService;
        _driveService = driveService;
        _db = db;
    }

    private int GetCurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [ApiResponse(typeof(ThesisListResponse), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ThesisListResponse>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? status = null, [FromQuery] string? search = null, [FromQuery] string? category = null, [FromQuery] int? batch = null)
    {
        var userId = GetCurrentUserId();
        var role = User.FindFirstValue(ClaimTypes.Role);
        int? studentId = role == "Student" ? userId : null;
        int? advisorId = role == "Advisor" ? userId : null;
        var result = await _thesisService.GetAllAsync(page, pageSize, status, search, studentId, advisorId, category, batch);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
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
                return BadRequest("StudentId is required for Admin to create a thesis.");
            studentId = request.StudentId.Value;
        }
        else
        {
            studentId = GetCurrentUserId();
        }
        var result = await _thesisService.CreateAsync(studentId, request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    [ApiResponse(typeof(ThesisDto), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status400BadRequest)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ThesisDto>> Update(int id, UpdateThesisRequest request)
    {
        try
        {
            var result = await _thesisService.UpdateAsync(id, request);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id:int}")]
    [ApiResponse(StatusCodes.Status204NoContent)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _thesisService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id:int}/submit")]
    [ApiResponse(typeof(ThesisDto), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status400BadRequest)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ThesisDto>> Submit(int id)
    {
        var result = await _thesisService.SubmitAsync(id);
        return Ok(result);
    }

    [HttpPost("{id:int}/assign-advisor")]
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

    [HttpPost("{id:int}/approve")]
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

    [HttpPost("{id:int}/reject")]
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

    [HttpPost("{id:int}/upload")]
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

    [HttpGet("{id:int}/reviews")]
    [ApiResponse(typeof(IEnumerable<ThesisReviewDto>), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<ThesisReviewDto>>> GetReviews(int id)
    {
        return Ok(await _reviewService.GetByThesisAsync(id));
    }

    [HttpPost("{id:int}/reviews")]
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



    [HttpPost("practice/evaluate")]
    [ApiResponse(typeof(ThesisPracticeEvaluationResult), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status400BadRequest)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ThesisPracticeEvaluationResult>> EvaluatePractice([FromBody] EvaluatePracticeRequest request, [FromServices] IGeminiService geminiService)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Content))
            return BadRequest("Content cannot be empty.");

        var result = await geminiService.EvaluateThesisPracticeAsync(
            request.Content,
            request.ThesisTitle,
            request.ChapterId,
            request.ChapterLabel,
            request.RequiredSections
        );
        return Ok(result);
    }

    [HttpGet("{id}/ai-summary")]
    [ApiResponse(typeof(ThesisAiSummaryResult), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ThesisAiSummaryResult>> GetAiSummary(int id, [FromServices] IGeminiService geminiService)
    {
        var thesis = await _db.Theses.FirstOrDefaultAsync(t => t.Id == id);
        if (thesis == null)
            return NotFound("Thesis not found");

        byte[]? pdfBytes = null;
        if (!string.IsNullOrEmpty(thesis.FilePath))
        {
            try
            {
                string cleanPath = thesis.FilePath
                    .Replace("http://localhost:5145", "")
                    .Replace("https://ethesis-backend-api.onrender.com", "")
                    .TrimStart('/');
                string absolutePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", cleanPath);
                if (System.IO.File.Exists(absolutePath))
                {
                    pdfBytes = await System.IO.File.ReadAllBytesAsync(absolutePath);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error reading thesis file for AI summary: {ex.Message}");
            }
        }

        var result = await geminiService.GenerateThesisSummaryAsync(
            thesis.Title,
            thesis.Description ?? "",
            pdfBytes
        );

        return Ok(result);
    }

}
