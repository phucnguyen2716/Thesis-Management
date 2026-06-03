namespace PlatformAdmin.Entities;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Student"; // Student | Advisor | Admin
    public string? StudentId { get; set; }
    public string? Department { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Thesis> Theses { get; set; } = new List<Thesis>();
    public ICollection<Thesis> AdvisedTheses { get; set; } = new List<Thesis>();
}
