using System.Security.Claims;
using PlatformAdmin.DTOs.Thesis;
using PlatformAdmin.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PlatformAdmin.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ThesisController : ControllerBase
{
    private readonly IThesisService _thesisService;
    private readonly IReviewService _reviewService;
    private readonly ICommentService _commentService;

    public ThesisController(IThesisService thesisService, IReviewService reviewService, ICommentService commentService)
    {
        _thesisService = thesisService;
        _reviewService = reviewService;
        _commentService = commentService;
    }

    private int GetCurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<ThesisListResponse>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? status = null, [FromQuery] string? search = null)
    {
        var userId = GetCurrentUserId();
        var role = User.FindFirstValue(ClaimTypes.Role);

        int? studentId = role == "Student" ? userId : null;
        int? advisorId = role == "Advisor" ? userId : null;

        var result = await _thesisService.GetAllAsync(page, pageSize, status, search, studentId, advisorId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ThesisDto>> GetById(int id)
    {
        var thesis = await _thesisService.GetByIdAsync(id);
        if (thesis == null) return NotFound();
        return Ok(thesis);
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ThesisDto>> Create(CreateThesisRequest request)
    {
        var result = await _thesisService.CreateAsync(GetCurrentUserId(), request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ThesisDto>> Update(int id, UpdateThesisRequest request)
    {
        var result = await _thesisService.UpdateAsync(id, request);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _thesisService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id}/submit")]
    public async Task<ActionResult<ThesisDto>> Submit(int id)
    {
        var result = await _thesisService.SubmitAsync(id);
        return Ok(result);
    }

    [HttpPost("{id}/assign-advisor")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ThesisDto>> AssignAdvisor(int id, AssignAdvisorRequest request)
    {
        var result = await _thesisService.AssignAdvisorAsync(id, request);
        return Ok(result);
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Admin,Advisor")]
    public async Task<ActionResult<ThesisDto>> Approve(int id)
    {
        var result = await _thesisService.ApproveAsync(id);
        return Ok(result);
    }

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "Admin,Advisor")]
    public async Task<ActionResult<ThesisDto>> Reject(int id, [FromBody] string reason)
    {
        var result = await _thesisService.RejectAsync(id, reason);
        return Ok(result);
    }

    [HttpPost("{id}/upload")]
    public async Task<ActionResult<string>> Upload(int id, IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("No file uploaded.");
        using var stream = file.OpenReadStream();
        var result = await _thesisService.UploadFileAsync(id, stream, file.FileName, file.ContentType);
        return Ok(new { filePath = result });
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ThesisStatsDto>> GetStats()
    {
        var result = await _thesisService.GetStatsAsync();
        return Ok(result);
    }

    // Reviews & Comments nested endpoints
    [HttpGet("{id}/reviews")]
    public async Task<ActionResult<IEnumerable<ThesisReviewDto>>> GetReviews(int id)
    {
        return Ok(await _reviewService.GetByThesisAsync(id));
    }

    [HttpPost("{id}/reviews")]
    [Authorize(Roles = "Advisor,Admin")]
    public async Task<ActionResult<ThesisReviewDto>> AddReview(int id, CreateReviewRequest request)
    {
        var result = await _reviewService.CreateAsync(id, GetCurrentUserId(), request);
        return Ok(result);
    }

    [HttpGet("{id}/comments")]
    public async Task<ActionResult<IEnumerable<ThesisCommentDto>>> GetComments(int id)
    {
        return Ok(await _commentService.GetByThesisAsync(id));
    }

    [HttpPost("{id}/comments")]
    public async Task<ActionResult<ThesisCommentDto>> AddComment(int id, CreateCommentRequest request)
    {
        var result = await _commentService.CreateAsync(id, GetCurrentUserId(), request);
        return Ok(result);
    }
}
