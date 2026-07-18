using PlatformAdmin.DTOs.Thesis;
using PlatformAdmin.Interfaces;
using PlatformAdmin.Entities;
using PlatformAdmin.Data;
using Microsoft.EntityFrameworkCore;

namespace PlatformAdmin.Services;

public class ReviewService : IReviewService
{
    private readonly AppDbContext _db;
    public ReviewService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<ThesisReviewDto>> GetByThesisAsync(int thesisId)
    {
        return await _db.ThesisReviews
            .Where(r => r.ThesisId == thesisId)
            .Select(r => new ThesisReviewDto(r.Id, r.ThesisId, r.Thesis.Title,
                r.ReviewerId, r.Reviewer.FullName, r.Comments, r.Score, r.Decision, r.ReviewedAt))
            .ToListAsync();
    }

    public async Task<ThesisReviewDto> CreateAsync(int thesisId, int reviewerId, CreateReviewRequest request)
    {
        var thesis = await _db.Theses.FindAsync(thesisId) ?? throw new KeyNotFoundException();
        var review = new ThesisReview
        {
            ThesisId = thesisId,
            ReviewerId = reviewerId,
            Comments = request.Comments,
            Score = request.Score,
            Decision = request.Decision,
            ReviewedAt = DateTime.UtcNow
        };
        _db.ThesisReviews.Add(review);
        thesis.Status = request.Decision == "Approved" ? "Approved"
            : request.Decision == "Rejected" ? "Rejected"
            : "UnderReview";
        thesis.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var reviewer = await _db.Users.FindAsync(reviewerId);
        return new ThesisReviewDto(review.Id, thesisId, thesis.Title,
            reviewerId, reviewer!.FullName, review.Comments, review.Score, review.Decision, review.ReviewedAt);
    }
}

