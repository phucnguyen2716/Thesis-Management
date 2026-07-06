using System;

namespace PlatformAdmin.Entities;

public class SocialPost
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = "Tin mới";
    public string BadgeClass { get; set; } = "bg-primary text-on-primary";
    public string Image { get; set; } = string.Empty;
    public string Desc { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool Published { get; set; } = true;
    public string CloudinaryStatus { get; set; } = "None"; // None, Pending, Uploaded, Failed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int AuthorId { get; set; } = 1;
    public User Author { get; set; } = null!;
    public int ViewCount { get; set; } = 0;
    public int LikesCount { get; set; } = 0;
    public DateTime? UpdatedAt { get; set; }
}
