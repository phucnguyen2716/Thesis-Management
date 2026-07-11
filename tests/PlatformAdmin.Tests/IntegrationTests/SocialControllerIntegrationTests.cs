using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PlatformAdmin.Data;
using PlatformAdmin.DTOs.Social;
using PlatformAdmin.Entities;
using Xunit;

namespace PlatformAdmin.Tests.IntegrationTests;

public class SocialControllerIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public SocialControllerIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task SeedDataAsync(AppDbContext db)
    {
        db.SocialPosts.RemoveRange(db.SocialPosts);
        await db.SaveChangesAsync();

        var post1 = new SocialPost { Id = 1001, Title = "Post 1001", Published = true, CreatedAt = DateTime.UtcNow };
        var post2 = new SocialPost { Id = 1002, Title = "Post 1002", Published = false, CreatedAt = DateTime.UtcNow };
        db.SocialPosts.AddRange(post1, post2);
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task GetPosts_AnonymousUser_ReturnsOkAndOnlyPublishedPosts()
    {
        var client = _factory.CreateClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SeedDataAsync(db);
        }

        var response = await client.GetAsync("/api/Social/posts?publishedOnly=true");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var results = await response.Content.ReadFromJsonAsync<IEnumerable<SocialPostDto>>();
        Assert.NotNull(results);
        var posts = results.ToList();
        
        Assert.Single(posts);
        Assert.Equal("Post 1001", posts[0].Title);
    }

    [Fact]
    public async Task CreatePost_AnonymousUser_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var request = new CreateSocialPostRequest
        {
            Title = "New Announcement",
            Content = "Details"
        };

        var response = await client.PostAsJsonAsync("/api/Social/posts", request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreatePost_StudentUser_ReturnsForbidden()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new CreateSocialPostRequest { Title = "New Announcement" };
        var response = await client.PostAsJsonAsync("/api/Social/posts", request);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CreatePost_AdminUser_ReturnsCreated()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new CreateSocialPostRequest
        {
            Title = "School Announcement",
            Content = "Content",
            Category = "Tin mới"
        };

        var response = await client.PostAsJsonAsync("/api/Social/posts", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task DeletePost_AdminUser_RemovesPostCorrectly()
    {
        var client = _factory.CreateClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SeedDataAsync(db);
        }

        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.DeleteAsync("/api/Social/posts/1001");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UpdatePost_AdminUser_UpdatesPostCorrectly()
    {
        var client = _factory.CreateClient();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SeedDataAsync(db);
        }

        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new UpdateSocialPostRequest
        {
            Title = "Updated Title",
            Published = true
        };

        var response = await client.PutAsJsonAsync("/api/Social/posts/1001", request);
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UpdatePost_StudentUser_ReturnsForbidden()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PutAsJsonAsync("/api/Social/posts/1001", new UpdateSocialPostRequest { Title = "Title" });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UpdatePost_AnonymousUser_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.PutAsJsonAsync("/api/Social/posts/1001", new UpdateSocialPostRequest { Title = "Title" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DeletePost_StudentUser_ReturnsForbidden()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.DeleteAsync("/api/Social/posts/1001");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task DeletePost_AnonymousUser_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.DeleteAsync("/api/Social/posts/1001");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("true", "Student")]
    [InlineData("false", "Admin")]
    [InlineData("true", "Admin")]
    [InlineData("false", "Student")]
    [InlineData("true", "Advisor")]
    public async Task GetPosts_VariousParameters_ReturnsOk(string publishedOnly, string role)
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("10", role, "testuser");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync($"/api/Social/posts?publishedOnly={publishedOnly}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
