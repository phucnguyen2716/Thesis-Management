using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using PlatformAdmin.Data;
using PlatformAdmin.DTOs.Social;
using PlatformAdmin.Entities;
using PlatformAdmin.Interfaces;
using PlatformAdmin.Services;
using Hangfire;
using Hangfire.Storage;
using Xunit;

namespace PlatformAdmin.Tests.UnitTests.Services;

public class SocialServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<AppDbContext> _dbContextOptions;
    private readonly Mock<ICloudinaryService> _mockCloudinaryService;
    private readonly Mock<JobStorage> _mockJobStorage;
    private readonly Mock<IStorageConnection> _mockStorageConnection;

    public SocialServiceTests()
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

        _mockCloudinaryService = new Mock<ICloudinaryService>();

        _mockJobStorage = new Mock<JobStorage>();
        _mockStorageConnection = new Mock<IStorageConnection>();
        var mockTransaction = new Mock<IWriteOnlyTransaction>();
        
        _mockJobStorage.Setup(x => x.GetConnection()).Returns(_mockStorageConnection.Object);
        _mockStorageConnection.Setup(x => x.CreateWriteTransaction()).Returns(mockTransaction.Object);
        
        JobStorage.Current = _mockJobStorage.Object;
    }

    public void Dispose()
    {
        _connection.Dispose();
    }

    private AppDbContext CreateContext() => new AppDbContext(_dbContextOptions);

    [Fact]
    public async Task GetPostsAsync_ReturnsAllPosts()
    {
        using var context = CreateContext();
        context.SocialPosts.RemoveRange(context.SocialPosts);
        await context.SaveChangesAsync();

        var post1 = new SocialPost { Id = 10, Title = "Post 1", Published = true, CreatedAt = DateTime.UtcNow };
        var post2 = new SocialPost { Id = 11, Title = "Post 2", Published = false, CreatedAt = DateTime.UtcNow };
        context.SocialPosts.AddRange(post1, post2);
        await context.SaveChangesAsync();

        var service = new SocialService(context, _mockCloudinaryService.Object);
        var results = await service.GetPostsAsync(publishedOnly: false);

        Assert.Equal(2, results.Count());
    }

    [Fact]
    public async Task GetPostsAsync_PublishedOnly_ReturnsOnlyPublished()
    {
        using var context = CreateContext();
        context.SocialPosts.RemoveRange(context.SocialPosts);
        await context.SaveChangesAsync();

        var post1 = new SocialPost { Id = 20, Title = "Post 1", Published = true, CreatedAt = DateTime.UtcNow };
        var post2 = new SocialPost { Id = 21, Title = "Post 2", Published = false, CreatedAt = DateTime.UtcNow };
        context.SocialPosts.AddRange(post1, post2);
        await context.SaveChangesAsync();

        var service = new SocialService(context, _mockCloudinaryService.Object);
        var results = await service.GetPostsAsync(publishedOnly: true);

        var posts = results.ToList();
        Assert.Single(posts);
        Assert.Equal("Post 1", posts[0].Title);
    }

    [Fact]
    public async Task CreatePostAsync_ValidRequest_CreatesPostCorrectly()
    {
        using var context = CreateContext();
        var request = new CreateSocialPostRequest
        {
            Title = "Bài viết mới",
            Category = "Tin mới",
            BadgeClass = "badge-primary",
            Image = "http://image.url/pic.jpg",
            Desc = "Mô tả bài viết",
            Content = "Nội dung chi tiết",
            Published = true
        };

        var service = new SocialService(context, _mockCloudinaryService.Object);
        var result = await service.CreatePostAsync(request);

        Assert.NotNull(result);
        Assert.Equal(request.Title, result.Title);
        Assert.Equal("Pending", result.CloudinaryStatus);

        var dbPost = await context.SocialPosts.FindAsync(int.Parse(result.Id));
        Assert.NotNull(dbPost);
    }

    [Fact]
    public async Task DeletePostAsync_ExistingPost_ReturnsTrue()
    {
        using var context = CreateContext();
        var post = new SocialPost { Id = 50, Title = "Delete target", Published = true, CreatedAt = DateTime.UtcNow };
        context.SocialPosts.Add(post);
        await context.SaveChangesAsync();

        var service = new SocialService(context, _mockCloudinaryService.Object);
        var result = await service.DeletePostAsync(50);

        Assert.True(result);
        var dbPost = await context.SocialPosts.FindAsync(50);
        Assert.Null(dbPost);
    }

    [Fact]
    public async Task DeletePostAsync_NonExistentPost_ReturnsFalse()
    {
        using var context = CreateContext();
        var service = new SocialService(context, _mockCloudinaryService.Object);
        var result = await service.DeletePostAsync(999);

        Assert.False(result);
    }

    [Fact]
    public async Task UpdatePostAsync_ExistingPost_UpdatesFields()
    {
        using var context = CreateContext();
        var post = new SocialPost { Id = 60, Title = "Old Title", Published = true, CreatedAt = DateTime.UtcNow };
        context.SocialPosts.Add(post);
        await context.SaveChangesAsync();

        var updateRequest = new UpdateSocialPostRequest
        {
            Title = "New Title",
            Category = "Category",
            BadgeClass = "badge-info",
            Image = "http://new.url/pic.jpg",
            Desc = "New Desc",
            Content = "New Content",
            Published = false
        };

        var service = new SocialService(context, _mockCloudinaryService.Object);
        var result = await service.UpdatePostAsync(60, updateRequest);

        Assert.True(result);
        var dbPost = await context.SocialPosts.FindAsync(60);
        Assert.Equal("New Title", dbPost.Title);
        Assert.False(dbPost.Published);
    }

    [Fact]
    public async Task UpdatePostAsync_NonExistentPost_ReturnsFalse()
    {
        using var context = CreateContext();
        var updateRequest = new UpdateSocialPostRequest { Title = "Title" };
        var service = new SocialService(context, _mockCloudinaryService.Object);
        var result = await service.UpdatePostAsync(999, updateRequest);

        Assert.False(result);
    }

    [Fact]
    public async Task UploadPostImageToCloudinaryAsync_PostWithImage_UploadsAndSetsStatus()
    {
        using var context = CreateContext();
        var post = new SocialPost { Id = 70, Title = "Title", Image = "http://raw.url/image.jpg", CloudinaryStatus = "Pending", CreatedAt = DateTime.UtcNow };
        context.SocialPosts.Add(post);
        await context.SaveChangesAsync();

        _mockCloudinaryService.Setup(x => x.UploadImageFromUrlAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new CloudinaryUploadResult { Success = true, SecureUrl = "http://cloudinary.url/image.jpg" });

        var service = new SocialService(context, _mockCloudinaryService.Object);
        await service.UploadPostImageToCloudinaryAsync(70);

        var dbPost = await context.SocialPosts.FindAsync(70);
        Assert.Equal("http://cloudinary.url/image.jpg", dbPost.Image);
        Assert.Equal("Uploaded", dbPost.CloudinaryStatus);
    }

    [Fact]
    public async Task UploadPostImageToCloudinaryAsync_PostWithoutImage_DoesNothing()
    {
        using var context = CreateContext();
        var post = new SocialPost { Id = 80, Title = "Title", Image = "", CloudinaryStatus = "None", CreatedAt = DateTime.UtcNow };
        context.SocialPosts.Add(post);
        await context.SaveChangesAsync();

        var service = new SocialService(context, _mockCloudinaryService.Object);
        await service.UploadPostImageToCloudinaryAsync(80);

        var dbPost = await context.SocialPosts.FindAsync(80);
        Assert.Equal("", dbPost.Image);
        Assert.Equal("None", dbPost.CloudinaryStatus);
    }

    [Fact]
    public async Task UploadPostImageToCloudinaryAsync_CloudinaryFails_SetsStatusToFailed()
    {
        using var context = CreateContext();
        var post = new SocialPost { Id = 90, Title = "Title", Image = "http://raw.url/image.jpg", CloudinaryStatus = "Pending", CreatedAt = DateTime.UtcNow };
        context.SocialPosts.Add(post);
        await context.SaveChangesAsync();

        _mockCloudinaryService.Setup(x => x.UploadImageFromUrlAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("Upload failed"));

        var service = new SocialService(context, _mockCloudinaryService.Object);
        await service.UploadPostImageToCloudinaryAsync(90);

        var dbPost = await context.SocialPosts.FindAsync(90);
        Assert.Equal("Failed", dbPost.CloudinaryStatus);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    [InlineData(true)]
    [InlineData(false)]
    [InlineData(true)]
    public async Task GetPostsAsync_FilterCombinations_ReturnsFilteredResults(bool publishedOnly)
    {
        using var context = CreateContext();
        var service = new SocialService(context, _mockCloudinaryService.Object);
        var results = await service.GetPostsAsync(publishedOnly);
        Assert.NotNull(results);
    }
}
