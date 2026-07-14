using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using PlatformAdmin.Data;
using PlatformAdmin.Entities;
using PlatformAdmin.Attributes;
using PlatformAdmin.Services;
using BuildingBlocks.SharedContracts;
using RabbitMQ.Client;

namespace PlatformAdmin.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlagiarismController : ControllerBase
    {
        private readonly IElasticSearchRepository<PlagiarismDocument> _esRepo;
        private readonly AppDbContext _db;
        private readonly IPlagiarismService _plagiarismService;

        public PlagiarismController(IElasticSearchRepository<PlagiarismDocument> esRepo, AppDbContext db, IPlagiarismService plagiarismService)
        {
            _esRepo = esRepo;
            _db = db;
            _plagiarismService = plagiarismService;
        }

        /// <summary>
        /// Seed mock thesis documents into the generic Elasticsearch index for plagiarism checking.
        /// </summary>
        [HttpPost("seed")]
        [ApiResponse(typeof(object), StatusCodes.Status200OK)]
        public async Task<IActionResult> SeedMockDocuments()
        {
            await SeedMockIndicesAsync();
            return Ok(new { message = "Successfully seeded generic Elasticsearch plagiarism index with 3 reference theses!" });
        }

        /// <summary>
        /// Perform dynamic plagiarism check on a specific thesis submission using the generic Elasticsearch Repository.
        /// </summary>
        [HttpPost("check/{thesisId}")]
        [ApiResponse(typeof(object), StatusCodes.Status202Accepted)]
        [ApiResponse(StatusCodes.Status404NotFound)]
        [ApiResponse(StatusCodes.Status503ServiceUnavailable)]
        public async Task<IActionResult> CheckPlagiarism(int thesisId)
        {
            var thesis = await _db.Theses.FirstOrDefaultAsync(t => t.Id == thesisId);
            if (thesis == null) return NotFound(new { message = "Thesis not found" });

            // Set state to UnderReview
            thesis.Status = "UnderReview";
            thesis.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            // Clear any old reports for this thesis to start clean
            var oldReports = _db.PlagiarismReports.Where(r => r.ThesisId == thesisId);
            _db.PlagiarismReports.RemoveRange(oldReports);
            await _db.SaveChangesAsync();

            string? geminiApiKey = Request.Headers["X-Gemini-API-Key"].ToString();
            if (string.IsNullOrWhiteSpace(geminiApiKey))
            {
                geminiApiKey = null;
            }

            try
            {
                var factory = new ConnectionFactory() { HostName = "localhost" };
                using var connection = factory.CreateConnection();
                using var channel = connection.CreateModel();
                channel.QueueDeclare(queue: "thesis-plagiarism-queue",
                                     durable: true,
                                     exclusive: false,
                                     autoDelete: false,
                                     arguments: null);

                var messageObj = new { ThesisId = thesisId, GeminiApiKey = geminiApiKey };
                var messageBody = JsonSerializer.Serialize(messageObj);
                var body = Encoding.UTF8.GetBytes(messageBody);

                var properties = channel.CreateBasicProperties();
                properties.Persistent = true;

                channel.BasicPublish(exchange: string.Empty,
                                     routingKey: "thesis-plagiarism-queue",
                                     basicProperties: properties,
                                     body: body);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"RabbitMQ publishing failed: {ex.Message}. Falling back to synchronous inline scan...");
                try
                {
                    await _plagiarismService.ProcessPlagiarismCheckAsync(thesisId, geminiApiKey);
                    return Ok(new { queued = false, message = "Plagiarism scan completed synchronously." });
                }
                catch (Exception syncEx)
                {
                    Console.WriteLine($"Synchronous plagiarism check failed: {syncEx.Message}");
                    return StatusCode(StatusCodes.Status500InternalServerError, new { message = $"Plagiarism check failed: {syncEx.Message}" });
                }
            }

            return Accepted(new { queued = true, message = "Plagiarism scan has been queued." });
        }

        /// <summary>
        /// Get the status of an asynchronous plagiarism check and the report if completed.
        /// </summary>
        [HttpGet("status/{thesisId}")]
        [ApiResponse(typeof(object), StatusCodes.Status200OK)]
        [ApiResponse(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetStatus(int thesisId)
        {
            try
            {
                var thesis = await _db.Theses.FirstOrDefaultAsync(t => t.Id == thesisId);
                if (thesis == null) return NotFound(new { message = "Thesis not found" });

                var latestReport = await _db.PlagiarismReports
                    .Where(r => r.ThesisId == thesisId)
                    .OrderByDescending(r => r.CheckedAt)
                    .FirstOrDefaultAsync();

                if (latestReport != null)
                {
                    PlagiarismReport? report = null;
                    if (!string.IsNullOrWhiteSpace(latestReport.ReportJson))
                    {
                        try
                        {
                            report = JsonSerializer.Deserialize<PlagiarismReport>(latestReport.ReportJson, new JsonSerializerOptions
                            {
                                PropertyNameCaseInsensitive = true
                            });
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error deserializing plagiarism report JSON: {ex.Message}");
                        }
                    }

                    if (report == null)
                    {
                        report = new PlagiarismReport
                        {
                            SimilarityPercentage = latestReport.SimilarityPercentage,
                            Sources = new List<PlagiarismSourceDetail>(),
                            Matches = new List<PlagiarismMatchDetail>(),
                            BM25Files = new List<PlagiarismBM25Result>()
                        };
                    }

                    return Ok(new { status = "Completed", report = report });
                }

                if (thesis.Status == "UnderReview")
                {
                    return Ok(new { status = "Pending" });
                }

                return Ok(new { status = "NotStarted" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetStatus: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = ex.Message });
            }
        }

        private async Task SeedMockIndicesAsync()
        {
            var doc1 = new PlagiarismDocument
            {
                Id = "sub-001",
                Title = "Nghiên cứu ứng dụng Trí tuệ nhân tạo (AI) trong giáo dục đại học",
                StudentName = "Nguyễn Văn A",
                Major = "Công nghệ thông tin",
                Abstract = "Đề tài thực hiện khảo sát ứng dụng hệ thống gia sư thông minh (Intelligent Tutoring Systems - ITS) để hỗ trợ quá trình dạy và học tích cực.",
                Content = "Trí tuệ nhân tạo đang thay đổi sâu sắc giáo dục. Cơ chế chấm điểm tự động và các mô hình học sâu hỗ trợ giảng viên UEF."
            };
            var doc2 = new PlagiarismDocument
            {
                Id = "sub-002",
                Title = "Ứng dụng Blockchain trong quản lý và xác thực bảng điểm trực tuyến",
                StudentName = "Trần Thị B",
                Major = "An toàn thông tin",
                Abstract = "Đồ án đề xuất giải pháp phi tập trung dựa trên Smart Contract Ethereum để giải quyết vấn đề gian lận bảng điểm học thuật.",
                Content = "Sổ cái phân tán Blockchain cung cấp tính toàn vẹn dữ liệu. Smart Contract của Ethereum được lập trình bằng Solidity."
            };
            var doc3 = new PlagiarismDocument
            {
                Id = "sub-003",
                Title = "Phân tích sắc thái cảm xúc người dùng về thương hiệu UEF bằng PhoBERT",
                StudentName = "Lê Hoàng C",
                Major = "Khoa học dữ liệu",
                Abstract = "Sử dụng PhoBERT để phân tích 15,000 bài đăng mạng xã hội, phân loại cảm xúc tích cực, tiêu cực và trung lập.",
                Content = "Mô hình xử lý ngôn ngữ tự nhiên PhoBERT tiếng Việt đạt độ chính xác cao. Dữ liệu mạng xã hội dồi dào từ Facebook."
            };

            await _esRepo.IndexDocumentAsync(doc1.Id, doc1, "plagiarism_index");
            await _esRepo.IndexDocumentAsync(doc2.Id, doc2, "plagiarism_index");
            await _esRepo.IndexDocumentAsync(doc3.Id, doc3, "plagiarism_index");
        }
    }

    public class PlagiarismReport
    {
        public int ThesisId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public double SimilarityPercentage { get; set; }
        public DateTime CheckedAt { get; set; }
        public List<PlagiarismSourceDetail> Sources { get; set; } = new();
        public List<PlagiarismMatchDetail> Matches { get; set; } = new();
        public List<PlagiarismBM25Result> BM25Files { get; set; } = new();
        public Dictionary<string, double>? AlgorithmScores { get; set; }
    }

    public class PlagiarismSourceDetail
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public double MatchingPercentage { get; set; }
    }

    public class PlagiarismMatchDetail
    {
        public string Text { get; set; } = string.Empty;
        public string SourceTitle { get; set; } = string.Empty;
        public string SourceStudent { get; set; } = string.Empty;
        public double SimilarityScore { get; set; }
        public string SourceExcerpt { get; set; } = string.Empty;
        public string SourceUrl { get; set; } = string.Empty;
        public List<string> DetectedBy { get; set; } = new();
    }

    public class PlagiarismBM25Result
    {
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string Year { get; set; } = string.Empty;
        public double Bm25Score { get; set; }
        public double Ngram { get; set; }
    }
}
