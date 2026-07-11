using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PlatformAdmin.Data;
using PlatformAdmin.DTOs.Thesis;
using PlatformAdmin.Entities;
using PlatformAdmin.Services;
using Xunit;

namespace PlatformAdmin.Tests.UnitTests.Services;

public class ReviewServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<AppDbContext> _dbContextOptions;

    public ReviewServiceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        _dbContextOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        using (var context = new AppDbContext(_dbContextOptions))
        {
            context.Database.EnsureCreated();
        }
    }

    public void Dispose()
    {
        _connection.Dispose();
    }

    private AppDbContext CreateContext() => new AppDbContext(_dbContextOptions);

    [Fact]
    public async Task GetByThesisAsync_ReturnsThesisReviews()
    {
        using var context = CreateContext();
        var reviewer = new User { Id = 10, FullName = "Reviewer A", Email = "revA@ethesis.edu.vn", Role = "Advisor", IsActive = true, CreatedAt = DateTime.UtcNow };
        var thesis = new Thesis { Id = 100, Title = "Thesis A", StudentId = 3, Status = "Pending", CreatedAt = DateTime.UtcNow };
        context.Users.Add(reviewer);
        context.Theses.Add(thesis);

        var review = new ThesisReview
        {
            Id = 1,
            ThesisId = 100,
            ReviewerId = 10,
            Comments = "Good",
            Score = 8.5m,
            Decision = "Approved",
            ReviewedAt = DateTime.UtcNow
        };
        context.ThesisReviews.Add(review);
        await context.SaveChangesAsync();

        var service = new ReviewService(context);
        var results = await service.GetByThesisAsync(100);

        Assert.Single(results);
        Assert.Equal("Good", results.First().Comments);
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_CreatesReviewAndUpdatesThesisStatus()
    {
        using var context = CreateContext();
        var reviewer = new User { Id = 20, FullName = "Reviewer B", Email = "revB@ethesis.edu.vn", Role = "Advisor", IsActive = true, CreatedAt = DateTime.UtcNow };
        var thesis = new Thesis { Id = 200, Title = "Thesis B", StudentId = 3, Status = "UnderReview", CreatedAt = DateTime.UtcNow };
        context.Users.Add(reviewer);
        context.Theses.Add(thesis);
        await context.SaveChangesAsync();

        var service = new ReviewService(context);
        var request = new CreateReviewRequest("Detailed critique", 9.0m, "Approved");
        var result = await service.CreateAsync(200, 20, request);

        Assert.NotNull(result);
        Assert.Equal("Approved", result.Decision);

        var dbThesis = await context.Theses.FindAsync(200);
        Assert.Equal("Approved", dbThesis.Status);
    }

    [Fact]
    public async Task CreateAsync_NonExistentThesis_ThrowsKeyNotFoundException()
    {
        using var context = CreateContext();
        var service = new ReviewService(context);
        var request = new CreateReviewRequest("Good", 8.0m, "Approved");
        await Assert.ThrowsAsync<KeyNotFoundException>(async () => await service.CreateAsync(9999, 1, request));
    }

    [Fact]
    public async Task GetByThesisAsync_Comments_ReturnsThesisComments()
    {
        using var context = CreateContext();
        var student = new User { Id = 30, FullName = "Author", Email = "author@ethesis.edu.vn", Role = "Student", IsActive = true, CreatedAt = DateTime.UtcNow };
        var thesis = new Thesis { Id = 300, Title = "Thesis C", StudentId = student.Id, Status = "Pending", CreatedAt = DateTime.UtcNow };
        context.Users.Add(student);
        context.Theses.Add(thesis);

        var comment = new ThesisComment
        {
            Id = 1,
            ThesisId = 300,
            AuthorId = 30,
            Content = "Interesting topic",
            CreatedAt = DateTime.UtcNow
        };
        context.ThesisComments.Add(comment);
        await context.SaveChangesAsync();

        var service = new CommentService(context);
        var results = await service.GetByThesisAsync(300);

        Assert.Single(results);
        Assert.Equal("Interesting topic", results.First().Content);
    }

    [Fact]
    public async Task CreateAsync_Comment_ValidRequest_CreatesCommentSuccessfully()
    {
        using var context = CreateContext();
        var student = new User { Id = 40, FullName = "Author", Email = "authorB@ethesis.edu.vn", Role = "Student", IsActive = true, CreatedAt = DateTime.UtcNow };
        var thesis = new Thesis { Id = 400, Title = "Thesis D", StudentId = student.Id, Status = "Pending", CreatedAt = DateTime.UtcNow };
        context.Users.Add(student);
        context.Theses.Add(thesis);
        await context.SaveChangesAsync();

        var service = new CommentService(context);
        var request = new CreateCommentRequest("Nice work!");
        var result = await service.CreateAsync(400, 40, request);

        Assert.NotNull(result);
        Assert.Equal("Nice work!", result.Content);

        var dbComment = await context.ThesisComments.FindAsync(result.Id);
        Assert.NotNull(dbComment);
    }

    [Theory]
    [InlineData(9.5, "Approved", "Approved")]
    [InlineData(4.5, "Rejected", "Rejected")]
    [InlineData(7.5, "UnderReview", "UnderReview")]
    [InlineData(8.0, "Approved", "Approved")]
    [InlineData(3.0, "Rejected", "Rejected")]
    [InlineData(6.0, "UnderReview", "UnderReview")]
    [InlineData(8.5, "Approved", "Approved")]
    [InlineData(2.0, "Rejected", "Rejected")]
    [InlineData(5.0, "UnderReview", "UnderReview")]
    [InlineData(9.0, "Approved", "Approved")]
    public async Task CreateAsync_VariousDecisions_UpdatesThesisStatusCorrectly(
        decimal score, string decision, string expectedStatus)
    {
        using var context = CreateContext();
        var reviewer = new User { Id = 100, FullName = "Rev", Email = "rev@ethesis.edu.vn", Role = "Advisor", IsActive = true, CreatedAt = DateTime.UtcNow };
        var thesis = new Thesis { Id = 500, Title = "Thesis", StudentId = 3, Status = "Pending", CreatedAt = DateTime.UtcNow };
        context.Users.Add(reviewer);
        context.Theses.Add(thesis);
        await context.SaveChangesAsync();

        var service = new ReviewService(context);
        var request = new CreateReviewRequest("Critique", score, decision);
        await service.CreateAsync(500, 100, request);

        var dbThesis = await context.Theses.FindAsync(500);
        Assert.Equal(expectedStatus, dbThesis.Status);
    }
}
