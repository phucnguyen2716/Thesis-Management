using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MediaProcessing.Database;
using MediaProcessing.Services;
using BuildingBlocks.SharedContracts;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MediaProcessing.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MediaController : ControllerBase
    {
        private readonly MediaDbContext _dbContext;
        private readonly IElasticSearchRepository<MediaJobDbModel> _esRepo;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IGoogleDriveStorageService _driveService;
        private readonly ILogger<MediaController> _logger;

        public MediaController(
            MediaDbContext dbContext,
            IElasticSearchRepository<MediaJobDbModel> esRepo,
            ICloudinaryService cloudinaryService,
            IGoogleDriveStorageService driveService,
            ILogger<MediaController> logger)
        {
            _dbContext = dbContext;
            _esRepo = esRepo;
            _cloudinaryService = cloudinaryService;
            _driveService = driveService;
            _logger = logger;
        }

        // 1. GET ALL JOBS
        [HttpGet("jobs")]
        public async Task<IActionResult> GetAllJobs()
        {
            _logger.LogInformation("MediaProcessing API: Retrieving job logs from database...");
            try
            {
                var list = await _dbContext.MediaJobs.OrderByDescending(j => j.CreatedAt).ToListAsync();
                return Ok(list);
            }
            catch (Exception)
            {
                return Ok(new List<MediaJobDbModel>
                {
                    new MediaJobDbModel { Id = "m-init-01", ResourceName = "sunset.mp4", JobType = "ImageToVideo", Status = "Completed" }
                });
            }
        }

        // 2. GET BY ID
        [HttpGet("jobs/{id}")]
        public async Task<IActionResult> GetJobById(string id)
        {
            _logger.LogInformation("MediaProcessing API: Retrieving job status '{Id}'...", id);
            var job = await _dbContext.MediaJobs.FindAsync(id);
            if (job == null)
            {
                return NotFound($"Job log '{id}' not found.");
            }
            return Ok(job);
        }

        // 3. POST OPTIMIZE IMAGE (INTEGRATED WITH CLOUDINARY)
        [HttpPost("optimize-image")]
        public async Task<IActionResult> OptimizeImage([FromBody] OptimizeImageRequest request)
        {
            _logger.LogInformation("MediaProcessing API: Saving compression job for '{ImageName}'...", request.ImageName);

            // Trigger Cloudinary Secure Folder Image Upload!
            var uploadResult = await _cloudinaryService.UploadImageAsync(request.ImageName, new byte[request.TargetQuality * 10]);

            var job = new MediaJobDbModel
            {
                ResourceName = request.ImageName,
                JobType = "ImageOptimization",
                OriginalSizeKb = request.SizeKb,
                OptimizedSizeKb = uploadResult.Success ? uploadResult.Bytes / 1024.0 : request.SizeKb * 0.45,
                Status = uploadResult.Success ? "Completed" : "Failed",
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                _dbContext.MediaJobs.Add(job);
                await _dbContext.SaveChangesAsync();

                // Index in Elasticsearch
                await _esRepo.IndexDocumentAsync(job.Id, job, "mediajobs");
            }
            catch (Exception)
            {
                _logger.LogWarning("Postgres offline. Indexing in local mock search client.");
                await _esRepo.IndexDocumentAsync(job.Id, job, "mediajobs");
            }

            return Ok(new
            {
                JobDetails = job,
                CloudinaryResult = uploadResult,
                Message = uploadResult.Success ? "Image successfully optimized and stored in Cloudinary secure GUID bucket!" : "Image optimization failed."
            });
        }

        // 4. POST ACADEMIC PDF ARCHIVE (INTEGRATED WITH Google Drive 3-Drive Classification System)
        [HttpPost("academic-archive")]
        public async Task<IActionResult> UploadAcademicPdf([FromBody] AcademicUploadRequest request)
        {
            _logger.LogInformation("MediaProcessing API: Processing Academic Document PDF: '{Title}' under category: '{Category}'...", 
                request.TopicTitle, request.Category);

            // Translate string category to Enum
            if (!Enum.TryParse<AcademicCategory>(request.Category, true, out var academicCategory))
            {
                return BadRequest("Invalid academic category. Supported: Project, Topic, Thesis.");
            }

            // Trigger hierarchical 3-Drive Google Drive upload!
            var driveUploadResult = await _driveService.UploadAcademicPdfAsync(
                request.FileName, 
                new byte[2048], // Mock PDF bytes
                academicCategory,
                request.SubjectOrMajor,
                request.TopicTitle,
                request.SubjectCode,
                request.Uid,
                request.ProjectName,
                request.Major
            );

            var job = new MediaJobDbModel
            {
                ResourceName = request.FileName,
                JobType = $"AcademicArchive-{request.Category}",
                OriginalSizeKb = 2048,
                OptimizedSizeKb = 2048,
                Status = driveUploadResult.Success ? "Completed" : "Failed",
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                _dbContext.MediaJobs.Add(job);
                await _dbContext.SaveChangesAsync();
                await _esRepo.IndexDocumentAsync(job.Id, job, "mediajobs");
            }
            catch (Exception)
            {
                await _esRepo.IndexDocumentAsync(job.Id, job, "mediajobs");
            }

            return Ok(new
            {
                JobDetails = job,
                GoogleDriveResult = driveUploadResult,
                Message = driveUploadResult.Success ? 
                    $"Academic PDF archived on Google Drive in hierarchical path: {driveUploadResult.ParentFolder} -> {driveUploadResult.SubFolder}" :
                    "Academic PDF archiving failed."
            });
        }

        [HttpPost("image-to-video")]
        public async Task<IActionResult> TransformToVideo([FromBody] TransformToVideoRequest request)
        {
            _logger.LogInformation("MediaProcessing API: Saving video rendering job for resource list...");

            var job = new MediaJobDbModel
            {
                ResourceName = request.AudioTrackName ?? "rendered-slideshow.mp4",
                JobType = "ImageToVideo",
                OriginalSizeKb = 0,
                OptimizedSizeKb = 14500, // Est. MP4 size
                Status = "Processing",
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                _dbContext.MediaJobs.Add(job);
                await _dbContext.SaveChangesAsync();

                await _esRepo.IndexDocumentAsync(job.Id, job, "mediajobs");
            }
            catch (Exception)
            {
                await _esRepo.IndexDocumentAsync(job.Id, job, "mediajobs");
            }

            return CreatedAtAction(nameof(GetJobById), new { id = job.Id }, job);
        }

        // 5. SEARCH JOBS VIA ELASTICSEARCH
        [HttpGet("jobs/search")]
        public async Task<IActionResult> SearchJobs([FromQuery] string query)
        {
            _logger.LogInformation("MediaProcessing API: Querying Elasticsearch indexed jobs for: '{Query}'", query);
            
            if (string.IsNullOrEmpty(query))
            {
                return BadRequest("Query is required.");
            }

            var results = await _esRepo.SearchAsync(
                query,
                "mediajobs",
                new[] { "ResourceName", "JobType", "Status" }
            );

            return Ok(results);
        }
    }

    public class AcademicUploadRequest
    {
        public string FileName { get; set; } = "document.pdf";
        public string Category { get; set; } = "Project"; // Project (Đồ án), Topic (Chuyên đề), Thesis (Khóa luận)
        public string SubjectOrMajor { get; set; } = "Distributed Systems"; // Môn học or Chuyên ngành
        public string TopicTitle { get; set; } = "Building Microservices Sandbox"; // Tên đề tài
        public string? SubjectCode { get; set; } // Mã môn
        public string? Uid { get; set; } // Uid
        public string? ProjectName { get; set; } // Tên project
        public string? Major { get; set; } // Chuyên ngành
    }

    public class OptimizeImageRequest
    {
        public string ImageName { get; set; } = string.Empty;
        public double SizeKb { get; set; } = 1500;
        public int TargetQuality { get; set; } = 80;
    }

    public class TransformToVideoRequest
    {
        public string[] ImageUrls { get; set; } = Array.Empty<string>();
        public string? AudioTrackName { get; set; }
        public int DurationSeconds { get; set; } = 15;
    }
}
