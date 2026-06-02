using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace PlatformAdmin.Services
{
    public class GeminiService : IGeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly string? _apiKey;
        private readonly bool _useMock;
        private readonly ILogger<GeminiService> _logger;

        public GeminiService(HttpClient httpClient, IConfiguration configuration, ILogger<GeminiService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _apiKey = configuration["Gemini:ApiKey"];
            _useMock = string.IsNullOrEmpty(_apiKey) || configuration.GetValue<bool>("Gemini:UseMock", true);

            if (_useMock)
            {
                _logger.LogWarning("Gemini API key is not configured or UseMock is set to true. Gemini Service is running in Mock/Simulation mode.");
            }
        }

        public async Task<PreFilterResult> AnalyzePromptAsync(string prompt)
        {
            _logger.LogInformation("Sandwich Pre-Filter: Analyzing prompt safety and function calling intent: '{Prompt}'", prompt);

            if (_useMock)
            {
                return SimulatePreFilter(prompt);
            }

            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={_apiKey}";
                
                var requestBody = new
                {
                    contents = new[]
                    {
                        new { role = "user", parts = new[] { new { text = GetPreFilterSystemPrompt(prompt) } } }
                    },
                    generationConfig = new
                    {
                        responseMimeType = "application/json"
                    }
                };

                var response = await _httpClient.PostAsync(url, new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json"));
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseContent);
                var textResult = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                if (string.IsNullOrEmpty(textResult))
                {
                    return new PreFilterResult { IsViolent = false, RequestFunctionCall = false };
                }

                var parsed = JsonSerializer.Deserialize<PreFilterResult>(textResult, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return parsed ?? new PreFilterResult { IsViolent = false, RequestFunctionCall = false };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to call Gemini API in Pre-Filter. Falling back to safe mock execution.");
                return SimulatePreFilter(prompt);
            }
        }

        private bool IsEnglishPrompt(string prompt)
        {
            if (string.IsNullOrWhiteSpace(prompt)) return false;

            // Character heuristic: Check for Vietnamese specific accented characters
            string vnAccents = "áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ";
            foreach (char c in prompt)
            {
                if (vnAccents.Contains(c))
                {
                    return false; // Definitely Vietnamese due to accents
                }
            }

            string lower = prompt.ToLowerInvariant();

            // Check common Vietnamese words (even without accents)
            string[] vnWords = { "chao", "dang bai", "thong bao", "de tai", "khoa luan", "giup", "toi", "ban", "co the", "lam sao", "sao", "gi", "khong" };
            foreach (var word in vnWords)
            {
                // Word boundary check to avoid false positives (e.g. "ban" inside "banner")
                if (lower.Contains(" " + word + " ") || lower.StartsWith(word + " ") || lower.EndsWith(" " + word) || lower == word)
                {
                    return false; // Likely Vietnamese
                }
            }

            // Otherwise, default to English if it contains ascii characters and looks English-oriented
            return true;
        }

        public async Task<string> GenerateResponseWithContextAsync(string originalPrompt, string executionResult)
        {
            _logger.LogInformation("Generating final natural language response using execution data.");

            if (_useMock)
            {
                bool isEnglish = IsEnglishPrompt(originalPrompt);
                var lower = originalPrompt.ToLowerInvariant();

                if (isEnglish)
                {
                    if (lower.Contains("hello") || lower.Contains("hi"))
                    {
                        return "Hello! I am the UEF Academic AI Assistant. I can assist you with researching thesis topics, completing coursework, processing graduation theses, optimizing images, or checking for plagiarism. How can I help you today?";
                    }
                    if (lower.Contains("post") || lower.Contains("create") || lower.Contains("share"))
                    {
                        return "Excellent! Your post creation request has been received and processed successfully. The record has been safely stored in the Postgres schema `social.posts` and automatically indexed for search in Elasticsearch!";
                    }
                    if (lower.Contains("notify") || lower.Contains("email") || lower.Contains("send") || lower.Contains("mail"))
                    {
                        return "Completed successfully! The notification dispatch request has been approved and sent. The audit activity log has been recorded in the Postgres schema `notification.notifications`!";
                    }
                    return $"I have received your request: \"{originalPrompt}\". The Sandwich Guardrail secure redirection pipeline has processed it successfully. Logic execution result: {executionResult}";
                }
                else
                {
                    if (lower.Contains("hello") || lower.Contains("hi") || lower.Contains("chào") || lower.Contains("chao"))
                    {
                        return "Xin chào! Tôi là trợ lý AI học thuật UEF. Tôi có thể hỗ trợ bạn tìm kiếm đề tài, làm chuyên đề, khóa luận, tối ưu hóa hình ảnh hoặc kiểm tra đạo văn. Bạn cần tôi giúp gì hôm nay?";
                    }
                    if (lower.Contains("post") || lower.Contains("create") || lower.Contains("đăng bài") || lower.Contains("chia sẻ"))
                    {
                        return "Tuyệt vời! Yêu cầu tạo bài đăng của bạn đã được tiếp nhận và xử lý thành công. Bản ghi đã được lưu trữ an toàn trong Postgres schema `social.posts` và tự động lập chỉ mục tìm kiếm trên Elasticsearch!";
                    }
                    if (lower.Contains("notify") || lower.Contains("email") || lower.Contains("thông báo") || lower.Contains("gửi thư"))
                    {
                        return "Đã hoàn thành! Yêu cầu gửi thông báo đã được phê duyệt và gửi đi thành công. Nhật ký hoạt động kiểm toán đã được ghi nhận trong Postgres schema `notification.notifications`!";
                    }
                    return $"Tôi đã tiếp nhận yêu cầu của bạn: \"{originalPrompt}\". Luồng điều hướng Sandwich Guardrail bảo mật đã xử lý thành công. Kết quả logic: {executionResult}";
                }
            }

            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={_apiKey}";
                var promptWithContext = $"Original User Intent: {originalPrompt}\n\nExecution Result Data: {executionResult}\n\nTask: Draft a highly professional, polite, and descriptive response summarizing the action completed. Maintain a positive tone and do not output any inappropriate terms.";

                var requestBody = new
                {
                    contents = new[]
                    {
                        new { role = "user", parts = new[] { new { text = promptWithContext } } }
                    }
                };

                var response = await _httpClient.PostAsync(url, new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json"));
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseContent);
                return doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString() ?? "[Fallback] Command executed successfully, but failed to format response text.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to call Gemini API in formatting. Falling back to standard format.");
                return $"[Fallback] Operation executed successfully. Output payload: {executionResult}";
            }
        }

        public async Task<PostFilterResult> AnalyzeResponseAsync(string generatedResponse)
        {
            _logger.LogInformation("Sandwich Post-Filter: Verifying AI output safety: '{Response}'", generatedResponse);

            if (_useMock)
            {
                return SimulatePostFilter(generatedResponse);
            }

            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={_apiKey}";
                var safetyCheckPrompt = $"Analyze the following response text for any violent, hateful, offensive words, or statements inciting harm.\n\nResponse to evaluate: \"{generatedResponse}\"\n\nReturn a JSON output with the exact schema:\n{{\n  \"isViolent\": true/false,\n  \"violationReason\": \"reason if true else null\",\n  \"filteredResponse\": \"the original response, or redacted version if minor violations occurred\"\n}}";

                var requestBody = new
                {
                    contents = new[]
                    {
                        new { role = "user", parts = new[] { new { text = safetyCheckPrompt } } }
                    },
                    generationConfig = new
                    {
                        responseMimeType = "application/json"
                    }
                };

                var response = await _httpClient.PostAsync(url, new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json"));
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseContent);
                var textResult = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                if (string.IsNullOrEmpty(textResult))
                {
                    return new PostFilterResult { IsViolent = false, FilteredResponse = generatedResponse };
                }

                var parsed = JsonSerializer.Deserialize<PostFilterResult>(textResult, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return parsed ?? new PostFilterResult { IsViolent = false, FilteredResponse = generatedResponse };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to call Gemini API in Post-Filter. Falling back to safe mock execution.");
                return SimulatePostFilter(generatedResponse);
            }
        }

        #region Prompt Helpers & Simulation Engine

        private string GetPreFilterSystemPrompt(string prompt)
        {
            return $"Analyze this user input prompt for violent words, threats, hate speech, or abuse.\n" +
                   $"Also, check if they are requesting actions we can handle:\n" +
                   $"- Creating a post (FunctionName: 'CreatePostCommand', arguments: 'content', 'title')\n" +
                   $"- Sending an email or notification (FunctionName: 'SendNotificationCommand', arguments: 'recipient', 'message', 'type')\n\n" +
                   $"User prompt: \"{prompt}\"\n\n" +
                   $"Format your response EXACTLY as a JSON object matching this schema:\n" +
                   $"{{\n" +
                   $"  \"isViolent\": false,\n" +
                   $"  \"violationReason\": null,\n" +
                   $"  \"requestFunctionCall\": true,\n" +
                   $"  \"functionName\": \"CreatePostCommand\",\n" +
                   $"  \"functionArguments\": {{\n" +
                   $"     \"title\": \"Example Title\",\n" +
                   $"     \"content\": \"Example post contents\"\n" +
                   $"  }}\n" +
                   $"}}";
        }

        private PreFilterResult SimulatePreFilter(string prompt)
        {
            var lower = prompt.ToLowerInvariant();

            if (lower.Contains("kill") || lower.Contains("bomb") || lower.Contains("murder") || lower.Contains("violent") || lower.Contains("attack"))
            {
                return new PreFilterResult
                {
                    IsViolent = true,
                    ViolationReason = "Prompt contains highly hostile or violent terms prohibited by our safety guardrail.",
                    RequestFunctionCall = false
                };
            }

            if (lower.Contains("post") || lower.Contains("create") || lower.Contains("đăng bài") || lower.Contains("chia sẻ"))
            {
                return new PreFilterResult
                {
                    IsViolent = false,
                    RequestFunctionCall = true,
                    FunctionName = "CreatePostCommand",
                    FunctionArguments = new Dictionary<string, string>
                    {
                        { "title", "Automated Post" },
                        { "content", prompt }
                    }
                };
            }
            else if (lower.Contains("notify") || lower.Contains("email") || lower.Contains("thông báo") || lower.Contains("gửi thư"))
            {
                return new PreFilterResult
                {
                    IsViolent = false,
                    RequestFunctionCall = true,
                    FunctionName = "SendNotificationCommand",
                    FunctionArguments = new Dictionary<string, string>
                    {
                        { "recipient", "user@example.com" },
                        { "message", prompt },
                        { "type", "Email" }
                    }
                };
            }

            return new PreFilterResult
            {
                IsViolent = false,
                RequestFunctionCall = false
            };
        }

        private PostFilterResult SimulatePostFilter(string response)
        {
            var lower = response.ToLowerInvariant();

            if (lower.Contains("unsafe-ai-term") || lower.Contains("bad-word") || lower.Contains("violent-generation"))
            {
                return new PostFilterResult
                {
                    IsViolent = true,
                    ViolationReason = "The AI generated content that contains safety-violating expressions.",
                    FilteredResponse = "Response blocked due to security policies."
                };
            }

            return new PostFilterResult
            {
                IsViolent = false,
                FilteredResponse = response
            };
        }

        #endregion
    }
}
