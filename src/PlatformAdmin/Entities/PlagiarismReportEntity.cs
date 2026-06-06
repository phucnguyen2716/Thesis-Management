using System;

namespace PlatformAdmin.Entities;

public class PlagiarismReportEntity
{
    public int Id { get; set; }
    public int ThesisId { get; set; }
    public Thesis Thesis { get; set; } = null!;
    public double SimilarityPercentage { get; set; }
    public string ReportJson { get; set; } = string.Empty;
    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
}
