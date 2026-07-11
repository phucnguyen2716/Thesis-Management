using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PlatformAdmin.Data;
using PlatformAdmin.DTOs.Auth;
using PlatformAdmin.Entities;
using PlatformAdmin.Controllers;
using Xunit;

namespace PlatformAdmin.Tests.IntegrationTests;

public class AuthControllerIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public AuthControllerIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task ClearUsersAsync()
    {
        await _factory.ClearDatabaseAsync();
    }

    [Fact]
    public async Task Login_ValidCredentials_Returns200Ok()
    {
        await ClearUsersAsync();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = new User
            {
                Id = 101,
                FullName = "Login User",
                Email = "loginuser@ethesis.edu.vn",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
                Role = "Student",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }

        var client = _factory.CreateClient();
        var request = new LoginRequest(Email: "loginuser@ethesis.edu.vn", Password: "Password123");
        var response = await client.PostAsJsonAsync("/api/Auth/login", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(result);
        Assert.Equal("loginuser@ethesis.edu.vn", result.Email);
    }

    [Fact]
    public async Task Login_InvalidCredentials_Returns401Unauthorized()
    {
        var client = _factory.CreateClient();
        var request = new LoginRequest(Email: "wrong@ethesis.edu.vn", Password: "WrongPassword");
        var response = await client.PostAsJsonAsync("/api/Auth/login", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Register_ValidRequest_Returns200Ok()
    {
        await ClearUsersAsync();
        var client = _factory.CreateClient();
        var request = new RegisterRequest(
            FullName: "Register User",
            Email: "register@ethesis.edu.vn",
            Password: "Password123",
            Role: "Student",
            StudentId: "SV99",
            Department: "CNTT"
        );

        var response = await client.PostAsJsonAsync("/api/Auth/register", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(result);
        Assert.Equal("register@ethesis.edu.vn", result.Email);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns400BadRequest()
    {
        await ClearUsersAsync();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = new User
            {
                Id = 102,
                FullName = "Duplicate User",
                Email = "dup@ethesis.edu.vn",
                PasswordHash = "hash",
                Role = "Student",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }

        var client = _factory.CreateClient();
        var request = new RegisterRequest(
            FullName: "New User",
            Email: "dup@ethesis.edu.vn",
            Password: "Password123",
            Role: "Student",
            StudentId: "SV99",
            Department: "CNTT"
        );

        var response = await client.PostAsJsonAsync("/api/Auth/register", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GoogleLogin_MockToken_Returns200Ok()
    {
        var client = _factory.CreateClient();
        var request = new GoogleLoginRequest { Token = "mock-google-token" };
        var response = await client.PostAsJsonAsync("/api/Auth/google-login", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Theory]
    [InlineData("User A", "a@ethesis.edu.vn", "Student", "S01")]
    [InlineData("User B", "b@ethesis.edu.vn", "Student", "S02")]
    [InlineData("User C", "c@ethesis.edu.vn", "Advisor", null)]
    [InlineData("User D", "d@ethesis.edu.vn", "Advisor", null)]
    [InlineData("User E", "e@ethesis.edu.vn", "Admin", null)]
    [InlineData("User F", "f@ethesis.edu.vn", "Student", "S06")]
    [InlineData("User G", "g@ethesis.edu.vn", "Student", "S07")]
    [InlineData("User H", "h@ethesis.edu.vn", "Student", "S08")]
    [InlineData("User I", "i@ethesis.edu.vn", "Student", "S09")]
    [InlineData("User J", "j@ethesis.edu.vn", "Student", "S10")]
    public async Task Register_VariousParams_RegistersSuccessfully(
        string name, string email, string role, string? studentId)
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var u = await db.Users.FirstOrDefaultAsync(x => x.Email == email);
            if (u != null)
            {
                db.Users.Remove(u);
                await db.SaveChangesAsync();
            }
        }

        var client = _factory.CreateClient();
        var request = new RegisterRequest(
            FullName: name,
            Email: email,
            Password: "Password123",
            Role: role,
            StudentId: studentId,
            Department: "Physics"
        );

        var response = await client.PostAsJsonAsync("/api/Auth/register", request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
