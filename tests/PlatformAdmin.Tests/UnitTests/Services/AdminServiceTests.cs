using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PlatformAdmin.Data;
using PlatformAdmin.DTOs.Admin;
using PlatformAdmin.Entities;
using PlatformAdmin.Services;
using Xunit;

namespace PlatformAdmin.Tests.UnitTests.Services;

public class AdminServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<AppDbContext> _dbContextOptions;

    public AdminServiceTests()
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
    public async Task GetUsersAsync_ReturnsAllSavedUsers()
    {
        using var context = CreateContext();
        // Clear default seeded users to avoid interference
        context.Users.RemoveRange(context.Users);
        await context.SaveChangesAsync();

        var u1 = new User { Id = 10, FullName = "U1", Email = "u1@ethesis.edu.vn", Role = "Student", IsActive = true, CreatedAt = DateTime.UtcNow };
        var u2 = new User { Id = 11, FullName = "U2", Email = "u2@ethesis.edu.vn", Role = "Advisor", IsActive = true, CreatedAt = DateTime.UtcNow };
        context.Users.AddRange(u1, u2);
        await context.SaveChangesAsync();

        var service = new AdminService(context);
        var results = await service.GetUsersAsync();

        Assert.Equal(2, results.Count());
    }

    [Fact]
    public async Task CreateUserAsync_NewUser_CreatesSuccessfully()
    {
        using var context = CreateContext();
        var request = new CreateAdminUserRequest
        {
            FullName = "Nguyễn Admin",
            Email = "new_admin@ethesis.edu.vn",
            Role = "Admin",
            StudentId = null,
            Department = "CNTT",
            Phone = "0987654321",
            IsActive = true
        };

        var service = new AdminService(context);
        var result = await service.CreateUserAsync(request);

        Assert.NotNull(result);
        Assert.Equal(request.Email, result.Email);

        var dbUser = await context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        Assert.NotNull(dbUser);
        Assert.Equal("Admin", dbUser.Role);
    }

    [Fact]
    public async Task CreateUserAsync_DuplicateEmail_ReturnsNull()
    {
        using var context = CreateContext();
        var user = new User { Id = 20, FullName = "U", Email = "dup@ethesis.edu.vn", Role = "Student", IsActive = true, CreatedAt = DateTime.UtcNow };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var request = new CreateAdminUserRequest { Email = "dup@ethesis.edu.vn", FullName = "Name" };
        var service = new AdminService(context);
        var result = await service.CreateUserAsync(request);

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateUserAsync_ExistingUser_UpdatesSuccessfully()
    {
        using var context = CreateContext();
        var user = new User { Id = 30, FullName = "Old Name", Email = "update@ethesis.edu.vn", Role = "Student", IsActive = true, CreatedAt = DateTime.UtcNow };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var updateRequest = new UpdateAdminUserRequest
        {
            FullName = "New Name",
            Email = "update@ethesis.edu.vn",
            Role = "Advisor",
            StudentId = null,
            Department = "Science",
            Phone = "123",
            IsActive = false
        };

        var service = new AdminService(context);
        var result = await service.UpdateUserAsync(30, updateRequest);

        Assert.True(result);
        var dbUser = await context.Users.FindAsync(30);
        Assert.Equal("New Name", dbUser.FullName);
        Assert.Equal("Advisor", dbUser.Role);
        Assert.False(dbUser.IsActive);
    }

    [Fact]
    public async Task UpdateUserAsync_NonExistentUser_ReturnsFalse()
    {
        using var context = CreateContext();
        var updateRequest = new UpdateAdminUserRequest { FullName = "Name" };
        var service = new AdminService(context);
        var result = await service.UpdateUserAsync(999, updateRequest);

        Assert.False(result);
    }

    [Fact]
    public async Task DeleteUserAsync_ExistingUser_DeletesSuccessfully()
    {
        using var context = CreateContext();
        var user = new User { Id = 40, FullName = "Delete Target", Email = "del@ethesis.edu.vn", Role = "Student", IsActive = true, CreatedAt = DateTime.UtcNow };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new AdminService(context);
        var result = await service.DeleteUserAsync(40);

        Assert.True(result);
        var dbUser = await context.Users.FindAsync(40);
        Assert.Null(dbUser);
    }

    [Fact]
    public async Task DeleteUserAsync_NonExistentUser_ReturnsFalse()
    {
        using var context = CreateContext();
        var service = new AdminService(context);
        var result = await service.DeleteUserAsync(999);

        Assert.False(result);
    }

    [Fact]
    public async Task GetAuditLogsAsync_ReturnsAllAuditLogs()
    {
        using var context = CreateContext();
        var log = new AuditLog { Id = 100, Email = "test@ethesis.edu.vn", Role = "Student", Success = true, Message = "Success", CreatedAt = DateTime.UtcNow };
        context.AuditLogs.Add(log);
        await context.SaveChangesAsync();

        var service = new AdminService(context);
        var results = await service.GetAuditLogsAsync();

        Assert.Single(results);
        Assert.Equal("test@ethesis.edu.vn", results.First().Email);
    }

    [Theory]
    [InlineData("User 1", "e1@ethesis.edu.vn", "Student", "S1", "CNTT", true)]
    [InlineData("User 2", "e2@ethesis.edu.vn", "Student", "S2", "CNTT", false)]
    [InlineData("User 3", "e3@ethesis.edu.vn", "Advisor", null, "CNTT", true)]
    [InlineData("User 4", "e4@ethesis.edu.vn", "Advisor", null, "Science", true)]
    [InlineData("User 5", "e5@ethesis.edu.vn", "Admin", null, "CNTT", true)]
    [InlineData("User 6", "e6@ethesis.edu.vn", "Student", "S6", "Math", true)]
    [InlineData("User 7", "e7@ethesis.edu.vn", "Student", "S7", "Physics", true)]
    public async Task CreateUserAsync_VariousUserParameters_SavesCorrectly(
        string name, string email, string role, string? studentId, string dept, bool isActive)
    {
        using var context = CreateContext();
        var request = new CreateAdminUserRequest
        {
            FullName = name,
            Email = email,
            Role = role,
            StudentId = studentId,
            Department = dept,
            Phone = "123",
            IsActive = isActive
        };

        var service = new AdminService(context);
        var result = await service.CreateUserAsync(request);

        Assert.NotNull(result);
        Assert.Equal(email, result.Email);
        Assert.Equal(isActive, result.IsActive);
    }
}
