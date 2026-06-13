using System;

namespace PlatformAdmin.DTOs.Social
{
    public class SocialPostDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string BadgeClass { get; set; } = string.Empty;
        public string Image { get; set; } = string.Empty;
        public string Desc { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool Published { get; set; }
        public string CloudinaryStatus { get; set; } = "None";
        public DateTime CreatedAt { get; set; }
    }
}
