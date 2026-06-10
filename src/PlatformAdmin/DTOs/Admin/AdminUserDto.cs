namespace PlatformAdmin.DTOs.Admin
{
    public class AdminUserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? StudentId { get; set; }
        public string? Department { get; set; }
        public string? Phone { get; set; }
        public bool IsActive { get; set; }
    }
}
