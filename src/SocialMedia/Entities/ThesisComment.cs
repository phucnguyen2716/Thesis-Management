using PlatformAdmin.Entities;

namespace SocialMedia.Entities;

public class ThesisComment
{
    public int Id { get; set; }
    public int ThesisId { get; set; }
    public Thesis Thesis { get; set; } = null!;
    public int AuthorId { get; set; }
    public User Author { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
