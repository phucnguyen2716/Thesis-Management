using System.Collections.Generic;

namespace PlatformAdmin.DTOs.Thesis;

public class ThesisPracticeEvaluationResult
{
    public double ContentScore { get; set; }
    public double OriginalityScore { get; set; }
    public string Feedback { get; set; } = string.Empty;
    public List<PracticeFeedbackItem> FeedbackItems { get; set; } = new();
    public bool IsGibberishOrNonsense { get; set; }
}

public class PracticeFeedbackItem
{
    public string Type { get; set; } = "info"; // "success", "warning", "info"
    public string Title { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
}
