using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PlatformAdmin.Data;
using PlatformAdmin.DTOs.Admin;
using PlatformAdmin.Entities;
using Xunit;

namespace PlatformAdmin.Tests.IntegrationTests;

public class AdminControllerIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public AdminControllerIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task SeedUsersAsync()
    {
        await _factory.ClearDatabaseAsync();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        var u = new User
        {
            Id = 500,
            FullName = "Existing Target",
            Email = "target@ethesis.edu.vn",
            Role = "Student",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(u);
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task GetUsers_AnonymousUser_Returns401Unauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/Admin/users");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetUsers_StudentUser_Returns403Forbidden()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/Admin/users");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetUsers_AdminUser_Returns200Ok()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/Admin/users");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CreateUser_AdminUser_CreatesSuccessfully()
    {
        await SeedUsersAsync();
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new CreateAdminUserRequest
        {
            FullName = "New Person",
            Email = "new_person@ethesis.edu.vn",
            Role = "Student",
            IsActive = true
        };

        var response = await client.PostAsJsonAsync("/api/Admin/users", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task CreateUser_AdminUser_DuplicateEmail_Returns400BadRequest()
    {
        await SeedUsersAsync();
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new CreateAdminUserRequest { Email = "target@ethesis.edu.vn", FullName = "Name" };
        var response = await client.PostAsJsonAsync("/api/Admin/users", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateUser_AdminUser_ExistingUser_Returns204NoContent()
    {
        await SeedUsersAsync();
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new UpdateAdminUserRequest
        {
            FullName = "Updated Target",
            Email = "target@ethesis.edu.vn",
            Role = "Advisor",
            IsActive = true
        };

        var response = await client.PutAsJsonAsync("/api/Admin/users/500", request);
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UpdateUser_AdminUser_NonExistentUser_Returns404NotFound()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new UpdateAdminUserRequest { FullName = "Name", Email = "nonexistent@ethesis.edu.vn" };
        var response = await client.PutAsJsonAsync("/api/Admin/users/9999", request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteUser_AdminUser_ExistingUser_Returns204NoContent()
    {
        await SeedUsersAsync();
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.DeleteAsync("/api/Admin/users/500");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task DeleteUser_AdminUser_NonExistentUser_Returns404NotFound()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.DeleteAsync("/api/Admin/users/9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetAuditLogs_AdminUser_Returns200Ok()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/Admin/audit-logs");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Theory]
    [InlineData("Student")]
    [InlineData("Advisor")]
    [InlineData("Guest")]
    [InlineData("Student")]
    [InlineData("Advisor")]
    public async Task GetUsers_DifferentRoleBypassChecks_ReturnsForbidden(string role)
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("10", role, "testuser");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/Admin/users");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
