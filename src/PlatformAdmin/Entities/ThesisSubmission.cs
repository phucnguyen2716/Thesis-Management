namespace PlatformAdmin.Entities;

public class ThesisSubmission
{
    public int Id { get; set; }
    public int ThesisId { get; set; }
    public Thesis Thesis { get; set; } = null!;
    public string FilePath { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public int Version { get; set; } = 1;
    public string? Notes { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
