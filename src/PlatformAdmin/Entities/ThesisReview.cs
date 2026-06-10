namespace PlatformAdmin.Entities;

public class ThesisReview
{
    public int Id { get; set; }
    public int ThesisId { get; set; }
    public Thesis Thesis { get; set; } = null!;
    public int ReviewerId { get; set; }
    public User Reviewer { get; set; } = null!;
    public string? Comments { get; set; }
    public decimal? Score { get; set; }
    public string Decision { get; set; } = "Pending"; // Pending | Approved | Rejected | Revision
    public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;
}
