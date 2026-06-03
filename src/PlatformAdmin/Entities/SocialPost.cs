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
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
