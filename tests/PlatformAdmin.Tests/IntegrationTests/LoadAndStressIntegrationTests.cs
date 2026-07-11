using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using Moq;
using PlatformAdmin.Controllers;
using PlatformAdmin.Services;

namespace PlatformAdmin.Tests.IntegrationTests;

public class LoadAndStressIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public LoadAndStressIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<HttpResponseMessage[]> ExecuteThrottledRequestsAsync(Func<Task<HttpResponseMessage>> requestFunc, int totalCount, int maxConcurrency = 1)
    {
        var semaphore = new SemaphoreSlim(maxConcurrency);
        var tasks = new List<Task<HttpResponseMessage>>();

        for (int i = 0; i < totalCount; i++)
        {
            tasks.Add(Task.Run(async () =>
            {
                await semaphore.WaitAsync();
                try
                {
                    return await requestFunc();
                }
                finally
                {
                    semaphore.Release();
                }
            }));
        }

        return await Task.WhenAll(tasks);
    }

    [Fact]
    public async Task GetThesisStats_HighConcurrentLoad_HandlesRequestsSuccessfully()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        int concurrentRequests = 100;

        // Act
        var stopwatch = Stopwatch.StartNew();
        var responses = await ExecuteThrottledRequestsAsync(() => client.GetAsync("/api/Thesis/stats"), concurrentRequests);
        stopwatch.Stop();

        // Assert
        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));
        Assert.True(stopwatch.ElapsedMilliseconds < 5000, $"100 concurrent requests took too long: {stopwatch.ElapsedMilliseconds}ms");
    }

    [Fact]
    public async Task GetSocialPosts_HighConcurrentLoad_HandlesRequestsSuccessfully()
    {
        // Arrange
        var client = _factory.CreateClient();
        int concurrentRequests = 100;

        // Act
        var stopwatch = Stopwatch.StartNew();
        var responses = await ExecuteThrottledRequestsAsync(() => client.GetAsync("/api/Social/posts"), concurrentRequests);
        stopwatch.Stop();

        // Assert
        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));
        Assert.True(stopwatch.ElapsedMilliseconds < 5000, $"100 concurrent social queries took too long: {stopwatch.ElapsedMilliseconds}ms");
    }

    [Fact]
    public async Task ChatbotProcessChat_ConcurrentLoad_HandlesAllRequestsSuccessfully()
    {
        // Arrange
        _factory.MockGeminiService.Setup(x => x.AnalyzePromptAsync(It.IsAny<string>()))
            .ReturnsAsync(new PreFilterResult { IsViolent = false, RequestFunctionCall = false });
        _factory.MockGeminiService.Setup(x => x.GenerateResponseWithContextAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync("Safe mock chatbot reply under load.");
        _factory.MockGeminiService.Setup(x => x.AnalyzeResponseAsync(It.IsAny<string>()))
            .ReturnsAsync(new PostFilterResult { IsViolent = false, FilteredResponse = "Safe mock chatbot reply under load." });

        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        int concurrentRequests = 40;

        // Act
        var stopwatch = Stopwatch.StartNew();
        var responses = await ExecuteThrottledRequestsAsync(() => client.PostAsJsonAsync("/api/Chatbot/chat", new ChatRequest { Prompt = "Concurrent prompt" }), concurrentRequests);
        stopwatch.Stop();

        // Assert
        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));
        Assert.True(stopwatch.ElapsedMilliseconds < 5000, $"40 concurrent chat requests took too long: {stopwatch.ElapsedMilliseconds}ms");
    }

    [Fact]
    public async Task SearchTheses_ConcurrentLoad_ReturnsMatchingResults()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        int concurrentRequests = 80;

        // Act
        var stopwatch = Stopwatch.StartNew();
        var responses = await ExecuteThrottledRequestsAsync(() => client.GetAsync("/api/Thesis?Search=AI&Status=Approved"), concurrentRequests);
        stopwatch.Stop();

        // Assert
        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));
        Assert.True(stopwatch.ElapsedMilliseconds < 5000, $"80 concurrent search queries took: {stopwatch.ElapsedMilliseconds}ms");
    }

    [Fact]
    public async Task AdminGetUsers_ConcurrentLoad_ReturnsAccountsSuccessfully()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        int concurrentRequests = 60;

        // Act
        var responses = await ExecuteThrottledRequestsAsync(() => client.GetAsync("/api/Admin/users"), concurrentRequests);

        // Assert
        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));
    }

    [Fact]
    public async Task DriveGetStatus_ConcurrentLoad_ReturnsSuccessfully()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        int concurrentRequests = 60;

        // Act
        var responses = await ExecuteThrottledRequestsAsync(() => client.GetAsync("/api/Drive/status"), concurrentRequests);

        // Assert
        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));
    }

    [Fact]
    public async Task AdminGetAuditLogs_ConcurrentLoad_ReturnsSuccessfully()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        int concurrentRequests = 50;

        // Act
        var responses = await ExecuteThrottledRequestsAsync(() => client.GetAsync("/api/Admin/audit-logs"), concurrentRequests);

        // Assert
        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));
    }

    [Fact]
    public async Task GetThesisReviews_ConcurrentLoad_ReturnsSuccessfully()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        int concurrentRequests = 50;

        // Act
        var responses = await ExecuteThrottledRequestsAsync(() => client.GetAsync("/api/Thesis/1/reviews"), concurrentRequests);

        // Assert
        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));
    }

    [Fact]
    public async Task GetThesisComments_ConcurrentLoad_ReturnsSuccessfully()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        int concurrentRequests = 50;

        // Act
        var responses = await ExecuteThrottledRequestsAsync(() => client.GetAsync("/api/Thesis/1/comments"), concurrentRequests);

        // Assert
        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));
    }

    [Fact]
    public async Task PlagiarismGetStatus_ConcurrentLoad_ReturnsSuccessfully()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("1", "Admin", "admin1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        int concurrentRequests = 50;

        // Act
        var responses = await ExecuteThrottledRequestsAsync(() => client.GetAsync("/api/Plagiarism/status/1"), concurrentRequests);

        // Assert
        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));
    }
}
