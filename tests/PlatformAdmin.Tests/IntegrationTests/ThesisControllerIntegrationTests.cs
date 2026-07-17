using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PlatformAdmin.Data;
using PlatformAdmin.DTOs.Thesis;
using PlatformAdmin.Entities;
using Xunit;

namespace PlatformAdmin.Tests.IntegrationTests;

public class ThesisControllerIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public ThesisControllerIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task SeedDataAsync(AppDbContext db)
    {
        // db.ThesisComments.RemoveRange(db.ThesisComments);
        db.ThesisReviews.RemoveRange(db.ThesisReviews);
        db.Theses.RemoveRange(db.Theses);
        db.Users.RemoveRange(db.Users.Where(u => u.Id > 3));
        await db.SaveChangesAsync();

        var student = new User { Id = 101, FullName = "Nguyễn Văn Sinh Viên", Email = "student101@ethesis.edu.vn", Role = "Student", StudentId = "SV101", IsActive = true, CreatedAt = DateTime.UtcNow };
        var advisor = new User { Id = 201, FullName = "Trần Văn Hướng Dẫn", Email = "advisor201@ethesis.edu.vn", Role = "Advisor", IsActive = true, CreatedAt = DateTime.UtcNow };
        db.Users.AddRange(student, advisor);

        var thesis = new Thesis
        {
            Id = 500,
            Title = "Xây dựng hệ thống TMDT",
            Description = "Nghiên cứu về giỏ hàng",
            StudentId = student.Id,
            Status = "Pending",
            Category = "Project",
            Major = "software-engineering",
            Subject = "Đồ án chuyên ngành",
            SubjectCode = "ITE1488",
            CreatedAt = DateTime.UtcNow
        };
        db.Theses.Add(thesis);
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task GetById_AnonymousUser_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/Thesis/500");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_StudentUser_ReturnsOk()
    {
        var client = _factory.CreateClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SeedDataAsync(db);
        }

        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/Thesis");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ThesisListResponse>();
        Assert.NotNull(result);
        Assert.True(result.TotalCount >= 1);
    }

    [Fact]
    public async Task Create_StudentUser_CreatesThesisAndReturns201Created()
    {
        var client = _factory.CreateClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SeedDataAsync(db);
        }

        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new CreateThesisRequest(
            Title: "Đề tài mạng an toàn",
            Description: "Phòng chống ransomware",
            Major: "security",
            Subject: "An toàn thông tin",
            SubjectCode: "ITE1268E",
            Category: "Project",
            StudentId: 101,
            AdvisorId: 201,
            Status: "Pending",
            FilePath: null,
            Batch: 1
        );

        var response = await client.PostAsJsonAsync("/api/Thesis", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<ThesisDto>();
        Assert.NotNull(result);
        Assert.Equal(request.Title, result.Title);
    }

    [Fact]
    public async Task Delete_ExistingThesisAsAdmin_Returns204NoContent()
    {
        var client = _factory.CreateClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SeedDataAsync(db);
        }

        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.DeleteAsync("/api/Thesis/500");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_NonExistentThesisAsAdmin_Returns404NotFound()
    {
        var client = _factory.CreateClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SeedDataAsync(db);
        }

        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.DeleteAsync("/api/Thesis/9999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ConcurrentDoubleDelete_SecondDeleteReturns404NotFound()
    {
        var client = _factory.CreateClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SeedDataAsync(db);
        }

        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response1 = await client.DeleteAsync("/api/Thesis/500");
        Assert.Equal(HttpStatusCode.NoContent, response1.StatusCode);

        var response2 = await client.DeleteAsync("/api/Thesis/500");
        Assert.Equal(HttpStatusCode.NotFound, response2.StatusCode);
    }

    [Fact]
    public async Task Submit_StudentUser_ReturnsOk()
    {
        var client = _factory.CreateClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SeedDataAsync(db);
        }

        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsync("/api/Thesis/500/submit", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task AssignAdvisor_AdminUser_ReturnsOk()
    {
        var client = _factory.CreateClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SeedDataAsync(db);
        }

        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync("/api/Thesis/500/assign-advisor", new AssignAdvisorRequest(201));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Approve_AdvisorUser_ReturnsOk()
    {
        var client = _factory.CreateClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SeedDataAsync(db);
            var thesis = await db.Theses.FindAsync(500);
            thesis.Status = "UnderReview";
            await db.SaveChangesAsync();
        }

        var token = _factory.GenerateJwtToken("201", "Advisor", "advisor201");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsync("/api/Thesis/500/approve", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Reject_AdvisorUser_ReturnsOk()
    {
        var client = _factory.CreateClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SeedDataAsync(db);
            var thesis = await db.Theses.FindAsync(500);
            thesis.Status = "UnderReview";
            await db.SaveChangesAsync();
        }

        var token = _factory.GenerateJwtToken("201", "Advisor", "advisor201");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync("/api/Thesis/500/reject", "Detailed reject reason");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetStats_AdminUser_ReturnsOk()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/Thesis/stats");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetReviews_StudentUser_ReturnsOk()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/Thesis/500/reviews");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task AddReview_AdvisorUser_ReturnsOk()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("201", "Advisor", "advisor201");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync("/api/Thesis/500/reviews", new CreateReviewRequest("Critique comments", 8.0m, "Approved"));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetComments_StudentUser_ReturnsOk()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/Thesis/500/comments");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task AddComment_StudentUser_ReturnsOk()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync("/api/Thesis/500/comments", new CreateCommentRequest("Great paper."));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Theory]
    [InlineData("Pending")]
    [InlineData("Submitted")]
    [InlineData("UnderReview")]
    [InlineData("Approved")]
    [InlineData("Rejected")]
    [InlineData("RevisionRequired")]
    [InlineData("")]
    [InlineData("Pending")]
    [InlineData("Approved")]
    [InlineData("Rejected")]
    public async Task GetAll_VariousStatuses_ReturnsOk(string status)
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var url = string.IsNullOrEmpty(status) ? "/api/Thesis" : $"/api/Thesis?status={status}";
        var response = await client.GetAsync(url);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
