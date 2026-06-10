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
            .Include(r => r.Reviewer)
            .Include(r => r.Thesis)
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

public class CommentService : ICommentService
{
    private readonly AppDbContext _db;
    public CommentService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<ThesisCommentDto>> GetByThesisAsync(int thesisId)
    {
        return await _db.ThesisComments
            .Include(c => c.Author)
            .Where(c => c.ThesisId == thesisId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new ThesisCommentDto(c.Id, c.AuthorId, c.Author.FullName,
                c.Author.Role, c.Content, c.CreatedAt))
            .ToListAsync();
    }

    public async Task<ThesisCommentDto> CreateAsync(int thesisId, int authorId, CreateCommentRequest request)
    {
        var comment = new ThesisComment
        {
            ThesisId = thesisId,
            AuthorId = authorId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow
        };
        _db.ThesisComments.Add(comment);
        await _db.SaveChangesAsync();
        var author = await _db.Users.FindAsync(authorId);
        return new ThesisCommentDto(comment.Id, authorId, author!.FullName, author.Role, comment.Content, comment.CreatedAt);
    }
}
