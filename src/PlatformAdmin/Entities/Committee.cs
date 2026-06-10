namespace PlatformAdmin.Entities;

public class Committee
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<CommitteeMember> Members { get; set; } = new List<CommitteeMember>();
    public ICollection<Thesis> Theses { get; set; } = new List<Thesis>();
}

public class CommitteeMember
{
    public int Id { get; set; }
    public int CommitteeId { get; set; }
    public Committee Committee { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Role { get; set; } = "Member"; // Chair | Member
}
