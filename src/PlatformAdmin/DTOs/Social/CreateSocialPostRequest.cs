namespace PlatformAdmin.DTOs.Social
{
    public class CreateSocialPostRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = "Tin mới";
        public string BadgeClass { get; set; } = "bg-primary text-on-primary";
        public string Image { get; set; } = string.Empty;
        public string Desc { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool Published { get; set; } = true;
    }
}
