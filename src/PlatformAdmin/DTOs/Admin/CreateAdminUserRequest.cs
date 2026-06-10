namespace PlatformAdmin.DTOs.Admin
{
    public class CreateAdminUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "Student";
        public string? StudentId { get; set; }
        public string? Department { get; set; }
        public string? Phone { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
