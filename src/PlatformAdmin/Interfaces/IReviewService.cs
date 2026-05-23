using PlatformAdmin.DTOs.Thesis;

namespace PlatformAdmin.Interfaces;

public interface IReviewService
{
    Task<IEnumerable<ThesisReviewDto>> GetByThesisAsync(int thesisId);
    Task<ThesisReviewDto> CreateAsync(int thesisId, int reviewerId, CreateReviewRequest request);
}

public interface ICommentService
{
    Task<IEnumerable<ThesisCommentDto>> GetByThesisAsync(int thesisId);
    Task<ThesisCommentDto> CreateAsync(int thesisId, int authorId, CreateCommentRequest request);
}
