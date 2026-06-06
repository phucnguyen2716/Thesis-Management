using System;

namespace PlatformAdmin.DTOs.Admin
{
    public class AdminAuditLogDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public DateTime At { get; set; }
    }
}
