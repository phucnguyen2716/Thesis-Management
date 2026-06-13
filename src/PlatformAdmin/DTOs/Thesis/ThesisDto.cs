namespace PlatformAdmin.DTOs.Thesis;

public record ThesisSubmissionDto(
    int Id,
    string FileName,
    string FilePath,
    long FileSize,
    DateTime SubmittedAt
);

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
    decimal? LatestScore,
    string? Major = null,
    string? Subject = null,
    string? SubjectCode = null,
    string Category = "Project",
    IEnumerable<ThesisSubmissionDto>? Submissions = null
);

public record CreateThesisRequest(
    string Title,
    string? Description,
    string? Major = null,
    string? Subject = null,
    string? SubjectCode = null,
    string Category = "Project",
    int? StudentId = null,
    int? AdvisorId = null,
    string? Status = null,
    string? FilePath = null
);

public record UpdateThesisRequest(
    string Title,
    string? Description,
    string? Major = null,
    string? Subject = null,
    string? SubjectCode = null,
    string Category = "Project",
    int? StudentId = null,
    int? AdvisorId = null,
    string? Status = null,
    string? FilePath = null
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
