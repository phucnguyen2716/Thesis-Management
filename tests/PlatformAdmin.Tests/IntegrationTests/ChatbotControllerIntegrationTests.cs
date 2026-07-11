using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using Moq;
using PlatformAdmin.Controllers;
using PlatformAdmin.Services;
using Xunit;

namespace PlatformAdmin.Tests.IntegrationTests;

public class ChatbotControllerIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public ChatbotControllerIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private void SetupMockGemini(string prompt, bool isViolent, string responseText)
    {
        _factory.MockGeminiService.Setup(x => x.AnalyzePromptAsync(prompt))
            .ReturnsAsync(new PreFilterResult
            {
                IsViolent = isViolent,
                ViolationReason = isViolent ? "Violence detected" : null,
                RequestFunctionCall = false
            });

        _factory.MockGeminiService.Setup(x => x.GenerateResponseWithContextAsync(prompt, It.IsAny<string>()))
            .ReturnsAsync(responseText);

        _factory.MockGeminiService.Setup(x => x.AnalyzeResponseAsync(responseText))
            .ReturnsAsync(new PostFilterResult
            {
                IsViolent = false,
                FilteredResponse = responseText
            });
    }

    [Fact]
    public async Task ProcessChatRequest_AnonymousUser_Returns401Unauthorized()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/Chatbot/chat", new ChatRequest { Prompt = "Hello" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ProcessChatRequest_EmptyPrompt_Returns400BadRequest()
    {
        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync("/api/Chatbot/chat", new ChatRequest { Prompt = "" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ProcessChatRequest_ValidPrompt_Returns200Ok()
    {
        SetupMockGemini("Hello bot", false, "Hello, how can I help you?");

        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync("/api/Chatbot/chat", new ChatRequest { Prompt = "Hello bot" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ProcessChatRequest_ViolentPrompt_PreFilterBlocksAndReturnsOkWithViolationMessage()
    {
        SetupMockGemini("Show violent action", true, "");

        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync("/api/Chatbot/chat", new ChatRequest { Prompt = "Show violent action" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ChatResponse>();
        Assert.NotNull(result);
        Assert.False(result.Success);
        Assert.Contains("violates our safety policies", result.Message);
    }

    [Fact]
    public async Task ProcessChatRequest_HelpPrompt_ReturnsOk()
    {
        SetupMockGemini("help me", false, "I can guide you through thesis submissions.");

        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync("/api/Chatbot/chat", new ChatRequest { Prompt = "help me" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Theory]
    [InlineData("AI guidelines")]
    [InlineData("machine learning projects")]
    [InlineData("IoT requirements")]
    [InlineData("graduation rules")]
    [InlineData("advisor list")]
    [InlineData("deadlines")]
    [InlineData("file upload limit")]
    [InlineData("plagiarism checker")]
    [InlineData("templates")]
    [InlineData("uef portal")]
    public async Task ProcessChatRequest_VariousTopics_ReturnsOk(string topic)
    {
        SetupMockGemini(topic, false, $"Response about {topic}");

        var client = _factory.CreateClient();
        var token = _factory.GenerateJwtToken("101", "Student", "student101");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.PostAsJsonAsync("/api/Chatbot/chat", new ChatRequest { Prompt = topic });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
