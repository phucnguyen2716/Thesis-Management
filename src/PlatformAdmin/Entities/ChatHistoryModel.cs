using System;

namespace PlatformAdmin.Entities
{
    public class ChatHistoryModel
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N").Substring(0, 12);
        public string Prompt { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool Success { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
