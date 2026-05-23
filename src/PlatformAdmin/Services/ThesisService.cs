using PlatformAdmin.DTOs.Thesis;
using PlatformAdmin.Interfaces;
using PlatformAdmin.Entities;
using PlatformAdmin.Data;
using Microsoft.EntityFrameworkCore;

namespace PlatformAdmin.Services;

public class ThesisService : IThesisService
{
    private readonly AppDbContext _db;
    private readonly string _uploadPath;

    public ThesisService(AppDbContext db)
    {
        _db = db;
        _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        Directory.CreateDirectory(_uploadPath);
    }

    private IQueryable<Thesis> BaseQuery() => _db.Theses
        .Include(t => t.Student)
        .Include(t => t.Advisor)
        .Include(t => t.Reviews);

    private static ThesisDto Map(Thesis t) => new(
        t.Id, t.Title, t.Description, t.Status, t.FilePath,
        t.CreatedAt, t.UpdatedAt, t.SubmittedAt, t.ApprovedAt,
        t.StudentId, t.Student.FullName, t.Student.StudentId,
        t.AdvisorId, t.Advisor?.FullName,
        t.Student.Department,
        t.Reviews.Count,
        t.Reviews.Any() ? t.Reviews.Max(r => r.Score) : null
    );

    public async Task<ThesisListResponse> GetAllAsync(int page, int pageSize, string? status, string? search, int? studentId, int? advisorId)
    {
        var q = BaseQuery().AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(t => t.Status == status);
        if (!string.IsNullOrEmpty(search)) q = q.Where(t => t.Title.Contains(search) || t.Student.FullName.Contains(search));
        if (studentId.HasValue) q = q.Where(t => t.StudentId == studentId);
        if (advisorId.HasValue) q = q.Where(t => t.AdvisorId == advisorId);

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
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };
        _db.Theses.Add(thesis);
        await _db.SaveChangesAsync();
        return Map(await BaseQuery().FirstAsync(t => t.Id == thesis.Id));
    }

    public async Task<ThesisDto> UpdateAsync(int id, UpdateThesisRequest request)
    {
        var thesis = await _db.Theses.FindAsync(id) ?? throw new KeyNotFoundException();
        thesis.Title = request.Title;
        thesis.Description = request.Description;
        thesis.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Map(await BaseQuery().FirstAsync(t => t.Id == id));
    }

    public async Task DeleteAsync(int id)
    {
        var thesis = await _db.Theses.FindAsync(id) ?? throw new KeyNotFoundException();
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
        return Map(await BaseQuery().FirstAsync(t => t.Id == id));
    }

    public async Task<ThesisDto> ApproveAsync(int id)
    {
        var thesis = await _db.Theses.FindAsync(id) ?? throw new KeyNotFoundException();
        thesis.Status = "Approved";
        thesis.ApprovedAt = DateTime.UtcNow;
        thesis.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Map(await BaseQuery().FirstAsync(t => t.Id == id));
    }

    public async Task<ThesisDto> RejectAsync(int id, string reason)
    {
        var thesis = await _db.Theses.FindAsync(id) ?? throw new KeyNotFoundException();
        thesis.Status = "Rejected";
        thesis.RejectReason = reason;
        thesis.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Map(await BaseQuery().FirstAsync(t => t.Id == id));
    }

    public async Task<ThesisDto> SetRevisionAsync(int id)
    {
        var thesis = await _db.Theses.FindAsync(id) ?? throw new KeyNotFoundException();
        thesis.Status = "Revision";
        thesis.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Map(await BaseQuery().FirstAsync(t => t.Id == id));
    }

    public async Task<string> UploadFileAsync(int id, Stream fileStream, string fileName, string contentType)
    {
        var thesis = await _db.Theses.FindAsync(id) ?? throw new KeyNotFoundException();
        var ext = Path.GetExtension(fileName);
        var savedName = $"thesis_{id}_{DateTime.UtcNow.Ticks}{ext}";
        var fullPath = Path.Combine(_uploadPath, savedName);
        using var fs = File.Create(fullPath);
        await fileStream.CopyToAsync(fs);

        var submission = new ThesisSubmission
        {
            ThesisId = id,
            FilePath = fullPath,
            FileName = fileName,
            FileSize = new FileInfo(fullPath).Length,
            Version = await _db.ThesisSubmissions.CountAsync(s => s.ThesisId == id) + 1,
            SubmittedAt = DateTime.UtcNow
        };
        _db.ThesisSubmissions.Add(submission);

        thesis.FilePath = $"/uploads/{savedName}";
        thesis.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return thesis.FilePath;
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
}
