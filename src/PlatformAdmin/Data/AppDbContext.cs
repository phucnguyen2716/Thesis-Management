using PlatformAdmin.Entities;
using Microsoft.EntityFrameworkCore;

namespace PlatformAdmin.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Thesis> Theses => Set<Thesis>();
    public DbSet<ThesisReview> ThesisReviews => Set<ThesisReview>();
    public DbSet<ThesisSubmission> ThesisSubmissions => Set<ThesisSubmission>();
    public DbSet<ThesisComment> ThesisComments => Set<ThesisComment>();
    public DbSet<Committee> Committees => Set<Committee>();
    public DbSet<CommitteeMember> CommitteeMembers => Set<CommitteeMember>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Thesis>()
            .HasOne(t => t.Student)
            .WithMany(u => u.Theses)
            .HasForeignKey(t => t.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Thesis>()
            .HasOne(t => t.Advisor)
            .WithMany(u => u.AdvisedTheses)
            .HasForeignKey(t => t.AdvisorId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ThesisReview>()
            .HasOne(r => r.Reviewer)
            .WithMany()
            .HasForeignKey(r => r.ReviewerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ThesisComment>()
            .HasOne(c => c.Author)
            .WithMany()
            .HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CommitteeMember>()
            .HasOne(cm => cm.User)
            .WithMany()
            .HasForeignKey(cm => cm.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Seed roles
        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, FullName = "Admin User", Email = "admin@ethesis.edu.vn", PasswordHash = BCrypt("admin123"), Role = "Admin", IsActive = true, CreatedAt = DateTime.UtcNow },
            new User { Id = 2, FullName = "Dr. Nguyen Van A", Email = "advisor@ethesis.edu.vn", PasswordHash = BCrypt("advisor123"), Role = "Advisor", Department = "Computer Science", IsActive = true, CreatedAt = DateTime.UtcNow },
            new User { Id = 3, FullName = "Tran Thi B", Email = "student@ethesis.edu.vn", PasswordHash = BCrypt("student123"), Role = "Student", StudentId = "SV001", Department = "Computer Science", IsActive = true, CreatedAt = DateTime.UtcNow }
        );
    }

    private static string BCrypt(string password) =>
        global::BCrypt.Net.BCrypt.HashPassword(password);
}
