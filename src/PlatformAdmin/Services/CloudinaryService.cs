using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace PlatformAdmin.Services
{
    public interface ICloudinaryService
    {
        Task<CloudinaryUploadResult> UploadImageAsync(string fileName, byte[] fileBytes);
        Task<CloudinaryUploadResult> UploadImageFromUrlAsync(string imageUrl);
    }

    public class CloudinaryService : ICloudinaryService
    {
        private readonly ILogger<CloudinaryService> _logger;
        private readonly string _apiKey;
        private readonly string _cloudName;
        private readonly string _apiSecret;
        private bool _useMock;
        private readonly CloudinaryDotNet.Cloudinary? _cloudinaryClient;
        private readonly HttpClient _httpClient;

        public CloudinaryService(IConfiguration configuration, ILogger<CloudinaryService> logger, HttpClient httpClient)
        {
            _logger = logger;
            _httpClient = httpClient;
            _apiKey = configuration["Cloudinary:ApiKey"] ?? "944838729127146";
            _cloudName = configuration["Cloudinary:CloudName"] ?? "uef_social_media";
            _apiSecret = configuration["Cloudinary:ApiSecret"] ?? "";
            
            _useMock = string.IsNullOrEmpty(_apiKey) || string.IsNullOrEmpty(_apiSecret) || configuration.GetValue<bool>("Cloudinary:UseMock", true);

            if (!_useMock)
            {
                try
                {
                    var account = new CloudinaryDotNet.Account(_cloudName, _apiKey, _apiSecret);
                    _cloudinaryClient = new CloudinaryDotNet.Cloudinary(account);
                    _logger.LogInformation("PlatformAdmin Cloudinary Service initialized with real account: '{CloudName}'", _cloudName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "PlatformAdmin failed to initialize Cloudinary client. Falling back to Mock.");
                    _useMock = true;
                }
            }
            else
            {
                _logger.LogInformation("PlatformAdmin Cloudinary Service initialized in Mock mode. API Key: '{Key}'", _apiKey);
            }
        }

        public async Task<CloudinaryUploadResult> UploadImageAsync(string fileName, byte[] fileBytes)
        {
            var uniqueGuid = Guid.NewGuid().ToString("D");
            var secureFolder = $"social_media/posts/{uniqueGuid}";
            
            _logger.LogInformation("PlatformAdmin Cloudinary: Uploading byte stream '{File}' to path: '{Path}'", fileName, secureFolder);

            if (_useMock || _cloudinaryClient == null)
            {
                await Task.Delay(400); // Simulate upload latency
                var secureUrl = $"https://res.cloudinary.com/{_cloudName}/image/upload/v171732/{secureFolder}/{fileName}";
                _logger.LogInformation("PlatformAdmin Cloudinary SUCCESS (Mock): Secure URL: {Url}", secureUrl);
                
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
                    _logger.LogInformation("PlatformAdmin Cloudinary SUCCESS (Real): Secure URL: {Url}", uploadResult.SecureUrl);
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
                    _logger.LogError("PlatformAdmin Cloudinary upload failed status: {Status}. Msg: {Error}", uploadResult.StatusCode, uploadResult.Error?.Message);
                    return new CloudinaryUploadResult
                    {
                        Success = false,
                        ErrorMessage = uploadResult.Error?.Message ?? $"Cloudinary status code: {uploadResult.StatusCode}"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PlatformAdmin failed uploading to Cloudinary.");
                return new CloudinaryUploadResult { Success = false, ErrorMessage = ex.Message };
            }
        }

        public async Task<CloudinaryUploadResult> UploadImageFromUrlAsync(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl))
            {
                return new CloudinaryUploadResult { Success = false, ErrorMessage = "Image URL is empty." };
            }

            // If it's already a Cloudinary URL, don't re-upload
            if (imageUrl.Contains("res.cloudinary.com"))
            {
                return new CloudinaryUploadResult
                {
                    Success = true,
                    SecureUrl = imageUrl,
                    PublicId = "already-cloudinary",
                    Format = "image"
                };
            }

            try
            {
                byte[] fileBytes;
                string fileName = "image.jpg";

                if (imageUrl.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                {
                    // Handle Base64 Data URL
                    var commaIndex = imageUrl.IndexOf(',');
                    if (commaIndex == -1)
                    {
                        return new CloudinaryUploadResult { Success = false, ErrorMessage = "Invalid base64 image data." };
                    }

                    var base64Part = imageUrl.Substring(commaIndex + 1);
                    fileBytes = Convert.FromBase64String(base64Part);

                    // Infer extension
                    var mimeType = imageUrl.Substring(5, commaIndex - 5);
                    if (mimeType.Contains(';'))
                    {
                        mimeType = mimeType.Substring(0, mimeType.IndexOf(';'));
                    }
                    var ext = mimeType.Split('/')[1];
                    fileName = $"upload_{Guid.NewGuid().ToString("N").Substring(0, 8)}.{ext}";
                }
                else
                {
                    // Handle standard HTTP URL
                    fileBytes = await _httpClient.GetByteArrayAsync(imageUrl);
                    try
                    {
                        var uri = new Uri(imageUrl);
                        fileName = Path.GetFileName(uri.LocalPath);
                        if (string.IsNullOrEmpty(fileName) || !fileName.Contains('.'))
                        {
                            fileName = "image.jpg";
                        }
                    }
                    catch
                    {
                        fileName = "image.jpg";
                    }
                }

                return await UploadImageAsync(fileName, fileBytes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to download and upload image from URL '{Url}'", imageUrl);
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
