using System.Net;
using System.Net.Http.Headers;
using Xunit;

namespace PlatformAdmin.Tests.IntegrationTests;

public class DriveControllerIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public DriveControllerIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetStatus_AnonymousUser_Returns401Unauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/drive/status");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetStatus_StudentUser_Returns403Forbidden()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/drive/status");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetStatus_AdminUser_Returns200Ok()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/drive/status");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ForceSyncAcademic_AdminUser_Returns200Ok()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/drive/force-sync-academic");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task TestConnection_AdminUser_Returns200Ok()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsync("/api/drive/test-connection", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ListFiles_AdminUser_Returns200Ok()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/drive/files");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ListFiles_StudentUser_Returns200Ok()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/drive/files");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ForceSyncAcademic_StudentUser_Returns200Ok()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/drive/force-sync-academic");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task TestConnection_StudentUser_Returns403Forbidden()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsync("/api/drive/test-connection", null);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task ConvertDriveFile_AdminUser_EmptyPath_Returns400BadRequest()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsync("/api/drive/convert?filePath=", null);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData(10)]
    [InlineData(20)]
    [InlineData(50)]
    [InlineData(100)]
    [InlineData(5)]
    public async Task ListFiles_DifferentLimits_ReturnsOk(int limit)
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync($"/api/drive/files?limit={limit}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
