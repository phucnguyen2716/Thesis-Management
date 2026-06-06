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
    public DbSet<ChatHistoryModel> ChatHistory => Set<ChatHistoryModel>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SocialPost> SocialPosts => Set<SocialPost>();
    public DbSet<PlagiarismReportEntity> PlagiarismReports => Set<PlagiarismReportEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PlagiarismReportEntity>()
            .HasOne(r => r.Thesis)
            .WithMany()
            .HasForeignKey(r => r.ThesisId)
            .OnDelete(DeleteBehavior.Cascade);

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

        // Seed default theses
        modelBuilder.Entity<Thesis>().HasData(
            new Thesis 
            { 
                Id = 1, 
                Title = "Nghiên cứu ứng dụng Trí tuệ nhân tạo (AI) trong giáo dục đại học", 
                Description = "Đề tài thực hiện khảo sát ứng dụng hệ thống gia sư thông minh để hỗ trợ quá trình dạy và học tích cực.", 
                Status = "Approved", 
                StudentId = 3, 
                AdvisorId = 2, 
                CreatedAt = DateTime.UtcNow.AddDays(-30) 
            },
            new Thesis 
            { 
                Id = 2, 
                Title = "Ứng dụng Blockchain trong quản lý và xác thực bảng điểm trực tuyến", 
                Description = "Đồ án đề xuất giải pháp phi tập trung dựa trên Smart Contract Ethereum để giải quyết vấn đề gian lận bảng điểm học thuật.", 
                Status = "InProgress", 
                StudentId = 3, 
                AdvisorId = 2, 
                CreatedAt = DateTime.UtcNow.AddDays(-15) 
            },
            new Thesis 
            { 
                Id = 3, 
                Title = "Phân tích sắc thái cảm xúc người dùng về thương hiệu UEF bằng PhoBERT", 
                Description = "Sử dụng PhoBERT để phân tích 15,000 bài đăng mạng xã hội, phân loại cảm xúc tích cực, tiêu cực và trung lập.", 
                Status = "Submitted", 
                StudentId = 3, 
                AdvisorId = 2, 
                CreatedAt = DateTime.UtcNow.AddDays(-5) 
            }
        );

        modelBuilder.Entity<SocialPost>().HasData(
            new SocialPost
            {
                Id = 1,
                Title = "Công bố danh sách các sáng kiến tiêu biểu học kỳ 1 năm 2024",
                Category = "Tin mới",
                BadgeClass = "bg-primary text-on-primary",
                Image = "https://lh3.googleusercontent.com/aida-public/AB6AXuVaKckFBO6OahgQhL5POM9HkyyecIPbbQpO1dWLvQHUSBcj49wyeR69ByLr8G1HshrXjAzidE5A-wOT6RA7V7eLvC33ch_y8-bNDvNRg1HwmmnaJTAcz8NBYG9tH7A-4q9Aydwy8_z9zEL6dgejrSFafcXOHrBluNSxzC-1l68EVFbA93qGEExIzjN4r7IEyBbD-vnEDCAtJDWdRszsVJdArxh12IA2eUzDBOvizUG5zZuFjD1jL69T8qDOK5VDX_pqXpNUf76mRsk",
                Desc = "Hội đồng chuyên môn đã hoàn tất việc chấm điểm và lựa chọn ra 10 sáng kiến xuất sắc nhất.",
                Content = "Hội đồng chuyên môn đã hoàn tất việc chấm điểm và lựa chọn ra 10 sáng kiến xuất sắc nhất học kỳ.",
                Published = true,
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            },
            new SocialPost
            {
                Id = 2,
                Title = "Hướng dẫn tra cứu và tham khảo kho dữ liệu sáng kiến học thuật",
                Category = "Hướng dẫn",
                BadgeClass = "bg-blue-600 text-white",
                Image = "https://lh3.googleusercontent.com/aida-public/AB6AXuC9CBcdVbi_lVPZdj1fMXkDrm6UXNpgAQzAbT5BzIzcVc1wXGTHcmwvFTTaIEgcFm1wFyYIkxuYp8LKwSkizyelJ4bjIqymKLSgFfukFSODI8QlHCdYgYlzoIpXWPGJ6pwNFnkIc54kH5CFyy19WYTo0HdQ9cSVQ1CNsuV41pZn1z5hhO7krZslwN6YtBpL_fRpzCvXn5HpiOcH4ntw_v0VI8GftCgk9T6IiQz7ikPDYxY5Gr4t4CGGG3_-YsRIM4rMsyCMlTMvyufS",
                Desc = "Sinh viên có thể sử dụng công cụ tìm kiếm thông minh để truy cập tài liệu nghiên cứu.",
                Content = "Sinh viên có thể sử dụng công cụ tìm kiếm thông minh để truy cập tài liệu nghiên cứu và biểu mẫu khoa học.",
                Published = true,
                CreatedAt = DateTime.UtcNow.AddDays(-28)
            },
            new SocialPost
            {
                Id = 3,
                Title = "Hệ thống AI Gemini hỗ trợ phân tích và tóm tắt sáng kiến",
                Category = "Tính năng",
                BadgeClass = "bg-purple-600 text-white",
                Image = "https://lh3.googleusercontent.com/aida-public/AB6AXuANxGO4D6ojuZlYk7MEhtq_38tsfUs324mV9MOXepahz-7q_MfJXjqjvHbgLt27PAjQquIgxNbU4l8TFLxxTqokf9fiaJRq8mxeZIqQU-_fhU1ho_Omjv4xl_49kl_cJIIr3tyg5-3Lu3GYiLPM2N3psKIdMJtF-p6DcwYjflkXf24kayQ57904JAS0eyc8PMffw-nv4NNzDqKse0KbLJ4YWmW0Hqys7UoOYciK4A2BTM_k2g3B1Slq6NwqcMgwtqtuEWUyLaQ7lH_W",
                Desc = "Tích hợp Gemini giúp sinh viên nắm bắt nội dung cốt lõi của đề tài phức tạp.",
                Content = "Tích hợp Gemini giúp sinh viên nắm bắt nội dung cốt lõi của đề tài phức tạp, phân tích biểu đồ và xu hướng nghiên cứu.",
                Published = true,
                CreatedAt = DateTime.UtcNow.AddDays(-25)
            }
        );
    }

    private static string BCrypt(string password) =>
        global::BCrypt.Net.BCrypt.HashPassword(password);
}
