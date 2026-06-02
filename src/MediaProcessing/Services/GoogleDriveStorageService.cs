using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MediaProcessing.Services
{
    public enum AcademicCategory
    {
        Project, // Đồ án
        Topic,   // Chuyên đề
        Thesis   // Khóa luận
    }

    public interface IGoogleDriveStorageService
    {
        Task<GoogleDriveUploadResult> UploadAcademicPdfAsync(
            string fileName, 
            byte[] fileBytes, 
            AcademicCategory category, 
            string academicSubjectOrMajor, 
            string topicName);
    }

    public class GoogleDriveStorageService : IGoogleDriveStorageService
    {
        private readonly ILogger<GoogleDriveStorageService> _logger;
        
        // 3 Google Drive client credentials (API Keys or Client Secrets)
        private readonly string? _driveKey1_Project; // For Projects (Đồ án)
        private readonly string? _driveKey2_Topic;   // For Topics (Chuyên đề)
        private readonly string? _driveKey3_Thesis;  // For Theses (Khóa luận)
        
        private readonly bool _useMock;

        public GoogleDriveStorageService(IConfiguration configuration, ILogger<GoogleDriveStorageService> logger)
        {
            _logger = logger;
            
            // Read 3 independent Drive client configs
            _driveKey1_Project = configuration["GoogleDrive:DriveKey1_Project"];
            _driveKey2_Topic = configuration["GoogleDrive:DriveKey2_Topic"];
            _driveKey3_Thesis = configuration["GoogleDrive:DriveKey3_Thesis"];
            
            // Runs mock if credentials are blank
            _useMock = string.IsNullOrEmpty(_driveKey1_Project) || 
                       string.IsNullOrEmpty(_driveKey2_Topic) || 
                       string.IsNullOrEmpty(_driveKey3_Thesis) || 
                       configuration.GetValue<bool>("GoogleDrive:UseMock", true);

            if (_useMock)
            {
                _logger.LogWarning("One or more of the 3 Google Drive API keys are missing. Running in Simulated Academic Drive mode.");
            }
        }

        public async Task<GoogleDriveUploadResult> UploadAcademicPdfAsync(
            string fileName, 
            byte[] fileBytes, 
            AcademicCategory category, 
            string academicSubjectOrMajor, 
            string topicName)
        {
            var uniqueGuid = Guid.NewGuid().ToString("N").Substring(0, 10);
            string activeDriveKey = string.Empty;
            string parentFolderName = string.Empty; // Môn học or Chuyên ngành
            string documentFolderName = $"{topicName} - {uniqueGuid}"; // Tên đề tài - GUID
            
            // 1. Identify Drive client key and folder parameters
            switch (category)
            {
                case AcademicCategory.Project:
                    activeDriveKey = _driveKey1_Project ?? "DRIVE_KEY_1_MOCK";
                    parentFolderName = academicSubjectOrMajor; // Tên môn học
                    _logger.LogInformation("GoogleDrive [Drive 1 - Đồ án]: Upload triggered using Key: '{Key}'", activeDriveKey);
                    break;
                case AcademicCategory.Topic:
                    activeDriveKey = _driveKey2_Topic ?? "DRIVE_KEY_2_MOCK";
                    parentFolderName = academicSubjectOrMajor; // Tên chuyên ngành
                    _logger.LogInformation("GoogleDrive [Drive 2 - Chuyên đề]: Upload triggered using Key: '{Key}'", activeDriveKey);
                    break;
                case AcademicCategory.Thesis:
                    activeDriveKey = _driveKey3_Thesis ?? "DRIVE_KEY_3_MOCK";
                    parentFolderName = academicSubjectOrMajor; // Tên chuyên ngành
                    _logger.LogInformation("GoogleDrive [Drive 3 - Khóa luận]: Upload triggered using Key: '{Key}'", activeDriveKey);
                    break;
            }

            // 2. Perform Folder Creation and Upload Simulation
            _logger.LogInformation("GoogleDrive: Verifying/Creating Parent Folder structure: '{Parent}' in Drive...", parentFolderName);
            await Task.Delay(200); // Simulate folder query latency
            
            _logger.LogInformation("GoogleDrive: Verifying/Creating Sub-Folder structure: '{Parent}/{Sub}'...", parentFolderName, documentFolderName);
            await Task.Delay(200); // Simulate nested directory creation
            
            _logger.LogInformation("GoogleDrive: Uploading academic file '{File}' ({Size} bytes) into path '{Parent}/{Sub}/{File}'...", 
                fileName, fileBytes.Length, parentFolderName, documentFolderName);

            if (_useMock)
            {
                await Task.Delay(500); // Simulate network upload
                
                var secureWebUrl = $"https://drive.google.com/drive/folders/{Guid.NewGuid():N}";
                
                _logger.LogInformation("GoogleDrive SUCCESS: File archived. Shareable URL: {Url}", secureWebUrl);
                
                return new GoogleDriveUploadResult
                {
                    Success = true,
                    DriveName = $"Drive-{category}",
                    ParentFolder = parentFolderName,
                    SubFolder = documentFolderName,
                    SharedWebUrl = secureWebUrl,
                    BytesUploaded = fileBytes.Length
                };
            }

            try
            {
                // Real Google Drive API SDK integration:
                // var service = AuthenticateDriveClient(activeDriveKey);
                // var parentId = GetOrCreateFolder(service, parentFolderName, null);
                // var subId = GetOrCreateFolder(service, documentFolderName, parentId);
                // UploadFile(service, fileName, fileBytes, subId);
                // ...
                return new GoogleDriveUploadResult { Success = false };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed uploading document to Google Drive storage pools.");
                return new GoogleDriveUploadResult { Success = false, ErrorMessage = ex.Message };
            }
        }
    }

    public class GoogleDriveUploadResult
    {
        public bool Success { get; set; }
        public string DriveName { get; set; } = string.Empty;
        public string ParentFolder { get; set; } = string.Empty;
        public string SubFolder { get; set; } = string.Empty;
        public string SharedWebUrl { get; set; } = string.Empty;
        public long BytesUploaded { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
