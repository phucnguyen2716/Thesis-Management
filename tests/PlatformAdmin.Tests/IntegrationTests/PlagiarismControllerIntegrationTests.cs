using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PlatformAdmin.Data;
using PlatformAdmin.Entities;
using Xunit;

namespace PlatformAdmin.Tests.IntegrationTests;

public class PlagiarismControllerIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public PlagiarismControllerIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task SeedThesisAsync(int id, string status)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        var existing = await db.Theses.FindAsync(id);
        if (existing != null) db.Theses.Remove(existing);

        var student = await db.Users.FindAsync(3); // Seeded student
        var t = new Thesis
        {
            Id = id,
            Title = "Plagiarism Target",
            StudentId = student.Id,
            Status = status,
            Category = "Project",
            CreatedAt = DateTime.UtcNow
        };
        db.Theses.Add(t);
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task SeedMockDocuments_Returns200Ok()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsync("/api/Plagiarism/seed", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CheckPlagiarism_ExistingThesis_Returns202AcceptedOr200Ok()
    {
        await SeedThesisAsync(600, "Pending");
        var client = _factory.CreateClient();
        
        var response = await client.PostAsync("/api/Plagiarism/check/600", null);
        // Can be Accepted (queued = true) or OK (queued = false) depending on RabbitMQ connectivity mock
        Assert.True(response.StatusCode == HttpStatusCode.Accepted || response.StatusCode == HttpStatusCode.OK);
    }

    [Fact]
    public async Task CheckPlagiarism_NonExistentThesis_Returns404NotFound()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsync("/api/Plagiarism/check/9999", null);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetStatus_ExistingThesis_NoReport_ReturnsCorrectStatus()
    {
        await SeedThesisAsync(700, "Pending");
        var client = _factory.CreateClient();
        
        var response = await client.GetAsync("/api/Plagiarism/status/700");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetStatus_NonExistentThesis_Returns404NotFound()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/Plagiarism/status/9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("Pending")]
    [InlineData("UnderReview")]
    [InlineData("Approved")]
    [InlineData("Rejected")]
    [InlineData("RevisionRequired")]
    [InlineData("Pending")]
    [InlineData("UnderReview")]
    [InlineData("Approved")]
    [InlineData("Rejected")]
    [InlineData("RevisionRequired")]
    public async Task GetStatus_VariousStates_ReturnsCorrectStatus(string status)
    {
        await SeedThesisAsync(800, status);
        var client = _factory.CreateClient();
        
        var response = await client.GetAsync("/api/Plagiarism/status/800");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
