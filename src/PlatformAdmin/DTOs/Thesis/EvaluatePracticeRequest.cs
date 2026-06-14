using System.Collections.Generic;

namespace PlatformAdmin.DTOs.Thesis;

public class EvaluatePracticeRequest
{
    public string Content { get; set; } = string.Empty;
    public string ThesisTitle { get; set; } = string.Empty;
    public string ChapterId { get; set; } = string.Empty;
    public string ChapterLabel { get; set; } = string.Empty;
    public List<string> RequiredSections { get; set; } = new();
}
