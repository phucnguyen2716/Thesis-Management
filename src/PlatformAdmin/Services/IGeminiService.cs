using System.Collections.Generic;
using System.Threading.Tasks;

namespace PlatformAdmin.Services
{
    public interface IGeminiService
    {
        /// <summary>
        /// Analyzes the user's prompt (Pre-Filter). 
        /// Detects safety violations (violence, hate speech, etc.) and determines if a function call is requested.
        /// </summary>
        Task<PreFilterResult> AnalyzePromptAsync(string prompt);

        /// <summary>
        /// Generates the final user-facing text from Gemini, blending the execution result into a natural response.
        /// </summary>
        Task<string> GenerateResponseWithContextAsync(string originalPrompt, string executionResult);

        /// <summary>
        /// Analyzes the generated AI response (Post-Filter) to ensure no violent or unsafe words are output.
        /// </summary>
        Task<PostFilterResult> AnalyzeResponseAsync(string generatedResponse);
    }

    public class PreFilterResult
    {
        public bool IsViolent { get; set; }
        public string? ViolationReason { get; set; }
        public bool RequestFunctionCall { get; set; }
        public string? FunctionName { get; set; }
        public Dictionary<string, string> FunctionArguments { get; set; } = new();
    }

    public class PostFilterResult
    {
        public bool IsViolent { get; set; }
        public string? ViolationReason { get; set; }
        public string FilteredResponse { get; set; } = string.Empty;
    }
}
