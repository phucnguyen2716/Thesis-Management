using System;
using System.IO;
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
        private readonly string _apiSecret;
        private bool _useMock;
        private readonly CloudinaryDotNet.Cloudinary? _cloudinaryClient;

        public CloudinaryService(IConfiguration configuration, ILogger<CloudinaryService> logger)
        {
            _logger = logger;
            _apiKey = configuration["Cloudinary:ApiKey"] ?? "944838729127146";
            _cloudName = configuration["Cloudinary:CloudName"] ?? "uef_social_media";
            _apiSecret = configuration["Cloudinary:ApiSecret"] ?? "";
            
            // Runs mock if cloudName is default or explicit mock setting is active
            _useMock = string.IsNullOrEmpty(_apiKey) || string.IsNullOrEmpty(_apiSecret) || configuration.GetValue<bool>("Cloudinary:UseMock", true);

            if (!_useMock)
            {
                try
                {
                    var account = new CloudinaryDotNet.Account(_cloudName, _apiKey, _apiSecret);
                    _cloudinaryClient = new CloudinaryDotNet.Cloudinary(account);
                    _logger.LogInformation("Cloudinary Service initialized with real account: '{CloudName}'", _cloudName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to initialize Cloudinary client. Falling back to Mock.");
                    _useMock = true;
                }
            }
            else
            {
                _logger.LogInformation("Cloudinary Service initialized in Mock mode. API Key: '{Key}'", _apiKey);
            }
        }

        public async Task<CloudinaryUploadResult> UploadImageAsync(string fileName, byte[] fileBytes)
        {
            var uniqueGuid = Guid.NewGuid().ToString("D");
            // Secure path folder grouping: GUID -> image name
            var secureFolder = $"social_app/images/{uniqueGuid}";
            
            _logger.LogInformation("Cloudinary: Compressing and uploading '{File}' into secure cloud path: '{Path}'", fileName, secureFolder);

            if (_useMock || _cloudinaryClient == null)
            {
                await Task.Delay(400); // Simulate upload latency
                
                var secureUrl = $"https://res.cloudinary.com/{_cloudName}/image/upload/v171732/{secureFolder}/{fileName}";
                
                _logger.LogInformation("Cloudinary SUCCESS: Image uploaded (Mock). Secure URL generated: {Url}", secureUrl);
                
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
                using var memoryStream = new MemoryStream(fileBytes);
                var uploadParams = new CloudinaryDotNet.Actions.ImageUploadParams()
                {
                    File = new CloudinaryDotNet.FileDescription(fileName, memoryStream),
                    Folder = secureFolder,
                    PublicId = Path.GetFileNameWithoutExtension(fileName),
                    UseFilename = true,
                    UniqueFilename = true,
                    Transformation = new CloudinaryDotNet.Transformation().Quality("auto").FetchFormat("auto")
                };

                var uploadResult = await _cloudinaryClient.UploadAsync(uploadParams);
                
                if (uploadResult.StatusCode == System.Net.HttpStatusCode.OK)
                {
                    _logger.LogInformation("Cloudinary SUCCESS: Image uploaded (Real). Secure URL: {Url}", uploadResult.SecureUrl);
                    return new CloudinaryUploadResult
                    {
                        Success = true,
                        SecureUrl = uploadResult.SecureUrl?.ToString() ?? string.Empty,
                        PublicId = uploadResult.PublicId,
                        Format = uploadResult.Format,
                        Bytes = uploadResult.Bytes
                    };
                }
                else
                {
                    _logger.LogError("Cloudinary upload failed with status code: {Status}. Error: {Error}", uploadResult.StatusCode, uploadResult.Error?.Message);
                    return new CloudinaryUploadResult
                    {
                        Success = false,
                        ErrorMessage = uploadResult.Error?.Message ?? $"Cloudinary status code: {uploadResult.StatusCode}"
                    };
                }
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
