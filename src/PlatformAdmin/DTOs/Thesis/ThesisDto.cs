namespace PlatformAdmin.DTOs.Thesis;

public record ThesisDto(
    int Id,
    string Title,
    string? Description,
    string Status,
    string? FilePath,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    DateTime? SubmittedAt,
    DateTime? ApprovedAt,
    int StudentId,
    string StudentName,
    string? StudentCode,
    int? AdvisorId,
    string? AdvisorName,
    string? Department,
    int ReviewCount,
    decimal? LatestScore
);

public record CreateThesisRequest(
    string Title,
    string? Description
);

public record UpdateThesisRequest(
    string Title,
    string? Description
);

public record AssignAdvisorRequest(int AdvisorId);

public record ThesisListResponse(
    IEnumerable<ThesisDto> Items,
    int TotalCount,
    int Page,
    int PageSize
);

public record ThesisReviewDto(
    int Id,
    int ThesisId,
    string ThesisTitle,
    int ReviewerId,
    string ReviewerName,
    string? Comments,
    decimal? Score,
    string Decision,
    DateTime ReviewedAt
);

public record CreateReviewRequest(
    string? Comments,
    decimal? Score,
    string Decision
);

public record ThesisCommentDto(
    int Id,
    int AuthorId,
    string AuthorName,
    string Role,
    string Content,
    DateTime CreatedAt
);

public record CreateCommentRequest(string Content);

public record ThesisStatsDto(
    int Total,
    int Pending,
    int InProgress,
    int Submitted,
    int UnderReview,
    int Approved,
    int Rejected
);
