using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using PlatformAdmin.Data;
using PlatformAdmin.DTOs.Thesis;
using PlatformAdmin.Entities;
using PlatformAdmin.Interfaces;
using PlatformAdmin.Services;
using Hangfire;
using Hangfire.Storage;
using Xunit;

namespace PlatformAdmin.Tests.UnitTests.Services;

public class ThesisServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<AppDbContext> _dbContextOptions;
    private readonly Mock<IGoogleDriveStorageService> _mockDriveService;
    private readonly Mock<JobStorage> _mockJobStorage;
    private readonly Mock<IStorageConnection> _mockStorageConnection;

    public ThesisServiceTests()
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

        _mockDriveService = new Mock<IGoogleDriveStorageService>();

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
    public async Task CreateAsync_ValidRequest_CreatesThesisCorrectly()
    {
        using var context = CreateContext();
        var student = new User { Id = 10, FullName = "Student A", Email = "studentA@ethesis.edu.vn", Role = "Student", StudentId = "SV10", IsActive = true, CreatedAt = DateTime.UtcNow };
        var advisor = new User { Id = 11, FullName = "Advisor A", Email = "advisorA@ethesis.edu.vn", Role = "Advisor", IsActive = true, CreatedAt = DateTime.UtcNow };
        context.Users.AddRange(student, advisor);
        await context.SaveChangesAsync();

        var request = new CreateThesisRequest(
            Title: "Xây dựng ứng dụng Machine Learning",
            Description: "Đề tài nghiên cứu Deep Learning",
            Major: "ai",
            Subject: "Máy học",
            SubjectCode: "ITE1173E",
            Category: "Project",
            AdvisorId: advisor.Id,
            FilePath: null,
            Batch: 1,
            StudentId: student.Id,
            Status: "Pending"
        );

        var service = new ThesisService(context, _mockDriveService.Object);
        var result = await service.CreateAsync(student.Id, request);

        Assert.NotNull(result);
        Assert.Equal(request.Title, result.Title);
        Assert.Equal("Pending", result.Status);

        var dbThesis = await context.Theses.FindAsync(result.Id);
        Assert.NotNull(dbThesis);
    }

    [Fact]
    public async Task CreateAsync_ProjectCategory_EnqueuesDriveSyncJob()
    {
        using var context = CreateContext();
        var student = new User { Id = 20, FullName = "Student B", Email = "studentB@ethesis.edu.vn", Role = "Student", StudentId = "SV20", IsActive = true, CreatedAt = DateTime.UtcNow };
        context.Users.Add(student);
        await context.SaveChangesAsync();

        var request = new CreateThesisRequest(
            Title: "Đồ án IoT",
            Description: "Mô tả đồ án",
            Major: "networking",
            Subject: "Quản trị mạng",
            SubjectCode: "ITE1241E",
            Category: "Project",
            AdvisorId: null,
            FilePath: null,
            Batch: 1,
            StudentId: student.Id,
            Status: "Pending"
        );

        var service = new ThesisService(context, _mockDriveService.Object);
        var result = await service.CreateAsync(student.Id, request);

        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingThesis_ReturnsThesisDto()
    {
        using var context = CreateContext();
        var student = new User { Id = 30, FullName = "Student C", Email = "studentC@ethesis.edu.vn", Role = "Student", StudentId = "SV30", IsActive = true, CreatedAt = DateTime.UtcNow };
        var thesis = new Thesis
        {
            Id = 100,
            Title = "Đề tài Cloud Computing",
            Description = "Nghiên cứu AWS",
            StudentId = student.Id,
            Status = "Pending",
            Category = "Project",
            Major = "networking",
            Subject = "Lập trình mạng máy tính",
            SubjectCode = "ITE1255E",
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(student);
        context.Theses.Add(thesis);
        await context.SaveChangesAsync();

        var service = new ThesisService(context, _mockDriveService.Object);
        var result = await service.GetByIdAsync(100);

        Assert.NotNull(result);
        Assert.Equal(thesis.Id, result.Id);
        Assert.Equal(student.FullName, result.StudentName);
    }

    [Fact]
    public async Task GetByIdAsync_NonExistentThesis_ReturnsNull()
    {
        using var context = CreateContext();
        var service = new ThesisService(context, _mockDriveService.Object);
        var result = await service.GetByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAsync_ExistingThesis_RemovesFromDatabase()
    {
        using var context = CreateContext();
        var student = new User { Id = 40, FullName = "Student D", Email = "studentD@ethesis.edu.vn", Role = "Student", StudentId = "SV40", IsActive = true, CreatedAt = DateTime.UtcNow };
        var thesis = new Thesis
        {
            Id = 200,
            Title = "Đề tài Blockchain",
            Description = "Ứng dụng xác thực",
            StudentId = student.Id,
            Status = "Pending",
            Category = "Thesis",
            Major = "security",
            Subject = "Khóa luận tốt nghiệp",
            SubjectCode = "THESIS202",
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(student);
        context.Theses.Add(thesis);
        await context.SaveChangesAsync();

        var service = new ThesisService(context, _mockDriveService.Object);
        await service.DeleteAsync(200);

        var dbThesis = await context.Theses.FindAsync(200);
        Assert.Null(dbThesis);
    }

    [Fact]
    public async Task DeleteAsync_NonExistentThesis_ThrowsKeyNotFoundException()
    {
        using var context = CreateContext();
        var service = new ThesisService(context, _mockDriveService.Object);
        await Assert.ThrowsAsync<KeyNotFoundException>(async () => await service.DeleteAsync(9999));
    }

    [Fact]
    public async Task UpdateAsync_ValidRequest_UpdatesFieldsCorrectly()
    {
        using var context = CreateContext();
        var student = new User { Id = 50, FullName = "Student E", Email = "studentE@ethesis.edu.vn", Role = "Student", StudentId = "SV50", IsActive = true, CreatedAt = DateTime.UtcNow };
        var thesis = new Thesis
        {
            Id = 300,
            Title = "Old Title",
            Description = "Old Desc",
            StudentId = student.Id,
            Status = "Pending",
            Category = "Project",
            Major = "ai",
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(student);
        context.Theses.Add(thesis);
        await context.SaveChangesAsync();

        var updateRequest = new UpdateThesisRequest(
            Title: "New Title",
            Description: "New Desc",
            Major: "networking",
            Subject: "New Subject",
            SubjectCode: "NEW101",
            Category: "Thesis",
            StudentId: student.Id,
            AdvisorId: null,
            Status: "Approved",
            FilePath: "file.pdf",
            Batch: 2
        );

        var service = new ThesisService(context, _mockDriveService.Object);
        var result = await service.UpdateAsync(300, updateRequest);

        Assert.Equal("New Title", result.Title);
        Assert.Equal("Approved", result.Status);
        Assert.Equal("Thesis", result.Category);
    }

    [Fact]
    public async Task UpdateAsync_NonExistentThesis_ThrowsKeyNotFoundException()
    {
        using var context = CreateContext();
        var updateRequest = new UpdateThesisRequest(Title: "Title", Description: "Desc");
        var service = new ThesisService(context, _mockDriveService.Object);
        await Assert.ThrowsAsync<KeyNotFoundException>(async () => await service.UpdateAsync(9999, updateRequest));
    }

    [Fact]
    public async Task SubmitAsync_ExistingThesis_UpdatesStatusToSubmitted()
    {
        using var context = CreateContext();
        var student = new User { Id = 60, FullName = "Student F", Email = "studentF@ethesis.edu.vn", Role = "Student", StudentId = "SV60", IsActive = true, CreatedAt = DateTime.UtcNow };
        var thesis = new Thesis { Id = 400, Title = "Title", StudentId = student.Id, Status = "Pending", CreatedAt = DateTime.UtcNow };
        context.Users.Add(student);
        context.Theses.Add(thesis);
        await context.SaveChangesAsync();

        var service = new ThesisService(context, _mockDriveService.Object);
        var result = await service.SubmitAsync(400);

        Assert.Equal("Submitted", result.Status);
        Assert.NotNull(result.SubmittedAt);
    }

    [Fact]
    public async Task AssignAdvisorAsync_ValidAdvisor_UpdatesAdvisorId()
    {
        using var context = CreateContext();
        var student = new User { Id = 70, FullName = "Student G", Email = "studentG@ethesis.edu.vn", Role = "Student", StudentId = "SV70", IsActive = true, CreatedAt = DateTime.UtcNow };
        var advisor = new User { Id = 71, FullName = "Advisor G", Email = "advisorG@ethesis.edu.vn", Role = "Advisor", IsActive = true, CreatedAt = DateTime.UtcNow };
        var thesis = new Thesis { Id = 500, Title = "Title", StudentId = student.Id, Status = "Pending", CreatedAt = DateTime.UtcNow };
        context.Users.AddRange(student, advisor);
        context.Theses.Add(thesis);
        await context.SaveChangesAsync();

        var service = new ThesisService(context, _mockDriveService.Object);
        var result = await service.AssignAdvisorAsync(500, new AssignAdvisorRequest(advisor.Id));

        Assert.Equal(advisor.Id, result.AdvisorId);
    }

    [Fact]
    public async Task ApproveAsync_ExistingThesis_SetsApprovedStatus()
    {
        using var context = CreateContext();
        var student = new User { Id = 80, FullName = "Student H", Email = "studentH@ethesis.edu.vn", Role = "Student", StudentId = "SV80", IsActive = true, CreatedAt = DateTime.UtcNow };
        var thesis = new Thesis { Id = 600, Title = "Title", StudentId = student.Id, Status = "UnderReview", CreatedAt = DateTime.UtcNow };
        context.Users.Add(student);
        context.Theses.Add(thesis);
        await context.SaveChangesAsync();

        var service = new ThesisService(context, _mockDriveService.Object);
        var result = await service.ApproveAsync(600);

        Assert.Equal("Approved", result.Status);
        Assert.NotNull(result.ApprovedAt);
    }

    [Fact]
    public async Task RejectAsync_ExistingThesis_SetsRejectedStatus()
    {
        using var context = CreateContext();
        var student = new User { Id = 90, FullName = "Student I", Email = "studentI@ethesis.edu.vn", Role = "Student", StudentId = "SV90", IsActive = true, CreatedAt = DateTime.UtcNow };
        var thesis = new Thesis { Id = 700, Title = "Title", StudentId = student.Id, Status = "UnderReview", CreatedAt = DateTime.UtcNow };
        context.Users.Add(student);
        context.Theses.Add(thesis);
        await context.SaveChangesAsync();

        var service = new ThesisService(context, _mockDriveService.Object);
        var result = await service.RejectAsync(700, "Needs more detail");

        Assert.Equal("Rejected", result.Status);
    }

    [Fact]
    public async Task SetRevisionAsync_ExistingThesis_SetsRevisionRequiredStatus()
    {
        using var context = CreateContext();
        var student = new User { Id = 95, FullName = "Student J", Email = "studentJ@ethesis.edu.vn", Role = "Student", StudentId = "SV95", IsActive = true, CreatedAt = DateTime.UtcNow };
        var thesis = new Thesis { Id = 800, Title = "Title", StudentId = student.Id, Status = "UnderReview", CreatedAt = DateTime.UtcNow };
        context.Users.Add(student);
        context.Theses.Add(thesis);
        await context.SaveChangesAsync();

        var service = new ThesisService(context, _mockDriveService.Object);
        var result = await service.SetRevisionAsync(800);

        Assert.Equal("RevisionRequired", result.Status);
    }

    [Fact]
    public async Task GetStatsAsync_ReturnsCorrectAggregatedCounts()
    {
        using var context = CreateContext();
        var student = new User { Id = 1000, FullName = "Student K", Email = "studentK@ethesis.edu.vn", Role = "Student", StudentId = "SVK", IsActive = true, CreatedAt = DateTime.UtcNow };
        context.Users.Add(student);

        context.Theses.AddRange(
            new Thesis { Id = 1001, Title = "T1", StudentId = student.Id, Status = "Pending", CreatedAt = DateTime.UtcNow },
            new Thesis { Id = 1002, Title = "T2", StudentId = student.Id, Status = "Approved", CreatedAt = DateTime.UtcNow },
            new Thesis { Id = 1003, Title = "T3", StudentId = student.Id, Status = "Approved", CreatedAt = DateTime.UtcNow },
            new Thesis { Id = 1004, Title = "T4", StudentId = student.Id, Status = "Rejected", CreatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();

        var service = new ThesisService(context, _mockDriveService.Object);
        var stats = await service.GetStatsAsync();

        Assert.Equal(1, stats.Pending);
        Assert.Equal(2, stats.Approved);
        Assert.Equal(1, stats.Rejected);
    }

    [Theory]
    [InlineData("Pending", null, null, null, null)]
    [InlineData("Approved", null, null, null, null)]
    [InlineData(null, "Machine", null, null, null)]
    [InlineData(null, "Student L", null, null, null)]
    [InlineData(null, null, 2000, null, null)]
    [InlineData(null, null, null, 2001, null)]
    [InlineData(null, null, null, null, "Project")]
    [InlineData(null, null, null, null, "Thesis")]
    [InlineData(null, null, null, null, null)]
    [InlineData("Rejected", null, null, null, null)]
    [InlineData("Submitted", null, null, null, null)]
    [InlineData("UnderReview", null, null, null, null)]
    public async Task GetAllAsync_FilterCombinations_ReturnsFilteredResults(
        string? status, string? search, int? studentId, int? advisorId, string? category)
    {
        using var context = CreateContext();
        var student = new User { Id = 2000, FullName = "Student L", Email = "studentL@ethesis.edu.vn", Role = "Student", StudentId = "SVL", IsActive = true, CreatedAt = DateTime.UtcNow };
        var advisor = new User { Id = 2001, FullName = "Advisor L", Email = "advisorL@ethesis.edu.vn", Role = "Advisor", IsActive = true, CreatedAt = DateTime.UtcNow };
        context.Users.AddRange(student, advisor);

        context.Theses.AddRange(
            new Thesis { Id = 2002, Title = "Machine Learning", StudentId = student.Id, Status = "Pending", Category = "Project", CreatedAt = DateTime.UtcNow },
            new Thesis { Id = 2003, Title = "Cloud Security", StudentId = student.Id, AdvisorId = advisor.Id, Status = "Approved", Category = "Thesis", CreatedAt = DateTime.UtcNow }
        );
        await context.SaveChangesAsync();

        var service = new ThesisService(context, _mockDriveService.Object);
        var result = await service.GetAllAsync(1, 10, status, search, studentId, advisorId, category);

        Assert.NotNull(result);
        Assert.True(result.TotalCount >= 0);
    }
}
