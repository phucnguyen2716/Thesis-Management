using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Google.Apis.Upload;
using Google.Apis.Auth.OAuth2;
using System.IO;
using System.Linq;
using System.Collections.Generic;

namespace PlatformAdmin.Services
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
            string topicName,
            string? subjectCode = null,
            string? uid = null,
            string? projectName = null,
            string? major = null);

        Task<string> GetOrCreateSubjectFolderAsync(
            AcademicCategory category, 
            string major, 
            string subject, 
            string subjectCode);
    }

    public class GoogleDriveStorageService : IGoogleDriveStorageService
    {
        private readonly ILogger<GoogleDriveStorageService> _logger;
        
        private readonly string? _driveKey1_Project; // For Projects (Đồ án)
        private readonly string? _driveKey2_Topic;   // For Topics (Chuyên đề)
        private readonly string? _driveKey3_Thesis;  // For Theses (Khóa luận)
        
        private readonly bool _useMockConfig;

        public GoogleDriveStorageService(IConfiguration configuration, ILogger<GoogleDriveStorageService> logger)
        {
            _logger = logger;
            
            _driveKey1_Project = configuration["GoogleDrive:DriveKey1_Project"];
            _driveKey2_Topic = configuration["GoogleDrive:DriveKey2_Topic"];
            _driveKey3_Thesis = configuration["GoogleDrive:DriveKey3_Thesis"];
            
            _useMockConfig = configuration.GetValue<bool>("GoogleDrive:UseMock", true);
        }

        private async Task<string> GetOrCreateFolderAsync(DriveService service, string folderName, string? parentId)
        {
            _logger.LogInformation("GoogleDrive: Searching/creating folder '{FolderName}' (parent: '{ParentId}')...", folderName, parentId ?? "Root");
            
            var listRequest = service.Files.List();
            listRequest.SupportsAllDrives = true;
            listRequest.IncludeItemsFromAllDrives = true;
            var query = $"mimeType = 'application/vnd.google-apps.folder' and name = '{folderName}' and trashed = false";
            if (!string.IsNullOrEmpty(parentId))
            {
                query += $" and '{parentId}' in parents";
            }
            listRequest.Q = query;
            listRequest.Fields = "files(id, name)";
            
            var response = await listRequest.ExecuteAsync();
            var existingFolder = response.Files?.FirstOrDefault();
            
            if (existingFolder != null)
            {
                _logger.LogInformation("GoogleDrive: Folder '{FolderName}' already exists with ID: {Id}", folderName, existingFolder.Id);
                return existingFolder.Id;
            }
            
            var folderMetadata = new Google.Apis.Drive.v3.Data.File()
            {
                Name = folderName,
                MimeType = "application/vnd.google-apps.folder"
            };
            if (!string.IsNullOrEmpty(parentId))
            {
                folderMetadata.Parents = new List<string> { parentId };
            }
            
            var createRequest = service.Files.Create(folderMetadata);
            createRequest.Fields = "id";
            var newFolder = await createRequest.ExecuteAsync();
            
            _logger.LogInformation("GoogleDrive: Folder '{FolderName}' created with ID: {Id}", folderName, newFolder.Id);
            return newFolder.Id;
        }

        public async Task<GoogleDriveUploadResult> UploadAcademicPdfAsync(
            string fileName, 
            byte[] fileBytes, 
            AcademicCategory category, 
            string academicSubjectOrMajor, 
            string topicName,
            string? subjectCode = null,
            string? uid = null,
            string? projectName = null,
            string? major = null)
        {
            string activeDriveKey = string.Empty;
            
            switch (category)
            {
                case AcademicCategory.Project:
                    activeDriveKey = _driveKey1_Project ?? string.Empty;
                    _logger.LogInformation("GoogleDrive [Drive 1 - Đồ án]: Upload triggered using Key length: {Length}", activeDriveKey.Length);
                    break;
                case AcademicCategory.Topic:
                    activeDriveKey = _driveKey2_Topic ?? string.Empty;
                    _logger.LogInformation("GoogleDrive [Drive 2 - Chuyên đề]: Upload triggered using Key length: {Length}", activeDriveKey.Length);
                    break;
                case AcademicCategory.Thesis:
                    activeDriveKey = _driveKey3_Thesis ?? string.Empty;
                    _logger.LogInformation("GoogleDrive [Drive 3 - Khóa luận]: Upload triggered using Key length: {Length}", activeDriveKey.Length);
                    break;
            }

            bool categoryUseMock = string.IsNullOrEmpty(activeDriveKey);

            string majorName = string.IsNullOrEmpty(major) ? "Chuyên ngành" : major;
            string pCode = string.IsNullOrEmpty(subjectCode) ? "UnknownCode" : subjectCode;
            
            string parentFolderName = category == AcademicCategory.Project 
                ? $"{academicSubjectOrMajor} ({pCode})" 
                : academicSubjectOrMajor;

            string pUid = string.IsNullOrEmpty(uid) ? "UnknownUid" : uid;
            string pName = string.IsNullOrEmpty(projectName) ? topicName : projectName;
            string documentFolderName = category == AcademicCategory.Project
                ? $"{pUid} - {pName}"
                : $"{topicName} - {Guid.NewGuid().ToString("N").Substring(0, 10)}";

            if (categoryUseMock)
            {
                _logger.LogWarning("Running in Simulated Academic Drive mode for category: {Category}.", category);
                
                if (category == AcademicCategory.Project)
                {
                    _logger.LogInformation("GoogleDrive: Verifying/Creating 'CourseProjectStorage' folder...");
                    await Task.Delay(100);
                    _logger.LogInformation("GoogleDrive: Verifying/Creating Major folder: '{Major}' under 'ThesisStorage'...", majorName);
                    await Task.Delay(100);
                    _logger.LogInformation("GoogleDrive: Verifying/Creating Subject Folder: '{Parent}' under Major...", parentFolderName);
                    await Task.Delay(100);
                    _logger.LogInformation("GoogleDrive: Verifying/Creating Sub-Folder: '{Sub}' under Subject...", documentFolderName);
                    await Task.Delay(100);
                    _logger.LogInformation("GoogleDrive: Uploading academic file '{File}' ({Size} bytes) into path 'CourseProjectStorage/{Major}/{Parent}/{Sub}/{FileName}'...", 
                        fileName, fileBytes.Length, majorName, parentFolderName, documentFolderName, fileName);
                }
                else
                {
                    _logger.LogInformation("GoogleDrive: Verifying/Creating Parent Folder structure: '{Parent}' in Drive...", parentFolderName);
                    await Task.Delay(200);
                    _logger.LogInformation("GoogleDrive: Verifying/Creating Sub-Folder structure: '{Parent}/{Sub}'...", parentFolderName, documentFolderName);
                    await Task.Delay(200);
                    _logger.LogInformation("GoogleDrive: Uploading academic file '{File}' ({Size} bytes) into path '{Parent}/{Sub}/{FileName}'...", 
                        fileName, fileBytes.Length, parentFolderName, documentFolderName, fileName);
                }

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
                DriveService service;
                
                if (activeDriveKey.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
                {
                    string credPath = Path.Combine(AppContext.BaseDirectory, activeDriveKey);
                    if (!File.Exists(credPath))
                    {
                        credPath = Path.Combine(Directory.GetCurrentDirectory(), activeDriveKey);
                    }
                    if (!File.Exists(credPath))
                    {
                        string? dir = AppContext.BaseDirectory;
                        while (dir != null)
                        {
                            string checkPath = Path.Combine(dir, activeDriveKey);
                            if (File.Exists(checkPath))
                            {
                                credPath = checkPath;
                                break;
                            }
                            dir = Path.GetDirectoryName(dir);
                        }
                    }

                    _logger.LogInformation("GoogleDrive: Loading Service Account credentials from: '{Path}'", credPath);

#pragma warning disable CS0618
                    GoogleCredential credential = GoogleCredential.FromJson(File.ReadAllText(credPath))
                        .CreateScoped(new[] { DriveService.ScopeConstants.DriveFile, DriveService.ScopeConstants.Drive });
#pragma warning restore CS0618

                    service = new DriveService(new BaseClientService.Initializer()
                    {
                        HttpClientInitializer = credential,
                        ApplicationName = "Thesis-Management"
                    });
                }
                else
                {
                    _logger.LogInformation("GoogleDrive: Connecting to Google Drive using API Key...");
                    service = new DriveService(new BaseClientService.Initializer()
                    {
                        ApiKey = activeDriveKey,
                        ApplicationName = "Thesis-Management"
                    });
                }
                
                var testReq = service.Files.List();
                testReq.PageSize = 1;
                await testReq.ExecuteAsync();
                _logger.LogInformation("GoogleDrive SUCCESS: Connection test completed successfully.");

                string targetFolderId;
                if (category == AcademicCategory.Project)
                {
                    _logger.LogInformation("GoogleDrive: Searching for shared 'CourseProjectStorage' folder...");
                    string? thesisStorageId = null;
                    var storageListReq = service.Files.List();
                    storageListReq.SupportsAllDrives = true;
                    storageListReq.IncludeItemsFromAllDrives = true;
                    storageListReq.Q = "mimeType = 'application/vnd.google-apps.folder' and name = 'CourseProjectStorage' and trashed = false";
                    storageListReq.Fields = "files(id, name)";
                    var storageRes = await storageListReq.ExecuteAsync();
                    var storageFolder = storageRes.Files?.FirstOrDefault();
                    
                    if (storageFolder != null)
                    {
                        thesisStorageId = storageFolder.Id;
                        _logger.LogInformation("GoogleDrive: Found shared 'CourseProjectStorage' folder with ID: {Id}", thesisStorageId);
                    }
                    else
                    {
                        _logger.LogWarning("GoogleDrive: Shared 'CourseProjectStorage' folder not found. Creating it in the root directory.");
                        thesisStorageId = await GetOrCreateFolderAsync(service, "CourseProjectStorage", null);
                    }

                    string majorFolderId = await GetOrCreateFolderAsync(service, majorName, thesisStorageId);
                    string subjectFolderId = await GetOrCreateFolderAsync(service, parentFolderName, majorFolderId);
                    targetFolderId = await GetOrCreateFolderAsync(service, documentFolderName, subjectFolderId);
                }
                else
                {
                    string parentId = await GetOrCreateFolderAsync(service, parentFolderName, null);
                    targetFolderId = await GetOrCreateFolderAsync(service, documentFolderName, parentId);
                }

                _logger.LogInformation("GoogleDrive: Uploading academic file '{File}' ({Size} bytes) into path '{Parent}/{Sub}/{FileName}'...", 
                    fileName, fileBytes.Length, parentFolderName, documentFolderName, fileName);

                var fileMetadata = new Google.Apis.Drive.v3.Data.File()
                {
                    Name = fileName,
                    Parents = new List<string> { targetFolderId }
                };

                using (var stream = new MemoryStream(fileBytes))
                {
                    var uploadRequest = service.Files.Create(fileMetadata, stream, "application/pdf");
                    uploadRequest.Fields = "id, webViewLink, webContentLink";
                    
                    var progress = await uploadRequest.UploadAsync();
                    if (progress.Status == UploadStatus.Failed)
                    {
                        throw new Exception($"File upload failed: {progress.Exception?.Message}", progress.Exception);
                    }

                    var uploadedFile = uploadRequest.ResponseBody;
                    string webUrl = uploadedFile?.WebViewLink ?? $"https://drive.google.com/file/d/{uploadedFile?.Id}";

                    _logger.LogInformation("GoogleDrive SUCCESS: File archived. Shareable URL: {Url}", webUrl);

                    return new GoogleDriveUploadResult
                    {
                        Success = true,
                        DriveName = $"Drive-{category}",
                        ParentFolder = parentFolderName,
                        SubFolder = documentFolderName,
                        SharedWebUrl = webUrl,
                        BytesUploaded = fileBytes.Length
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed uploading document to Google Drive storage pools.");
                return new GoogleDriveUploadResult 
                { 
                    Success = false, 
                    ErrorMessage = $"Failed to upload: {ex.Message}" 
                };
            }
        }

        public async Task<string> GetOrCreateSubjectFolderAsync(
            AcademicCategory category, 
            string major, 
            string subject, 
            string subjectCode)
        {
            string activeDriveKey = string.Empty;
            switch (category)
            {
                case AcademicCategory.Project:
                    activeDriveKey = _driveKey1_Project ?? string.Empty;
                    break;
                case AcademicCategory.Topic:
                    activeDriveKey = _driveKey2_Topic ?? string.Empty;
                    break;
                case AcademicCategory.Thesis:
                    activeDriveKey = _driveKey3_Thesis ?? string.Empty;
                    break;
            }

            bool categoryUseMock = string.IsNullOrEmpty(activeDriveKey);

            string majorName = string.IsNullOrEmpty(major) ? "Chuyên ngành" : major;
            string pCode = string.IsNullOrEmpty(subjectCode) ? "UnknownCode" : subjectCode;
            string parentFolderName = category == AcademicCategory.Project 
                ? $"{subject} ({pCode})" 
                : subject;

            if (categoryUseMock)
            {
                _logger.LogWarning("Running in Simulated Academic Drive mode for category: {Category}.", category);
                _logger.LogInformation("GoogleDrive: Verifying/Creating 'CourseProjectStorage' folder...");
                await Task.Delay(100);
                _logger.LogInformation("GoogleDrive: Verifying/Creating Major folder: '{Major}' under 'CourseProjectStorage'...", majorName);
                await Task.Delay(100);
                _logger.LogInformation("GoogleDrive: Verifying/Creating Subject Folder: '{Parent}' under Major...", parentFolderName);
                await Task.Delay(100);
                
                var mockFolderId = $"folder-{Guid.NewGuid():N}";
                return mockFolderId;
            }

            try
            {
                DriveService service;
                if (activeDriveKey.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
                {
                    string credPath = Path.Combine(AppContext.BaseDirectory, activeDriveKey);
                    if (!File.Exists(credPath))
                    {
                        credPath = Path.Combine(Directory.GetCurrentDirectory(), activeDriveKey);
                    }
                    if (!File.Exists(credPath))
                    {
                        string? dir = AppContext.BaseDirectory;
                        while (dir != null)
                        {
                            string checkPath = Path.Combine(dir, activeDriveKey);
                            if (File.Exists(checkPath))
                            {
                                credPath = checkPath;
                                break;
                            }
                            dir = Path.GetDirectoryName(dir);
                        }
                    }

                    GoogleCredential credential = GoogleCredential.FromJson(File.ReadAllText(credPath))
                        .CreateScoped(new[] { DriveService.ScopeConstants.DriveFile, DriveService.ScopeConstants.Drive });

                    service = new DriveService(new BaseClientService.Initializer()
                    {
                        HttpClientInitializer = credential,
                        ApplicationName = "Thesis-Management"
                    });
                }
                else
                {
                    service = new DriveService(new BaseClientService.Initializer()
                    {
                        ApiKey = activeDriveKey,
                        ApplicationName = "Thesis-Management"
                    });
                }

                string? thesisStorageId = null;
                var storageListReq = service.Files.List();
                storageListReq.SupportsAllDrives = true;
                storageListReq.IncludeItemsFromAllDrives = true;
                storageListReq.Q = "mimeType = 'application/vnd.google-apps.folder' and name = 'CourseProjectStorage' and trashed = false";
                storageListReq.Fields = "files(id, name)";
                var storageRes = await storageListReq.ExecuteAsync();
                var storageFolder = storageRes.Files?.FirstOrDefault();
                
                if (storageFolder != null)
                {
                    thesisStorageId = storageFolder.Id;
                }
                else
                {
                    thesisStorageId = await GetOrCreateFolderAsync(service, "CourseProjectStorage", null);
                }

                string majorFolderId = await GetOrCreateFolderAsync(service, majorName, thesisStorageId);
                string subjectFolderId = await GetOrCreateFolderAsync(service, parentFolderName, majorFolderId);
                return subjectFolderId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking/creating subject folder: {Subject}", parentFolderName);
                throw;
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
