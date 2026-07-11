using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PlatformAdmin.DTOs.Thesis;

namespace PlatformAdmin.Services
{
    public class GeminiService : IGeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly string? _defaultApiKey;
        private readonly bool _defaultUseMock;
        private readonly ILogger<GeminiService> _logger;

        public GeminiService(HttpClient httpClient, IConfiguration configuration, IHttpContextAccessor httpContextAccessor, ILogger<GeminiService> logger)
        {
            _httpClient = httpClient;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
            _defaultApiKey = configuration["Gemini:ApiKey"];
            _defaultUseMock = configuration.GetValue<bool>("Gemini:UseMock", true);
        }

        private (string? apiKey, bool useMock) GetGeminiConfig()
        {
            try
            {
                var headerKey = _httpContextAccessor.HttpContext?.Request.Headers["X-Gemini-API-Key"].ToString();
                if (!string.IsNullOrWhiteSpace(headerKey))
                {
                    return (headerKey.Trim(), false);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Failed to read X-Gemini-API-Key header: " + ex.Message);
            }
            return (_defaultApiKey?.Trim(), string.IsNullOrEmpty(_defaultApiKey) || _defaultUseMock);
        }

        public async Task<PreFilterResult> AnalyzePromptAsync(string prompt)
        {
            var (apiKey, useMock) = GetGeminiConfig();
            _logger.LogInformation("Sandwich Pre-Filter: Analyzing prompt safety and function calling intent: '{Prompt}' (Mock: {Mock})", prompt, useMock);

            if (useMock)
            {
                return SimulatePreFilter(prompt);
            }

            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={apiKey}";
                
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
            var lower = originalPrompt.ToLowerInvariant();
            if (lower.Contains("luyện tập") || lower.Contains("luyen tap") || lower.Contains("tập viết") || lower.Contains("tap viet") || lower.Contains("practice") || lower.Contains("soạn thảo") || lower.Contains("soan thao"))
            {
                bool isEnglish = IsEnglishPrompt(originalPrompt);
                if (isEnglish)
                {
                    return "To start practicing academic drafting or writing your research paper, simply type the `/practice` command in this chat box, or click here: [Practice](/practice) to access the standard A4 simulated editing space!";
                }
                else
                {
                    return "Để bắt đầu luyện tập soạn thảo nội dung báo cáo hoặc viết đề tài chuẩn học thuật, bạn hãy nhập lệnh `/practice` ngay tại đây, hoặc nhấp vào liên kết sau: [Luyện đồ án](/practice). Hệ thống sẽ chuyển hướng bạn đến phòng soạn thảo giả lập trang A4 chuẩn UEF!";
                }
            }

            // Academic Handbook / Cẩm nang hỗ trợ học vụ
            if (lower.Contains("cẩm nang") || lower.Contains("cam nang") || lower.Contains("academic handbook") || lower.Contains("hỗ trợ học vụ") || lower.Contains("ho tro hoc vu") || lower.Contains("học vụ") || lower.Contains("hoc vu"))
            {
                bool isEnglish = IsEnglishPrompt(originalPrompt);
                if (isEnglish)
                {
                    return "📖 **UEF Academic Support Handbook**\n\n" +
                           "Here is a summary of the key academic regulations and support information:\n\n" +
                           "**1. 📝 Course Registration**\n" +
                           "• Registration period: At the beginning of each semester as announced by the Academic Affairs Office.\n" +
                           "• Students register online via the Student Portal at [https://sinhvien.uef.edu.vn](https://sinhvien.uef.edu.vn).\n" +
                           "• Late registration requires approval from the Department.\n\n" +
                           "**2. 📊 Grading & Assessment**\n" +
                           "• Component scores: Attendance (10%), Midterm (30%), Final exam (60%).\n" +
                           "• GPA scale: 4.0 (A = 4.0, B+ = 3.5, B = 3.0, C+ = 2.5, C = 2.0, D = 1.0, F = 0).\n" +
                           "• Students with GPA below 1.0 for two consecutive semesters will receive an academic warning.\n\n" +
                           "**3. 🎓 Graduation Requirements**\n" +
                           "• Complete all required credits in the training program (minimum 130 credits).\n" +
                           "• Cumulative GPA ≥ 2.0/4.0.\n" +
                           "• English proficiency certificate (IELTS ≥ 5.5 or equivalent).\n" +
                           "• No outstanding tuition fees or library obligations.\n\n" +
                           "**4. 📞 Academic Support Contact**\n" +
                           "• Academic Affairs Office: Building A, Room 101 | Phone: (028) 5422 7788 ext 113\n" +
                           "• Student email support: phongdaotao@uef.edu.vn\n" +
                           "• Office hours: Mon-Fri, 8:00 AM – 5:00 PM\n\n" +
                           "Feel free to ask if you need more details about any specific topic!";
                }
                else
                {
                    return "📖 **Cẩm nang Hỗ trợ Học vụ UEF**\n\n" +
                           "Dưới đây là tổng hợp các quy định học vụ và thông tin hỗ trợ quan trọng:\n\n" +
                           "**1. 📝 Đăng ký học phần**\n" +
                           "• Thời gian đăng ký: Đầu mỗi học kỳ theo thông báo của Phòng Đào tạo.\n" +
                           "• Sinh viên đăng ký trực tuyến qua Cổng thông tin sinh viên tại [https://sinhvien.uef.edu.vn](https://sinhvien.uef.edu.vn).\n" +
                           "• Đăng ký trễ cần có sự phê duyệt của Khoa/Bộ môn.\n\n" +
                           "**2. 📊 Đánh giá & Chấm điểm**\n" +
                           "• Cơ cấu điểm thành phần: Chuyên cần (10%), Giữa kỳ (30%), Cuối kỳ (60%).\n" +
                           "• Thang điểm GPA: 4.0 (A = 4.0, B+ = 3.5, B = 3.0, C+ = 2.5, C = 2.0, D = 1.0, F = 0).\n" +
                           "• Sinh viên có GPA dưới 1.0 trong 2 học kỳ liên tiếp sẽ bị cảnh báo học vụ.\n\n" +
                           "**3. 🎓 Điều kiện Tốt nghiệp**\n" +
                           "• Hoàn thành đủ tín chỉ theo chương trình đào tạo (tối thiểu 130 tín chỉ).\n" +
                           "• Điểm trung bình tích lũy (GPA) ≥ 2.0/4.0.\n" +
                           "• Chứng chỉ tiếng Anh đạt chuẩn (IELTS ≥ 5.5 hoặc tương đương).\n" +
                           "• Không còn nợ học phí và nghĩa vụ với thư viện.\n\n" +
                           "**4. 📞 Liên hệ Hỗ trợ Học vụ**\n" +
                           "• Phòng Đào tạo: Tòa nhà A, Phòng 101 | ĐT: (028) 5422 7788 ext 113\n" +
                           "• Email hỗ trợ sinh viên: phongdaotao@uef.edu.vn\n" +
                           "• Giờ làm việc: Thứ 2 – Thứ 6, 8:00 – 17:00\n\n" +
                           "Bạn cần tìm hiểu chi tiết về mục nào thì cứ hỏi tôi nhé!";
                }
            }

            // Student Handbook / Sổ tay sinh viên
            if (lower.Contains("sổ tay") || lower.Contains("so tay") || lower.Contains("student handbook") || lower.Contains("sinh viên handbook"))
            {
                bool isEnglish = IsEnglishPrompt(originalPrompt);
                if (isEnglish)
                {
                    return "📘 **UEF Student Handbook**\n\n" +
                           "Essential information every UEF student needs to know:\n\n" +
                           "**1. 🏫 Campus Information**\n" +
                           "• Main campus: 141-145 Dien Bien Phu, Ward 15, Binh Thanh District, HCMC.\n" +
                           "• Campus 2: 276 Dien Bien Phu, Ward 17, Binh Thanh District, HCMC.\n" +
                           "• Library open hours: Mon-Sat, 7:30 AM – 8:00 PM.\n\n" +
                           "**2. 📅 Academic Calendar**\n" +
                           "• Fall Semester: September – January.\n" +
                           "• Spring Semester: February – June.\n" +
                           "• Summer Semester: July – August (optional intensive courses).\n\n" +
                           "**3. 🎒 Student Rights & Responsibilities**\n" +
                           "• Students must attend at least 80% of classes per course.\n" +
                           "• Dress code: Smart casual; no flip-flops or sleeveless shirts in classrooms.\n" +
                           "• Cheating or plagiarism will result in immediate disciplinary action (grade F and a formal warning).\n\n" +
                           "**4. 💰 Tuition & Financial Support**\n" +
                           "• Tuition payment deadline: Within 2 weeks from the start of each semester.\n" +
                           "• Scholarship opportunities: Academic Excellence, Sports, Community Service.\n" +
                           "• Financial aid office: Building A, Room 203 | Email: taichinh@uef.edu.vn\n\n" +
                           "**5. 🏥 Student Support Services**\n" +
                           "• Health insurance: Compulsory, covered via student health insurance program.\n" +
                           "• Counseling center: Free psychological counseling for all students.\n" +
                           "• Career center: Internship and job placement support.\n\n" +
                           "Need more information on any section? Just ask!";
                }
                else
                {
                    return "📘 **Sổ tay Sinh viên UEF**\n\n" +
                           "Thông tin cần thiết mà mỗi sinh viên UEF cần nắm:\n\n" +
                           "**1. 🏫 Thông tin Cơ sở**\n" +
                           "• Cơ sở chính: 141-145 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM.\n" +
                           "• Cơ sở 2: 276 Điện Biên Phủ, Phường 17, Quận Bình Thạnh, TP.HCM.\n" +
                           "• Giờ mở cửa Thư viện: Thứ 2 – Thứ 7, 7:30 – 20:00.\n\n" +
                           "**2. 📅 Lịch Học vụ**\n" +
                           "• Học kỳ Thu: Tháng 9 – Tháng 1.\n" +
                           "• Học kỳ Xuân: Tháng 2 – Tháng 6.\n" +
                           "• Học kỳ Hè: Tháng 7 – Tháng 8 (các lớp học phần tăng cường, tùy chọn).\n\n" +
                           "**3. 🎒 Quyền lợi & Trách nhiệm Sinh viên**\n" +
                           "• Sinh viên phải tham dự ít nhất 80% số buổi học mỗi môn.\n" +
                           "• Quy định trang phục: Lịch sự, gọn gàng; không mang dép lê, áo ba lỗ vào lớp.\n" +
                           "• Gian lận thi cử hoặc đạo văn sẽ bị xử lý kỷ luật ngay (điểm F và khiển trách).\n\n" +
                           "**4. 💰 Học phí & Hỗ trợ Tài chính**\n" +
                           "• Hạn nộp học phí: Trong vòng 2 tuần kể từ đầu mỗi học kỳ.\n" +
                           "• Học bổng: Học bổng Xuất sắc Học thuật, Thể thao, Cộng đồng.\n" +
                           "• Phòng Tài chính: Tòa nhà A, Phòng 203 | Email: taichinh@uef.edu.vn\n\n" +
                           "**5. 🏥 Dịch vụ Hỗ trợ Sinh viên**\n" +
                           "• Bảo hiểm y tế: Bắt buộc, được chi trả qua chương trình BHYT sinh viên.\n" +
                           "• Trung tâm Tư vấn Tâm lý: Miễn phí cho toàn bộ sinh viên.\n" +
                           "• Trung tâm Hướng nghiệp: Hỗ trợ thực tập và giới thiệu việc làm.\n\n" +
                           "Bạn cần biết thêm chi tiết mục nào thì cứ hỏi tôi nhé!";
                }
            }

            var (apiKey, useMock) = GetGeminiConfig();
            _logger.LogInformation("Generating final natural language response. (Mock: {Mock})", useMock);

            if (useMock)
            {
                return FormatExecutionResult(originalPrompt, executionResult);
            }

            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={apiKey}";
                var promptWithContext = $"Original User Intent: {originalPrompt}\n\nExecution Result Data: {executionResult}\n\nTask: Draft a highly professional, polite, and descriptive response summarizing the action completed. Maintain a positive tone and do not output any inappropriate terms. IMPORTANT: If the Execution Result Data contains any [THESIS_CARD:id=...|title=...|student=...] tags, you MUST preserve them exactly as they are in your response without modification so the client UI can render them as rich card components.";

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
                    .GetString() ?? FormatExecutionResult(originalPrompt, executionResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to call Gemini API in formatting. Falling back to standard format.");
                return FormatExecutionResult(originalPrompt, executionResult);
            }
        }

        private string FormatExecutionResult(string originalPrompt, string executionResult)
        {
            bool isEnglish = IsEnglishPrompt(originalPrompt);
            var lower = originalPrompt.ToLowerInvariant();

            if (isEnglish)
            {
                // Greeting
                if (ContainsAnyWord(lower, "hello", "hi", "hey"))
                {
                    return "Hello! I am your eThesis Academic Assistant. I'm here to help you navigate our Digital Library. How can I assist you today, my friend?";
                }
                
                // About Website
                if (lower.Contains("what is this") || lower.Contains("what website") || lower.Contains("about") || lower.Contains("website gì") || lower.Contains("trang web gì") || lower.Contains("how it work") || lower.Contains("how does it work") || lower.Contains("how this work") || lower.Contains("how to use"))
                {
                    return "Welcome to **eThesis**! This is an academic Digital Library platform. Here, you can search for outstanding graduation theses and specialization reports, read them using our beautiful 3D Flipbook viewer, practice writing academic chapters in a standard A4 editor, and even play fun intellectual games in the Arena to relax!";
                }

                // Features
                if (lower.Contains("feature") || lower.Contains("capability") || lower.Contains("what can you do") || lower.Contains("chức năng") || lower.Contains("tính năng"))
                {
                    return "Here is what we can do in **eThesis**:\n\n" +
                           "1. 🔍 **Smart Search & Reference:** Search our library using full-text BM25 rankings and read documents via a 3D Flipbook reader.\n" +
                           "2. ✍️ **Academic A4 Editor:** Practice drafting your research chapters with real-time word limits and AI formatting checks.\n" +
                           "3. 📖 **Citation & Guidelines:** Easily reference templates based on standard APA and IEEE guidelines.\n" +
                           "4. 🎮 **Mini-Game Arena:** Unwind with Chess vs AI, Word Connect, Solitaire, or Tetris Blitz!\n\n" +
                           "How can I help you explore these features?";
                }

                // Credentials/Login
                if (lower.Contains("login") || lower.Contains("credential") || lower.Contains("password") || lower.Contains("account") || lower.Contains("tài khoản") || lower.Contains("đăng nhập"))
                {
                    return "Sure! You can test our Digital Library using these seeded accounts (password is `123` for all):\n\n" +
                           "- **Admin:** `admin@ethesis.edu.vn` (or simply log in via Google to auto-grant Admin status)\n" +
                           "- **Advisor:** `advisor@ethesis.edu.vn`\n" +
                           "- **Student:** `student@ethesis.edu.vn`";
                }

                // Thank you
                if (lower.Contains("thank") || lower.Contains("thanks") || lower.Contains("tks") || lower.Contains("cảm ơn"))
                {
                    return "You're very welcome! I'm always glad to help. Let me know if you need anything else!";
                }

                // Search Results
                if (executionResult.Contains("Search completed"))
                {
                    if (executionResult.Contains("Found"))
                    {
                        try
                        {
                            var listPart = executionResult.Substring(executionResult.IndexOf("matching theses:") + "matching theses:".Length);
                            var formattedList = string.Join("\n", listPart.Split(new[] { "; " }, StringSplitOptions.RemoveEmptyEntries)
                                .Select(item =>
                                {
                                    var trimmed = item.Trim();
                                    try
                                    {
                                        var idStr = trimmed.Substring(3, trimmed.IndexOf(":") - 3).Trim();
                                        var titleAndStudent = trimmed.Substring(trimmed.IndexOf(":") + 1).Trim();
                                        var title = titleAndStudent.Substring(1, titleAndStudent.IndexOf("'", 1) - 1);
                                        var student = titleAndStudent.Substring(titleAndStudent.IndexOf("by student") + 10).Trim();
                                        student = student.TrimEnd('.', ';', ' ');

                                        return $"[THESIS_CARD:id={idStr}|title={title}|student={student}]";
                                    }
                                    catch
                                    {
                                        return $"• {trimmed.TrimEnd('.', ';', ' ')}";
                                    }
                                }));

                            return $"I found matching theses for your request! Here are the search results:\n\n{formattedList}\n\nYou can click on a card to view its details or read it in the 3D Flipbook reader!";
                        }
                        catch
                        {
                            return $"I found some theses matching your query: {executionResult}";
                        }
                    }
                    else
                    {
                        return "I searched for theses but couldn't find any match for your request. Please try again with other keywords!";
                    }
                }

                // Academic Handbook
                if (lower.Contains("handbook") || lower.Contains("academic handbook") || lower.Contains("manual") || lower.Contains("academic support"))
                {
                    return "📖 **UEF Academic Support Handbook**\n\n" +
                           "Here is a summary of the key academic regulations and support information:\n\n" +
                           "**1. 📝 Course Registration**\n" +
                           "• Registration period: At the beginning of each semester as announced by the Academic Affairs Office.\n" +
                           "• Students register online via the Student Portal at [https://sinhvien.uef.edu.vn](https://sinhvien.uef.edu.vn).\n\n" +
                           "**2. 📊 Grading & Assessment**\n" +
                           "• Component scores: Attendance (10%), Midterm (30%), Final exam (60%).\n" +
                           "• GPA scale: 4.0 (A = 4.0, B+ = 3.5, B = 3.0, C+ = 2.5, C = 2.0, D = 1.0, F = 0).\n\n" +
                           "**3. 🎓 Graduation Requirements**\n" +
                           "• Complete all required credits (minimum 130 credits).\n" +
                           "• Cumulative GPA ≥ 2.0/4.0.\n" +
                           "• English proficiency certificate (IELTS ≥ 5.5 or equivalent).\n\n" +
                           "**4. 📞 Contact:** Academic Affairs Office, Building A, Room 101 | (028) 5422 7788 ext 113\n\n" +
                           "Feel free to ask if you need more details!";
                }

                // Student Handbook
                if (lower.Contains("student handbook") || lower.Contains("student guide"))
                {
                    return "📘 **UEF Student Handbook**\n\n" +
                           "Essential information every UEF student needs to know:\n\n" +
                           "**1. 🏫 Campus:** 141-145 Dien Bien Phu, Binh Thanh District, HCMC.\n" +
                           "**2. 📅 Calendar:** Fall (Sep–Jan), Spring (Feb–Jun), Summer (Jul–Aug).\n" +
                           "**3. 🎒 Attendance:** Minimum 80% per course required.\n" +
                           "**4. 💰 Tuition:** Payment due within 2 weeks of semester start.\n" +
                           "**5. 🏥 Support:** Free counseling, health insurance, career center.\n\n" +
                           "Need more information on any section? Just ask!";
                }

                // Default Fallback
                return $"I hear you! As your eThesis academic assistant, I am happy to chat and guide you. Although I'm running in standby mode right now, you can still ask me to search for documents (e.g., \"find AI thesis\"), check formatting guidelines, or explain our mini-games. What part of our Digital Library shall we explore together?";
            }
            else
            {
                // Greeting
                if (ContainsAnyWord(lower, "chào", "chao", "hello", "hi", "hey"))
                {
                    return "Xin chào bạn! Tôi là trợ lý ảo eThesis. Tôi có thể hỗ trợ bạn tìm kiếm tài liệu, cẩm nang viết khóa luận và giải đáp thắc mắc. Hôm nay tôi có thể giúp gì cho bạn?";
                }

                // About Website
                if (lower.Contains("đây là") || lower.Contains("trang web gì") || lower.Contains("web gì") || lower.Contains("website gì") || lower.Contains("day la") || lower.Contains("trang gi") || lower.Contains("đây là trang") || lower.Contains("hoạt động") || lower.Contains("hoat dong") || lower.Contains("giới thiệu") || lower.Contains("gioi thieu"))
                {
                    return "Chào mừng bạn đến với **eThesis**! Đây là **Thư viện số Học thuật & Tra cứu Đề tài Thông minh** dành riêng cho sinh viên UEF. Tại đây, bạn có thể tra cứu và tham khảo kho khóa luận/chuyên đề xuất sắc của các khóa trước, đọc sách định dạng 3D Flipbook sinh động, luyện tập soạn thảo bài viết chuẩn A4 và giải trí với các trò chơi trí tuệ!";
                }

                // Features
                if (lower.Contains("chức năng") || lower.Contains("tính năng") || lower.Contains("làm được gì") || lower.Contains("lam duoc gi") || lower.Contains("chuc nang") || lower.Contains("tinh nang") || lower.Contains("có gì"))
                {
                    return "Đến với **eThesis**, bạn có thể trải nghiệm các tính năng nổi bật sau:\n\n" +
                           "1. 🔍 **Tra cứu Thư viện số:** Tìm kiếm toàn văn khóa luận tốt nghiệp và chuyên đề xuất sắc, đọc trực tuyến với trình đọc sách 3D Flipbook.\n" +
                           "2. ✍️ **Luyện tập Soạn thảo:** Tập viết các chương nghiên cứu trên khung soạn thảo giả lập trang A4 chuẩn học thuật, có AI chấm điểm trực tiếp.\n" +
                           "3. 📖 **Cẩm nang Trích dẫn:** Xem hướng dẫn trình bày văn bản khoa học theo chuẩn APA/IEEE.\n" +
                           "4. 🎮 **Mini-Game Arena:** Giải trí giảm áp lực học tập với Cờ vua vs AI, Nối chữ học thuật, Solitaire và Tetris.\n\n" +
                           "Bạn cần tôi hướng dẫn chi tiết về tính năng nào?";
                }

                // Credentials/Login
                if (lower.Contains("đăng nhập") || lower.Contains("dang nhap") || lower.Contains("tài khoản") || lower.Contains("tai khoan") || lower.Contains("mật khẩu") || lower.Contains("mat khau") || lower.Contains("mk") || lower.Contains("password") || lower.Contains("acc"))
                {
                    return "Bạn có thể thử nghiệm hệ thống eThesis bằng các tài khoản kiểm thử sau (mật khẩu đều là `123`):\n\n" +
                           "- **Quản trị viên (Admin):** `admin@ethesis.edu.vn` (Hoặc đăng nhập bằng tài khoản Google để tự động nhận quyền Admin)\n" +
                           "- **Giảng viên (Advisor):** `advisor@ethesis.edu.vn`\n" +
                           "- **Sinh viên (Student):** `student@ethesis.edu.vn`";
                }

                // Thank you
                if (lower.Contains("cảm ơn") || lower.Contains("cam on") || lower.Contains("thank") || lower.Contains("tks"))
                {
                    return "Không có gì đâu nè! Rất vui được hỗ trợ bạn. Chúc bạn có một ngày học tập thật hiệu quả nhé!";
                }

                // Search Results
                if (executionResult.Contains("Search completed"))
                {
                    if (executionResult.Contains("Found"))
                    {
                        try
                        {
                            var listPart = executionResult.Substring(executionResult.IndexOf("matching theses:") + "matching theses:".Length);
                            var formattedList = string.Join("\n", listPart.Split(new[] { "; " }, StringSplitOptions.RemoveEmptyEntries)
                                .Select(item =>
                                {
                                    var trimmed = item.Trim();
                                    try
                                    {
                                        var idStr = trimmed.Substring(3, trimmed.IndexOf(":") - 3).Trim();
                                        var titleAndStudent = trimmed.Substring(trimmed.IndexOf(":") + 1).Trim();
                                        var title = titleAndStudent.Substring(1, titleAndStudent.IndexOf("'", 1) - 1);
                                        var student = titleAndStudent.Substring(titleAndStudent.IndexOf("by student") + 10).Trim();
                                        student = student.TrimEnd('.', ';', ' ');

                                        return $"[THESIS_CARD:id={idStr}|title={title}|student={student}]";
                                    }
                                    catch
                                    {
                                        return $"• {trimmed.TrimEnd('.', ';', ' ')}";
                                    }
                                }));

                            return $"Tôi đã tìm thấy đề tài phù hợp với yêu cầu của bạn! Dưới đây là kết quả:\n\n{formattedList}\n\nBạn có thể nhấp vào liên kết tương ứng để xem chi tiết hoặc đọc sách 3D Flipbook nhé!";
                        }
                        catch
                        {
                            return $"Tôi đã tìm thấy một số đề tài phù hợp: {executionResult}";
                        }
                    }
                    else
                    {
                        return "Tôi đã thực hiện tìm kiếm đề tài nhưng rất tiếc chưa tìm thấy kết quả nào khớp với yêu cầu của bạn. Bạn hãy thử tìm với từ khóa khác nhé!";
                    }
                }

                // Cẩm nang hỗ trợ học vụ
                if (lower.Contains("cẩm nang") || lower.Contains("cam nang") || lower.Contains("học vụ") || lower.Contains("hoc vu"))
                {
                    return "📖 **Cẩm nang Hỗ trợ Học vụ UEF**\n\n" +
                           "Dưới đây là tổng hợp các quy định học vụ và thông tin hỗ trợ quan trọng:\n\n" +
                           "**1. 📝 Đăng ký học phần**\n" +
                           "• Thời gian đăng ký: Đầu mỗi học kỳ theo thông báo của Phòng Đào tạo.\n" +
                           "• Sinh viên đăng ký trực tuyến qua Cổng thông tin sinh viên tại [https://sinhvien.uef.edu.vn](https://sinhvien.uef.edu.vn).\n" +
                           "• Đăng ký trễ cần có sự phê duyệt của Khoa/Bộ môn.\n\n" +
                           "**2. 📊 Đánh giá & Chấm điểm**\n" +
                           "• Cơ cấu điểm thành phần: Chuyên cần (10%), Giữa kỳ (30%), Cuối kỳ (60%).\n" +
                           "• Thang điểm GPA: 4.0 (A = 4.0, B+ = 3.5, B = 3.0, C+ = 2.5, C = 2.0, D = 1.0, F = 0).\n" +
                           "• Sinh viên có GPA dưới 1.0 trong 2 học kỳ liên tiếp sẽ bị cảnh báo học vụ.\n\n" +
                           "**3. 🎓 Điều kiện Tốt nghiệp**\n" +
                           "• Hoàn thành đủ tín chỉ theo chương trình đào tạo (tối thiểu 130 tín chỉ).\n" +
                           "• Điểm trung bình tích lũy (GPA) ≥ 2.0/4.0.\n" +
                           "• Chứng chỉ tiếng Anh đạt chuẩn (IELTS ≥ 5.5 hoặc tương đương).\n" +
                           "• Không còn nợ học phí và nghĩa vụ với thư viện.\n\n" +
                           "**4. 📞 Liên hệ Hỗ trợ Học vụ**\n" +
                           "• Phòng Đào tạo: Tòa nhà A, Phòng 101 | ĐT: (028) 5422 7788 ext 113\n" +
                           "• Email hỗ trợ sinh viên: phongdaotao@uef.edu.vn\n" +
                           "• Giờ làm việc: Thứ 2 – Thứ 6, 8:00 – 17:00\n\n" +
                           "Bạn cần tìm hiểu chi tiết về mục nào thì cứ hỏi tôi nhé!";
                }

                // Sổ tay sinh viên
                if (lower.Contains("sổ tay") || lower.Contains("so tay"))
                {
                    return "📘 **Sổ tay Sinh viên UEF**\n\n" +
                           "Thông tin cần thiết mà mỗi sinh viên UEF cần nắm:\n\n" +
                           "**1. 🏫 Thông tin Cơ sở**\n" +
                           "• Cơ sở chính: 141-145 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM.\n" +
                           "• Cơ sở 2: 276 Điện Biên Phủ, Phường 17, Quận Bình Thạnh, TP.HCM.\n" +
                           "• Giờ mở cửa Thư viện: Thứ 2 – Thứ 7, 7:30 – 20:00.\n\n" +
                           "**2. 📅 Lịch Học vụ**\n" +
                           "• Học kỳ Thu: Tháng 9 – Tháng 1.\n" +
                           "• Học kỳ Xuân: Tháng 2 – Tháng 6.\n" +
                           "• Học kỳ Hè: Tháng 7 – Tháng 8 (các lớp học phần tăng cường, tùy chọn).\n\n" +
                           "**3. 🎒 Quyền lợi & Trách nhiệm Sinh viên**\n" +
                           "• Sinh viên phải tham dự ít nhất 80% số buổi học mỗi môn.\n" +
                           "• Quy định trang phục: Lịch sự, gọn gàng; không mang dép lê, áo ba lỗ vào lớp.\n" +
                           "• Gian lận thi cử hoặc đạo văn sẽ bị xử lý kỷ luật ngay (điểm F và khiển trách).\n\n" +
                           "**4. 💰 Học phí & Hỗ trợ Tài chính**\n" +
                           "• Hạn nộp học phí: Trong vòng 2 tuần kể từ đầu mỗi học kỳ.\n" +
                           "• Học bổng: Học bổng Xuất sắc Học thuật, Thể thao, Cộng đồng.\n" +
                           "• Phòng Tài chính: Tòa nhà A, Phòng 203 | Email: taichinh@uef.edu.vn\n\n" +
                           "**5. 🏥 Dịch vụ Hỗ trợ Sinh viên**\n" +
                           "• Bảo hiểm y tế: Bắt buộc, được chi trả qua chương trình BHYT sinh viên.\n" +
                           "• Trung tâm Tư vấn Tâm lý: Miễn phí cho toàn bộ sinh viên.\n" +
                           "• Trung tâm Hướng nghiệp: Hỗ trợ thực tập và giới thiệu việc làm.\n\n" +
                           "Bạn cần biết thêm chi tiết mục nào thì cứ hỏi tôi nhé!";
                }

                // Default Fallback
                return $"Tôi đã ghi nhận câu hỏi của bạn: \"{originalPrompt}\". Hiện tại tôi đang chạy ở chế độ chuẩn bị, nhưng bạn vẫn có thể yêu cầu tôi tìm kiếm tài liệu (ví dụ: 'tìm khóa luận công nghệ phần mềm'), hỏi đáp về tài khoản đăng nhập hoặc các cẩm nang trình bày bài viết nhé! Bạn muốn chúng ta cùng khám phá phần nào của Thư viện số?";
            }
        }

        public async Task<PostFilterResult> AnalyzeResponseAsync(string generatedResponse)
        {
            var (apiKey, useMock) = GetGeminiConfig();
            _logger.LogInformation("Sandwich Post-Filter: Verifying AI output safety (Mock: {Mock})", useMock);

            if (useMock)
            {
                return SimulatePostFilter(generatedResponse);
            }

            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={apiKey}";
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

        public async Task<ThesisPracticeEvaluationResult> EvaluateThesisPracticeAsync(string content, string thesisTitle, string chapterId, string chapterLabel, List<string> requiredSections)
        {
            var (apiKey, useMock) = GetGeminiConfig();
            _logger.LogInformation("Evaluating thesis practice content. Title: '{Title}', Chapter: '{Chapter}' (Mock: {Mock})", thesisTitle, chapterLabel, useMock);

            if (useMock)
            {
                return SimulatePracticeEvaluation(content, thesisTitle, chapterId, chapterLabel, requiredSections);
            }

            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={apiKey}";

                var systemPrompt = $"You are an academic expert grading university graduation thesis drafts.\n" +
                    $"Evaluate the logical coherence, semantic relevance, and scientific tone of the following student draft text.\n\n" +
                    $"Thesis Topic Title: \"{thesisTitle}\"\n" +
                    $"Chapter/Section: \"{chapterLabel}\" (ID: {chapterId})\n" +
                    $"Required subsections/concepts: {string.Join(", ", requiredSections)}\n\n" +
                    $"Student Content:\n{content}\n\n" +
                    $"Evaluation Rules:\n" +
                    $"1. Check if the text is gibberish (e.g. keyboard mashing 'asdfg', random letters), placeholder text like 'Lorem Ipsum', or completely unrelated to a university thesis/graduation project (e.g. talking about movies, daily life, recipes, cats, etc.). If it is gibberish or completely unrelated, you MUST set 'isGibberishOrNonsense' to true, and set 'contentScore' to 0.0 and 'originalityScore' to 0.0.\n" +
                    $"2. If the text is valid, assess the logical structure and relevance to the thesis title. Assign 'contentScore' (0.0 to 10.0) based on depth, description of ideas, and if it satisfies the chapter requirements.\n" +
                    $"3. Assign 'originalityScore' (0.0 to 10.0) based on the academic tone, research mindset, and scientific quality of the text.\n" +
                    $"4. Provide at least 2 distinct, highly helpful feedback items in Vietnamese. Each feedback item must have a 'type' ('success' for strong logical/content points, 'warning' for deficiencies/missing parts, 'info' for general improvements), a short 'title' (in Vietnamese), and a helpful 'text' description (in Vietnamese).\n\n" +
                    $"Return a JSON output with the exact schema:\n" +
                    $"{{\n" +
                    $"  \"contentScore\": 8.5,\n" +
                    $"  \"originalityScore\": 7.5,\n" +
                    $"  \"isGibberishOrNonsense\": false,\n" +
                    $"  \"feedbackItems\": [\n" +
                    $"    {{\n" +
                    $"      \"type\": \"success\",\n" +
                    $"      \"title\": \"Văn phong tốt\",\n" +
                    $"      \"text\": \"Bài viết sử dụng thuật ngữ chính xác, cấu trúc logic mạch lạc.\"\n" +
                    $"    }},\n" +
                    $"    {{\n" +
                    $"      \"type\": \"warning\",\n" +
                    $"      \"title\": \"Thiếu lý thuyết\",\n" +
                    $"      \"text\": \"Cần phân tích sâu hơn về công nghệ áp dụng.\"\n" +
                    $"    }}\n" +
                    $"  ]\n" +
                    $"}}";

                var requestBody = new
                {
                    contents = new[]
                    {
                        new { role = "user", parts = new[] { new { text = systemPrompt } } }
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
                    return SimulatePracticeEvaluation(content, thesisTitle, chapterId, chapterLabel, requiredSections);
                }

                var parsed = JsonSerializer.Deserialize<ThesisPracticeEvaluationResult>(textResult, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return parsed ?? SimulatePracticeEvaluation(content, thesisTitle, chapterId, chapterLabel, requiredSections);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to call Gemini API for thesis practice evaluation. Falling back to local heuristics.");
                return SimulatePracticeEvaluation(content, thesisTitle, chapterId, chapterLabel, requiredSections);
            }
        }

        private bool IsGibberishWord(string word)
        {
            if (word.Length > 20) return true;

            // Character checks (English & Vietnamese vowels)
            string vowels = "aeiouyăâêôơưáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ";
            bool hasVowel = false;
            foreach (char c in word)
            {
                if (vowels.Contains(c))
                {
                    hasVowel = true;
                    break;
                }
            }

            if (word.Length >= 4 && !hasVowel) return true;
            return false;
        }

        private bool IsRelevanceCheckPassed(string text, string thesisTitle)
        {
            if (string.IsNullOrWhiteSpace(thesisTitle) || thesisTitle == "Đồ án luyện tập") return true;

            var stopwords = new HashSet<string>(new[] { "xây", "dựng", "hệ", "thống", "sử", "dụng", "công", "nghệ", "đồ", "án", "đề", "tài", "và", "của", "cho", "tại", "ở", "một", "những", "các", "với", "như", "được", "bởi", "về", "có", "là", "application", "system", "web", "app", "trên", "nền", "tảng" });
            var titleWords = thesisTitle.ToLowerInvariant().Split(new[] { ' ', ',', '.', '-', '/', ':', ';' }, StringSplitOptions.RemoveEmptyEntries);
            var keywords = new List<string>();

            foreach (var w in titleWords)
            {
                if (w.Length > 2 && !stopwords.Contains(w))
                {
                    keywords.Add(w);
                }
            }

            if (keywords.Count == 0) return true;

            var lowerText = text.ToLowerInvariant();
            foreach (var kw in keywords)
            {
                if (lowerText.Contains(kw))
                {
                    return true;
                }
            }
            return false;
        }

        private ThesisPracticeEvaluationResult SimulatePracticeEvaluation(string content, string thesisTitle, string chapterId, string chapterLabel, List<string> requiredSections)
        {
            var cleanText = System.Text.RegularExpressions.Regex.Replace(content, "<.*?>", string.Empty);
            var words = cleanText.ToLowerInvariant().Split(new[] { ' ', '\r', '\n', '\t', '.', ',', '!', '?', ';', ':' }, StringSplitOptions.RemoveEmptyEntries);

            var result = new ThesisPracticeEvaluationResult();

            if (words.Length < 10)
            {
                result.IsGibberishOrNonsense = true;
                result.ContentScore = 0;
                result.OriginalityScore = 0;
                result.FeedbackItems.Add(new PracticeFeedbackItem
                {
                    Type = "warning",
                    Title = "Nội dung quá ngắn",
                    Text = "Nội dung soạn thảo quá ngắn (dưới 10 từ). Vui lòng viết thêm nội dung cụ thể."
                });
                return result;
            }

            int gibberishCount = 0;
            foreach (var w in words)
            {
                if (IsGibberishWord(w)) gibberishCount++;
            }

            bool hasGibberish = gibberishCount > 0 && ((double)gibberishCount / words.Length > 0.15);

            bool hasConsecutiveRepetitions = false;
            for (int i = 0; i < words.Length - 2; i++)
            {
                if (words[i] == words[i + 1] && words[i + 1] == words[i + 2])
                {
                    hasConsecutiveRepetitions = true;
                    break;
                }
            }

            bool isRelevant = IsRelevanceCheckPassed(cleanText, thesisTitle);

            if (hasGibberish || hasConsecutiveRepetitions || !isRelevant)
            {
                result.IsGibberishOrNonsense = true;
                result.ContentScore = 0.0;
                result.OriginalityScore = 0.0;

                if (hasGibberish)
                {
                    result.FeedbackItems.Add(new PracticeFeedbackItem
                    {
                        Type = "warning",
                        Title = "Phát hiện nội dung vô nghĩa",
                        Text = "Văn bản chứa các từ viết sai cấu trúc hoặc gõ phím ngẫu nhiên vô nghĩa (gibberish)."
                    });
                }
                if (hasConsecutiveRepetitions)
                {
                    result.FeedbackItems.Add(new PracticeFeedbackItem
                    {
                        Type = "warning",
                        Title = "Phát hiện lặp từ liên tục",
                        Text = "Cảnh báo lặp đi lặp lại một từ nhiều lần liên tiếp để tăng số lượng chữ."
                    });
                }
                if (!isRelevant)
                {
                    result.FeedbackItems.Add(new PracticeFeedbackItem
                    {
                        Type = "warning",
                        Title = "Không liên quan đến đề tài",
                        Text = $"Nội dung bài viết không khớp với chủ đề đề tài của bạn: \"{thesisTitle}\"."
                    });
                }
                return result;
            }

            int minWords = 200;
            if (chapterId == "master_ch") minWords = 900;
            else if (chapterId == "intro") minWords = 200;
            else if (chapterId == "chapter1") minWords = 300;
            else if (chapterId == "chapter2") minWords = 350;
            else if (chapterId == "chapter3") minWords = 300;
            else if (chapterId == "conclusion") minWords = 150;

            if (words.Length >= minWords)
            {
                result.ContentScore = Math.Min(10.0, 8.5 + (words.Length - minWords) / 150.0);
                result.FeedbackItems.Add(new PracticeFeedbackItem
                {
                    Type = "success",
                    Title = "Độ dài nội dung đạt yêu cầu",
                    Text = $"Nội dung đã đạt độ dài chuẩn cho chương này ({words.Length}/{minWords} từ)."
                });
            }
            else
            {
                result.ContentScore = Math.Round(((double)words.Length / minWords * 8.0) * 10) / 10;
                result.FeedbackItems.Add(new PracticeFeedbackItem
                {
                    Type = "warning",
                    Title = "Độ dài chưa đạt",
                    Text = $"Nội dung chương này còn ngắn ({words.Length}/{minWords} từ). Cần viết cụ thể và chi tiết hơn."
                });
            }

            string[] academicTerms = { "phân tích", "thiết kế", "hệ thống", "nghiên cứu", "thực nghiệm", "đánh giá", "blockchain", "ứng dụng", "mô hình", "phát triển", "quy trình", "cơ sở", "lý thuyết", "dữ liệu", "thông tin", "triển khai" };
            int hits = 0;
            foreach (var term in academicTerms)
            {
                if (cleanText.ToLowerInvariant().Contains(term)) hits++;
            }

            result.OriginalityScore = hits == 0 ? 3.0 : Math.Round((Math.Min(10.0, 4.0 + (hits / 5.0) * 6.0)) * 10) / 10;
            if (hits >= 6)
            {
                result.FeedbackItems.Add(new PracticeFeedbackItem
                {
                    Type = "success",
                    Title = "Văn phong học thuật tốt",
                    Text = "Phần viết chứa nhiều thuật ngữ khoa học và chuyên môn chính xác."
                });
            }
            else
            {
                result.FeedbackItems.Add(new PracticeFeedbackItem
                {
                    Type = "info",
                    Title = "Cải thiện văn phong",
                    Text = "Nên bổ sung thêm một số thuật ngữ lý thuyết và phân tích chuyên môn của đề tài."
                });
            }

            return result;
        }

        #region Prompt Helpers & Simulation Engine

        private string GetPreFilterSystemPrompt(string prompt)
        {
            return $"Analyze this user input prompt for violent words, threats, hate speech, or abuse.\n" +
                   $"Also, check if they are requesting actions we can handle:\n" +
                   $"- Creating a post (FunctionName: 'CreatePostCommand', arguments: 'content', 'title')\n" +
                   $"- Sending an email or notification (FunctionName: 'SendNotificationCommand', arguments: 'recipient', 'message', 'type')\n" +
                   $"- Searching or selecting a thesis (FunctionName: 'SearchThesisCommand', arguments: 'query')\n\n" +
                   $"User prompt: \"{prompt}\"\n\n" +
                   $"Format your response EXACTLY as a JSON object matching this schema:\n" +
                   $"{{\n" +
                   $"  \"isViolent\": false,\n" +
                   $"  \"violationReason\": null,\n" +
                   $"  \"requestFunctionCall\": true,\n" +
                   $"  \"functionName\": \"SearchThesisCommand\",\n" +
                   $"  \"functionArguments\": {{\n" +
                   $"     \"query\": \"Example search term or thesis title\"\n" +
                   $"  }}\n" +
                   $"}}";
        }

        private PreFilterResult SimulatePreFilter(string prompt)
        {
            var lower = prompt.ToLowerInvariant();

            if (lower.Contains("luyện tập") || lower.Contains("luyen tap") || lower.Contains("tập viết") || lower.Contains("tap viet") || lower.Contains("practice") || lower.Contains("soạn thảo") || lower.Contains("soan thao"))
            {
                return new PreFilterResult
                {
                    IsViolent = false,
                    RequestFunctionCall = false
                };
            }

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
            else if (lower.Contains("search") || lower.Contains("find") || lower.Contains("thesis") || lower.Contains("đề tài") || 
                     lower.Contains("khóa luận") || lower.Contains("đồ án") || lower.Contains("chọn") || lower.Contains("kiếm") || 
                     lower.Contains("tìm"))
            {
                var query = prompt;
                var prefixes = new[] { "chọn thesis", "chọn đề tài", "chọn khoa luận", "chọn đồ án", "tìm kiếm đề tài", "tìm kiếm", "tìm đề tài", "tìm", "kiếm", "search for", "search", "find" };
                foreach (var prefix in prefixes)
                {
                    var idx = lower.IndexOf(prefix);
                    if (idx >= 0)
                    {
                        var potentialQuery = prompt.Substring(idx + prefix.Length).Trim();
                        if (!string.IsNullOrEmpty(potentialQuery))
                        {
                            query = potentialQuery;
                            break;
                        }
                    }
                }

                return new PreFilterResult
                {
                    IsViolent = false,
                    RequestFunctionCall = true,
                    FunctionName = "SearchThesisCommand",
                    FunctionArguments = new Dictionary<string, string>
                    {
                        { "query", query }
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

        private bool ContainsWord(string text, string word)
        {
            if (string.IsNullOrEmpty(text) || string.IsNullOrEmpty(word)) return false;
            var lowerText = text.ToLowerInvariant();
            var lowerWord = word.ToLowerInvariant();
            
            int index = 0;
            while ((index = lowerText.IndexOf(lowerWord, index)) != -1)
            {
                bool startOk = index == 0 || !char.IsLetterOrDigit(lowerText[index - 1]);
                bool endOk = index + lowerWord.Length == lowerText.Length || !char.IsLetterOrDigit(lowerText[index + lowerWord.Length]);
                
                if (startOk && endOk) return true;
                index += lowerWord.Length;
            }
            return false;
        }

        private bool ContainsAnyWord(string text, params string[] words)
        {
            if (string.IsNullOrEmpty(text)) return false;
            foreach (var word in words)
            {
                if (ContainsWord(text, word)) return true;
            }
            return false;
        }

        #endregion
    }
}
