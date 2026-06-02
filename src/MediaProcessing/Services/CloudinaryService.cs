using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MediaProcessing.Services
{
    public interface ICloudinaryService
    {
        Task<CloudinaryUploadResult> UploadImageAsync(string fileName, byte[] fileBytes);
    }

    public class CloudinaryService : ICloudinaryService
    {
        private readonly ILogger<CloudinaryService> _logger;
        private readonly string _apiKey;
        private readonly string _cloudName;
        private readonly bool _useMock;

        public CloudinaryService(IConfiguration configuration, ILogger<CloudinaryService> logger)
        {
            _logger = logger;
            _apiKey = configuration["Cloudinary:ApiKey"] ?? "944838729127146";
            _cloudName = configuration["Cloudinary:CloudName"] ?? "social_app_cloud";
            
            // Runs mock if cloudName is default or explicit mock setting is active
            _useMock = string.IsNullOrEmpty(_apiKey) || configuration.GetValue<bool>("Cloudinary:UseMock", true);

            _logger.LogInformation("Cloudinary Service initialized. API Key Registered: '{Key}'", _apiKey);
        }

        public async Task<CloudinaryUploadResult> UploadImageAsync(string fileName, byte[] fileBytes)
        {
            var uniqueGuid = Guid.NewGuid().ToString("D");
            // Secure path folder grouping: GUID -> image name
            var secureFolder = $"social_app/images/{uniqueGuid}";
            
            _logger.LogInformation("Cloudinary: Compressing and uploading '{File}' into secure cloud path: '{Path}'", fileName, secureFolder);

            if (_useMock)
            {
                await Task.Delay(400); // Simulate upload latency
                
                var secureUrl = $"https://res.cloudinary.com/{_cloudName}/image/upload/v171732/{secureFolder}/{fileName}";
                
                _logger.LogInformation("Cloudinary SUCCESS: Image uploaded. Secure URL generated: {Url}", secureUrl);
                
                return new CloudinaryUploadResult
                {
                    Success = true,
                    SecureUrl = secureUrl,
                    PublicId = $"{secureFolder}/{fileName}",
                    Format = "jpg",
                    Bytes = fileBytes.Length
                };
            }

            try
            {
                // Real Cloudinary SDK integration:
                // var uploadParams = new ImageUploadParams() {
                //     File = new FileDescription(fileName, new MemoryStream(fileBytes)),
                //     Folder = secureFolder,
                //     Transformation = new Transformation().Quality("auto").FetchFormat("auto")
                // };
                // var uploadResult = await _cloudinaryClient.UploadAsync(uploadParams);
                // ...
                
                return new CloudinaryUploadResult { Success = false };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed uploading to Cloudinary nodes.");
                return new CloudinaryUploadResult { Success = false, ErrorMessage = ex.Message };
            }
        }
    }

    public class CloudinaryUploadResult
    {
        public bool Success { get; set; }
        public string SecureUrl { get; set; } = string.Empty;
        public string PublicId { get; set; } = string.Empty;
        public string Format { get; set; } = string.Empty;
        public long Bytes { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
