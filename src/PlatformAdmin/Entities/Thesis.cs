namespace PlatformAdmin.Entities;

public class Thesis
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "Pending"; // Pending | InProgress | Submitted | UnderReview | Approved | Rejected | Revision
    public string? FilePath { get; set; }
    public string? RejectReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }

    public int StudentId { get; set; }
    public User Student { get; set; } = null!;

    public int? AdvisorId { get; set; }
    public User? Advisor { get; set; }

    public int? CommitteeId { get; set; }
    public Committee? Committee { get; set; }

    public string? Major { get; set; }
    public string? Subject { get; set; }
    public string? SubjectCode { get; set; }
    public string Category { get; set; } = "Project"; // Project | Topic | Thesis
    public int Batch { get; set; } = 1;

    public ICollection<ThesisReview> Reviews { get; set; } = new List<ThesisReview>();
    public ICollection<ThesisSubmission> Submissions { get; set; } = new List<ThesisSubmission>();
    public ICollection<ThesisComment> Comments { get; set; } = new List<ThesisComment>();
}
