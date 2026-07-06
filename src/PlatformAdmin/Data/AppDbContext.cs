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
    public DbSet<Notification> Notifications => Set<Notification>();

    public DbSet<ChatHistoryModel> ChatHistory => Set<ChatHistoryModel>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SocialPost> SocialPosts => Set<SocialPost>();
    public DbSet<PlagiarismReportEntity> PlagiarismReports => Set<PlagiarismReportEntity>();
    public DbSet<DriveFileRecord> DriveFileRecords => Set<DriveFileRecord>();

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

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SocialPost>()
            .HasOne(p => p.Author)
            .WithMany()
            .HasForeignKey(p => p.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);





        // Seed roles
        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, FullName = "Admin User", Email = "admin@ethesis.edu.vn", PasswordHash = BCrypt("123"), Role = "Admin", IsActive = true, CreatedAt = DateTime.UtcNow },
            new User { Id = 2, FullName = "Dr. Nguyen Van A", Email = "advisor@ethesis.edu.vn", PasswordHash = BCrypt("123"), Role = "Advisor", Department = "Computer Science", IsActive = true, CreatedAt = DateTime.UtcNow },
            new User { Id = 3, FullName = "Tran Thi B", Email = "student@ethesis.edu.vn", PasswordHash = BCrypt("123"), Role = "Student", StudentId = "SV001", Department = "Computer Science", IsActive = true, CreatedAt = DateTime.UtcNow }
        );


        modelBuilder.Entity<SocialPost>().HasData(
            new SocialPost
            {
                Id = 1,
                Title = "Công bố danh sách các sáng kiến tiêu biểu học kỳ 1 năm 2024",
                Category = "Tin mới",
                BadgeClass = "bg-primary text-on-primary",
                Image = "https://lh3.googleusercontent.com/aida-public/AB6AXuDVaKckFBO6OahgQhL5POM9HkyyecIPbbQpO1dWLvQHUSBcj49wyeR69ByLr8G1HshrXjAzidE5A-wOT6RA7V7eLvC33ch_y8-bNDvNRg1HwmmnaJTAcz8NBYG9tH7A-4q9Aydwy8_z9zEL6dgejrSFafcXOHrBluNSxzC-1l68EVFbA93qGEExIzjN4r7IEyBbD-vnEDCAtJDWdRszsVJdArxh12IA2eUzDBOvizUG5zZuFjD1jL69T8qDOK5VDX_pqXpNUf76mRsk",
                Desc = "Hội đồng chuyên môn Khoa học và Công nghệ nhà trường đã hoàn tất công tác đánh giá, chấm điểm và chính thức công bố danh sách 10 sáng kiến tiêu biểu nhất trong học kỳ 1 năm học 2024 - 2025. Các đề tài đạt giải năm nay trải rộng trên nhiều lĩnh vực mũi nhọc như Trí tuệ nhân tạo, Công nghệ mạng thế hệ mới, Hệ thống nhúng và IoT, mở ra nhiều hướng phát triển thực tiễn đầy triển vọng.",
                Content = "Sau hơn 2 tháng làm việc nghiêm túc, khách quan và chuyên nghiệp, Hội đồng chuyên môn Khoa học và Công nghệ nhà trường đã hoàn tất việc đánh giá toàn diện hơn 80 đề tài nộp về từ các Khoa thành viên. Ban tổ chức xin chúc mừng 10 sáng kiến tiêu biểu nhất đã xuất sắc vượt qua các vòng phản biện gắt gao để đạt chứng nhận cấp Trường. Các đề tài đạt giải không chỉ thể hiện sự đầu tư bài bản về mặt học thuật mà còn giải quyết trực tiếp nhiều bài toán thực tế của doanh nghiệp và xã hội. Những nghiên cứu tiêu biểu bao gồm dự án phát hiện vi phạm giao thông bằng AI của nhóm sinh viên CNTT, và giải pháp tối ưu hệ thống IoT trong nông nghiệp công nghệ cao của sinh viên Điện tử.\n\nHội đồng đánh giá năm nay quy tụ các phó giáo sư, tiến sĩ đầu ngành cùng các giám đốc công nghệ từ các tập đoàn đối tác lớn, đảm bảo tính thực tiễn cao cho mỗi đề tài được lựa chọn. Theo quy chế mới, các nhóm tác giả sở hữu đề tài tiêu biểu sẽ nhận được gói tài trợ phát triển sản phẩm trị giá lên tới 50 triệu đồng mỗi đề tài từ Quỹ Phát triển Khoa học Công nghệ nhà trường. Bên cạnh đó, Văn phòng Chuyển giao Công nghệ và Sở hữu Trí tuệ sẽ trực tiếp hỗ trợ 100% chi phí đăng ký bảo hộ quyền tác giả hoặc sáng chế cho các sáng kiến này, đồng thời kết nối trực tiếp các nhóm nghiên cứu với mạng lưới hơn 50 doanh nghiệp đối tác lớn để thực hiện chuyển giao công nghệ hoặc ươm tạo doanh nghiệp khởi nghiệp (spin-off) ngay trong khuôn viên trường trong học kỳ tới.",
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
                Desc = "Để hỗ trợ sinh viên trong quá trình học tập, nghiên cứu và làm đồ án tốt nghiệp, Ban Thư viện phối hợp cùng Khoa CNTT xây dựng tài liệu hướng dẫn tra cứu kho dữ liệu số hóa. Hệ thống mới tích hợp công cụ tìm kiếm thông minh theo từ khóa, ngành học và mã số giảng viên hướng dẫn, giúp việc tiếp cận kho tri thức số hóa trở nên dễ dàng và nhanh chóng hơn bao giờ hết.",
                Content = "Nhằm nâng cao chất lượng tự học và thúc đẩy phong trào nghiên cứu khoa học trong sinh viên, Thư viện số chính thức giới thiệu cẩm nang hướng dẫn sử dụng kho dữ liệu sáng kiến học thuật số hóa. Sinh viên có thể truy cập hệ thống trực tuyến thông qua tài khoản sinh viên được cấp. Quy trình tra cứu gồm 4 bước đơn giản: 1. Đăng nhập hệ thống; 2. Sử dụng thanh tìm kiếm thông minh kết hợp các bộ lọc chuyên sâu (Lĩnh vực, Học kỳ, Giảng viên); 3. Đọc tóm tắt và đánh giá mức độ tương quan của đề tài; 4. Đăng ký mượn bản PDF đầy đủ hoặc tham khảo trực tuyến qua trình đọc sách tương tác.\n\nKho dữ liệu học thuật số hóa hiện lưu giữ hơn 5.000 đề tài khóa luận tốt nghiệp, đồ án môn học tiêu biểu và các bài báo khoa học đã được công bố của sinh viên và giảng viên qua các thời kỳ. Hệ thống mới được trang bị công nghệ nhận dạng ký tự quang học (OCR) tiên tiến, cho phép sinh viên tìm kiếm trực tiếp các cụm từ nằm sâu trong nội dung tài liệu quét cũ. Để phục vụ tốt nhất cho quá trình trích dẫn và nghiên cứu, hệ thống cũng tích hợp công cụ tự động xuất file trích dẫn chuẩn APA, MLA hoặc IEEE, tương thích tốt với các phần mềm quản lý thư mục phổ biến như Mendeley, EndNote và Zotero. Ban quản lý cũng lưu ý sinh viên tuân thủ nghiêm ngặt các quy định về trích dẫn tài liệu tham khảo để tránh các vi phạm liên quan đến quyền tác giả và đạo văn trong nghiên cứu khoa học.",
                Published = true,
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            },
            new SocialPost
            {
                Id = 3,
                Title = "Hệ thống AI Gemini hỗ trợ phân tích và tóm tắt sáng kiến",
                Category = "Tính năng",
                BadgeClass = "bg-purple-600 text-white",
                Image = "https://lh3.googleusercontent.com/aida-public/AB6AXuANxGO4D6ojuZlYk7MEhtq_38tsfUs324mV9MOXepahz-7q_MfJXjqjvHbgLt27PAjQquIgxNbU4l8TFLxxTqokf9fiaJRq8mxeZIqQU-_fhU1ho_Omjv4xl_49kl_cJIIr3tyg5-3Lu3GYiLPM2N3psKIdMJtF-p6DcwYjflkXf24kayQ57904JAS0eyc8PMffw-nv4NNzDqKse0KbLJ4YWmW0Hqys7UoOYciK4A2BTM_k2g3B1Slq6NwqcMgwtqtuEWUyLaQ7lH_W",
                Desc = "Nhà trường chính thức đưa vào thử nghiệm hệ thống Trí tuệ nhân tạo (AI) tích hợp mô hình ngôn ngữ lớn Gemini của Google. Hệ thống mới này sẽ hỗ trợ sinh viên tóm tắt các tài liệu nghiên cứu dày hàng trăm trang, phân tích xu hướng đề tài tự động, đồng thời cung cấp giao diện chấm điểm cấu trúc bài viết và kiểm tra mức độ trùng lặp nội dung theo thời gian thực.",
                Content = "Nằm trong chiến lược xây dựng Đại học Thông minh và Chuyển đổi số toàn diện, hệ thống eThesis chính thức tích hợp trợ lý học thuật AI Gemini. Trợ lý AI này cung cấp 3 tính năng cốt lõi cho sinh viên và giảng viên: Thứ nhất là 'Tóm tắt thông minh', giúp trích xuất các luận điểm, phương pháp và kết quả chính của một bài nghiên cứu dài chỉ trong vài giây; Thứ hai là 'Kiểm tra cấu trúc', AI sẽ đối chiếu bản thảo của sinh viên với các tiêu chuẩn trình bày khóa luận tốt nghiệp để đưa ra nhận xét định dạng, từ ngữ và lỗi ngữ pháp; Thứ ba là 'Gợi ý tài liệu liên quan', dựa trên ngữ nghĩa của bản thảo để đề xuất các bài báo khoa học liên quan trực tiếp.\n\nĐiểm đặc biệt của hệ thống tích hợp AI Gemini là mô hình bảo mật dữ liệu cấp cao. Toàn bộ bản thảo đồ án hoặc nghiên cứu do sinh viên đăng tải lên để phân tích sẽ được xử lý trong một phân vùng bảo mật riêng biệt và cam kết không sử dụng để huấn luyện lại mô hình công cộng, đảm bảo tuyệt đối tính bản quyền và tránh rò rỉ ý tưởng công nghệ trước khi công bố. Trong giai đoạn thử nghiệm đầu tiên (từ nay đến hết tháng 8/2026), mỗi tài khoản sinh viên sẽ được cung cấp 50 lượt sử dụng AI miễn phí mỗi ngày. Mọi ý kiến phản hồi về chất lượng phản hồi của AI có thể gửi trực tiếp qua nút đóng góp ý kiến ở góc phải màn hình để đội ngũ phát triển tinh chỉnh thuật toán tốt hơn trước khi chính thức vận hành thương mại vào học kỳ sau.",
                Published = true,
                CreatedAt = DateTime.UtcNow.AddDays(-25)
            }
        );
    }

    private static string BCrypt(string password) =>
        global::BCrypt.Net.BCrypt.HashPassword(password);
}
