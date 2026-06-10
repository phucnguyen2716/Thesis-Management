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
            string? major = null,
            string? documentFolderName = null);

        Task<string> GetOrCreateSubjectFolderAsync(
            AcademicCategory category, 
            string major, 
            string subject, 
            string subjectCode);

        Task<List<DriveFileInfo>> ListFilesFromFolderAsync(string folderName, AcademicCategory category);
        Task<List<DriveFileInfo>> ListCourseProjectFilesRecursiveAsync();
        Task<byte[]?> DownloadFileAsync(string fileId, AcademicCategory category);
        Task<DriveFileInfo?> UploadFileToFolderAsync(string folderName, string fileName, byte[] content, string mimeType, AcademicCategory category);
        Task<int> CountFilesInCourseProjectStorageAsync();
        Task EnsureTemporaryPdfFolderAsync();
        Task DeleteFolderAsync(string folderName, AcademicCategory category);
    }

    public class DriveFileInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string MimeType { get; set; } = string.Empty;
        public long? Size { get; set; }
        public string WebViewLink { get; set; } = string.Empty;
        public string WebContentLink { get; set; } = string.Empty;
        public DateTime? CreatedTime { get; set; }
        public DateTime? ModifiedTime { get; set; }
        public string RelativePath { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string MajorKey { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string SubjectCode { get; set; } = string.Empty;
        public string StudentUid { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
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

        private DriveService GetDriveService(AcademicCategory category)
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

            DriveService service;
            if (activeDriveKey.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
            {
                string credPath = Path.Combine(AppContext.BaseDirectory, activeDriveKey);
                if (!File.Exists(credPath)) credPath = Path.Combine(Directory.GetCurrentDirectory(), activeDriveKey);
                if (!File.Exists(credPath))
                {
                    string? dir = AppContext.BaseDirectory;
                    while (dir != null)
                    {
                        string checkPath = Path.Combine(dir, activeDriveKey);
                        if (File.Exists(checkPath)) { credPath = checkPath; break; }
                        dir = Path.GetDirectoryName(dir);
                    }
                }
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
                service = new DriveService(new BaseClientService.Initializer()
                {
                    ApiKey = activeDriveKey,
                    ApplicationName = "Thesis-Management"
                });
            }
            return service;
        }

        public async Task DeleteFolderAsync(string folderName, AcademicCategory category)
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

            bool categoryUseMock = _useMockConfig || string.IsNullOrEmpty(activeDriveKey);

            if (categoryUseMock)
            {
                _logger.LogInformation("GoogleDrive MOCK: Delete folder '{Folder}' for category {Category}", folderName, category);
                return;
            }

            try
            {
                var service = GetDriveService(category);
                
                // Find the folder first
                var listReq = service.Files.List();
                listReq.SupportsAllDrives = true;
                listReq.IncludeItemsFromAllDrives = true;
                listReq.Q = $"mimeType = 'application/vnd.google-apps.folder' and name = '{folderName}' and trashed = false";
                listReq.Fields = "files(id, name)";
                var res = await listReq.ExecuteAsync();
                var folder = res.Files?.FirstOrDefault();
                
                if (folder != null)
                {
                    var deleteReq = service.Files.Delete(folder.Id);
                    deleteReq.SupportsAllDrives = true;
                    await deleteReq.ExecuteAsync();
                    _logger.LogInformation("GoogleDrive SUCCESS: Folder '{Folder}' (ID: {Id}) deleted.", folderName, folder.Id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GoogleDrive: Failed to delete folder '{Folder}'", folderName);
            }
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
            createRequest.SupportsAllDrives = true;
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
            string? major = null,
            string? documentFolderName = null)
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

            bool categoryUseMock = _useMockConfig || string.IsNullOrEmpty(activeDriveKey);

            string majorName = string.IsNullOrEmpty(major) ? "Chuyên ngành" : major;
            string pCode = string.IsNullOrEmpty(subjectCode) ? "UnknownCode" : subjectCode;
            
            string parentFolderName = category == AcademicCategory.Project 
                ? $"{academicSubjectOrMajor} ({pCode})" 
                : academicSubjectOrMajor;

            string pUid = string.IsNullOrEmpty(uid) ? "UnknownUid" : uid;
            string pName = string.IsNullOrEmpty(projectName) ? topicName : projectName;
            string groupFolderName = !string.IsNullOrEmpty(documentFolderName)
                ? documentFolderName
                : category == AcademicCategory.Project
                    ? $"{DrivePathParser.SanitizeFolderName(pName)}_{pUid}"
                    : $"{topicName} - {Guid.NewGuid().ToString("N")[..10]}";

            if (categoryUseMock)
            {
                _logger.LogWarning("Running in Simulated Academic Drive mode for category: {Category}.", category);
                
                string mockDriveRoot = Path.Combine(Directory.GetCurrentDirectory(), "mock_google_drive");
                string destFolder;
                if (category == AcademicCategory.Project)
                {
                    destFolder = Path.Combine(mockDriveRoot, "CourseProjectStorage", majorName, parentFolderName, groupFolderName);
                    _logger.LogInformation("GoogleDrive [Mock]: Saving file '{File}' to simulated path 'CourseProjectStorage/{Major}/{Parent}/{Sub}'", fileName, majorName, parentFolderName, groupFolderName);
                }
                else
                {
                    destFolder = Path.Combine(mockDriveRoot, category.ToString(), parentFolderName, groupFolderName);
                    _logger.LogInformation("GoogleDrive [Mock]: Saving file '{File}' to simulated path '{Category}/{Parent}/{Sub}'", fileName, category, parentFolderName, groupFolderName);
                }

                try
                {
                    Directory.CreateDirectory(destFolder);
                    string destPath = Path.Combine(destFolder, fileName);
                    await File.WriteAllBytesAsync(destPath, fileBytes);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "GoogleDrive [Mock]: Failed to write mock file to disk.");
                }

                await Task.Delay(50); // Simulate light network upload
                
                var secureWebUrl = $"https://drive.google.com/drive/folders/{Guid.NewGuid():N}";
                
                _logger.LogInformation("GoogleDrive SUCCESS: File archived locally. Shareable URL: {Url}", secureWebUrl);
                
                return new GoogleDriveUploadResult
                {
                    Success = true,
                    DriveName = $"Drive-{category}",
                    ParentFolder = parentFolderName,
                    SubFolder = groupFolderName,
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
                    targetFolderId = await GetOrCreateFolderAsync(service, groupFolderName, subjectFolderId);
                }
                else
                {
                    string parentId = await GetOrCreateFolderAsync(service, parentFolderName, null);
                    targetFolderId = await GetOrCreateFolderAsync(service, groupFolderName, parentId);
                }

                _logger.LogInformation("GoogleDrive: Uploading academic file '{File}' ({Size} bytes) into path '{Parent}/{Sub}/{FileName}'...", 
                    fileName, fileBytes.Length, parentFolderName, groupFolderName, fileName);

                var fileMetadata = new Google.Apis.Drive.v3.Data.File()
                {
                    Name = fileName,
                    Parents = new List<string> { targetFolderId }
                };

                var uploadMime = fileName.EndsWith(".docx", StringComparison.OrdinalIgnoreCase)
                    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    : fileName.EndsWith(".doc", StringComparison.OrdinalIgnoreCase)
                        ? "application/msword"
                        : fileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase)
                            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            : "application/pdf";


                using (var stream = new MemoryStream(fileBytes))
                {
                    var uploadRequest = service.Files.Create(fileMetadata, stream, uploadMime);
                    uploadRequest.SupportsAllDrives = true;
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
                        SubFolder = groupFolderName,
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

            bool categoryUseMock = _useMockConfig || string.IsNullOrEmpty(activeDriveKey);

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

        public async Task<List<DriveFileInfo>> ListFilesFromFolderAsync(string folderName, AcademicCategory category)
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

            bool categoryUseMock = _useMockConfig || string.IsNullOrEmpty(activeDriveKey);

            if (categoryUseMock)
            {
                _logger.LogWarning("ListFilesFromFolderAsync: Running in mock mode for folder '{Folder}'", folderName);
                // Return sample mock data so the frontend can show something
                return new List<DriveFileInfo>
                {
                    new DriveFileInfo { Id = "mock-1", Name = "Do_An_AI_NhanDienKhuonMat.pdf", MimeType = "application/pdf", Size = 2048000, WebViewLink = "https://drive.google.com/file/d/mock-1/view", WebContentLink = "https://drive.google.com/uc?id=mock-1", CreatedTime = DateTime.UtcNow.AddDays(-30), ModifiedTime = DateTime.UtcNow.AddDays(-5) },
                    new DriveFileInfo { Id = "mock-2", Name = "KhoaLuan_PhanTichDuLieu.pdf", MimeType = "application/pdf", Size = 3500000, WebViewLink = "https://drive.google.com/file/d/mock-2/view", WebContentLink = "https://drive.google.com/uc?id=mock-2", CreatedTime = DateTime.UtcNow.AddDays(-20), ModifiedTime = DateTime.UtcNow.AddDays(-3) },
                    new DriveFileInfo { Id = "mock-3", Name = "ChuyenDe_MachineLearning.pdf", MimeType = "application/pdf", Size = 1500000, WebViewLink = "https://drive.google.com/file/d/mock-3/view", WebContentLink = "https://drive.google.com/uc?id=mock-3", CreatedTime = DateTime.UtcNow.AddDays(-15), ModifiedTime = DateTime.UtcNow.AddDays(-1) },
                };
            }

            try
            {
                DriveService service;
                if (activeDriveKey.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
                {
                    string credPath = Path.Combine(AppContext.BaseDirectory, activeDriveKey);
                    if (!File.Exists(credPath))
                        credPath = Path.Combine(Directory.GetCurrentDirectory(), activeDriveKey);
                    if (!File.Exists(credPath))
                    {
                        string? dir = AppContext.BaseDirectory;
                        while (dir != null)
                        {
                            string checkPath = Path.Combine(dir, activeDriveKey);
                            if (File.Exists(checkPath)) { credPath = checkPath; break; }
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

                // Find the folder by name
                var folderReq = service.Files.List();
                folderReq.SupportsAllDrives = true;
                folderReq.IncludeItemsFromAllDrives = true;
                folderReq.Q = $"mimeType = 'application/vnd.google-apps.folder' and name = '{folderName}' and trashed = false";
                folderReq.Fields = "files(id, name)";
                var folderRes = await folderReq.ExecuteAsync();
                var folder = folderRes.Files?.FirstOrDefault();

                if (folder == null)
                {
                    _logger.LogWarning("ListFilesFromFolderAsync: Folder '{Folder}' not found in Drive.", folderName);
                    return new List<DriveFileInfo>();
                }

                _logger.LogInformation("ListFilesFromFolderAsync: Found folder '{Folder}' with ID: {Id}", folderName, folder.Id);

                // List all files inside the folder
                var result = new List<DriveFileInfo>();
                string? pageToken = null;
                do
                {
                    var listReq = service.Files.List();
                    listReq.SupportsAllDrives = true;
                    listReq.IncludeItemsFromAllDrives = true;
                    listReq.Q = $"'{folder.Id}' in parents and trashed = false";
                    listReq.Fields = "nextPageToken, files(id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime)";
                    listReq.PageSize = 100;
                    if (pageToken != null) listReq.PageToken = pageToken;

                    var listRes = await listReq.ExecuteAsync();
                    if (listRes.Files != null)
                    {
                        foreach (var f in listRes.Files)
                        {
                            result.Add(new DriveFileInfo
                            {
                                Id = f.Id,
                                Name = f.Name,
                                MimeType = f.MimeType ?? "unknown",
                                Size = f.Size,
                                WebViewLink = f.WebViewLink ?? $"https://drive.google.com/file/d/{f.Id}/view",
                                WebContentLink = f.WebContentLink ?? "",
                                CreatedTime = f.CreatedTimeDateTimeOffset?.UtcDateTime,
                                ModifiedTime = f.ModifiedTimeDateTimeOffset?.UtcDateTime
                            });
                        }
                    }
                    pageToken = listRes.NextPageToken;
                } while (pageToken != null);

                _logger.LogInformation("ListFilesFromFolderAsync: Found {Count} files in folder '{Folder}'", result.Count, folderName);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ListFilesFromFolderAsync: Error listing files from folder '{Folder}'", folderName);
                return new List<DriveFileInfo>();
            }
        }

        private string GetMajorKey(string majorName)
        {
            return majorName switch
            {
                "Trí tuệ nhân tạo" => "ai",
                "Mạng máy tính" => "networking",
                "Hệ thống thông tin DN" => "is",
                "An toàn không gian mạng" => "security",
                "Kỹ thuật lập trình" => "programming",
                _ => majorName.ToLowerInvariant()
            };
        }

        private string GetMimeType(string fileName)
        {
            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            return ext switch
            {
                ".pdf" => "application/pdf",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".doc" => "application/msword",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".xls" => "application/vnd.ms-excel",
                ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ".ppt" => "application/vnd.ms-powerpoint",
                _ => "application/octet-stream"
            };
        }

        public async Task<List<DriveFileInfo>> ListCourseProjectFilesRecursiveAsync()
        {
            if (_useMockConfig || string.IsNullOrEmpty(_driveKey1_Project))
            {
                var results = new List<DriveFileInfo>();
                var mockDriveRoot = Path.Combine(Directory.GetCurrentDirectory(), "mock_google_drive", "CourseProjectStorage");
                if (Directory.Exists(mockDriveRoot))
                {
                    var files = Directory.GetFiles(mockDriveRoot, "*.*", SearchOption.AllDirectories);
                    int i = 0;
                    foreach (var file in files)
                    {
                        i++;
                        var fileInfo = new FileInfo(file);
                        var relPath = Path.GetRelativePath(Path.Combine(Directory.GetCurrentDirectory(), "mock_google_drive"), file);
                        relPath = relPath.Replace('\\', '/');

                        var parts = relPath.Split('/');
                        string major = parts.Length > 1 ? parts[1] : "";
                        string subjectWithCode = parts.Length > 2 ? parts[2] : "";
                        string folderName = parts.Length > 3 ? parts[3] : "";
                        string fileName = parts.Length > 4 ? parts[4] : "";

                        string subject = subjectWithCode;
                        string code = "";
                        if (subjectWithCode.Contains('(') && subjectWithCode.Contains(')'))
                        {
                            int idxOpen = subjectWithCode.LastIndexOf('(');
                            int idxClose = subjectWithCode.LastIndexOf(')');
                            subject = subjectWithCode.Substring(0, idxOpen).Trim();
                            code = subjectWithCode.Substring(idxOpen + 1, idxClose - idxOpen - 1).Trim();
                        }

                        string studentUid = "";
                        string projectName = "";
                        if (folderName.Contains('_'))
                        {
                            int lastUnderscore = folderName.LastIndexOf('_');
                            projectName = folderName.Substring(0, lastUnderscore).Replace('_', ' ');
                            studentUid = folderName.Substring(lastUnderscore + 1);
                        }

                        results.Add(new DriveFileInfo
                        {
                            Id = $"mock-{i}",
                            Name = fileInfo.Name,
                            MimeType = GetMimeType(fileInfo.Name),
                            Size = fileInfo.Length,
                            WebViewLink = $"https://drive.google.com/file/d/mock-{i}/view",
                            WebContentLink = $"https://drive.google.com/uc?id=mock-{i}",
                            CreatedTime = fileInfo.CreationTimeUtc,
                            ModifiedTime = fileInfo.LastWriteTimeUtc,
                            RelativePath = relPath,
                            Major = major,
                            MajorKey = GetMajorKey(major),
                            Subject = subject,
                            SubjectCode = code,
                            StudentUid = studentUid,
                            ProjectName = projectName
                        });
                    }
                }

                if (results.Count == 0)
                {
                    return new List<DriveFileInfo>();
                }
                return results;
            }

            try
            {
                var service = await CreateDriveServiceAsync(_driveKey1_Project);
                var rootId = await FindFolderByNameAsync(service, "CourseProjectStorage", null);
                if (rootId == null) return new List<DriveFileInfo>();

                var results = new List<DriveFileInfo>();
                await ListFolderRecursiveAsync(service, rootId, "CourseProjectStorage", results);
                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ListCourseProjectFilesRecursiveAsync failed");
                return new List<DriveFileInfo>();
            }
        }

        public async Task<int> CountFilesInCourseProjectStorageAsync()
        {
            var files = await ListCourseProjectFilesRecursiveAsync();
            return files.Count;
        }

        public async Task EnsureTemporaryPdfFolderAsync()
        {
            if (_useMockConfig || string.IsNullOrEmpty(_driveKey1_Project)) return;
            try
            {
                var service = await CreateDriveServiceAsync(_driveKey1_Project);
                var folderId = await FindFolderByNameAsync(service, "Temporary_PDF", null);
                if (folderId == null)
                    await GetOrCreateFolderAsync(service, "Temporary_PDF", null);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not ensure Temporary_PDF folder on Drive");
            }
        }

        public async Task<byte[]?> DownloadFileAsync(string fileId, AcademicCategory category)
        {
            string activeDriveKey = GetDriveKey(category);
            if (_useMockConfig || string.IsNullOrEmpty(activeDriveKey))
            {
                // In mock mode, we retrieve the file from mock_google_drive
                var files = await ListCourseProjectFilesRecursiveAsync();
                var fileInfo = files.FirstOrDefault(f => f.Id == fileId);
                if (fileInfo != null)
                {
                    string filePath = Path.Combine(Directory.GetCurrentDirectory(), "mock_google_drive", fileInfo.RelativePath);
                    if (File.Exists(filePath))
                    {
                        return await File.ReadAllBytesAsync(filePath);
                    }
                }
                return null;
            }

            try
            {
                var service = await CreateDriveServiceAsync(activeDriveKey);
                using var stream = new MemoryStream();
                var request = service.Files.Get(fileId);
                await request.DownloadAsync(stream);
                return stream.ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DownloadFileAsync failed for {FileId}", fileId);
                return null;
            }
        }

        public async Task<DriveFileInfo?> UploadFileToFolderAsync(string folderName, string fileName, byte[] content, string mimeType, AcademicCategory category)
        {
            string activeDriveKey = GetDriveKey(category);
            if (_useMockConfig || string.IsNullOrEmpty(activeDriveKey))
            {
                var mockDriveRoot = Path.Combine(Directory.GetCurrentDirectory(), "mock_google_drive");
                var destFolder = Path.Combine(mockDriveRoot, folderName);
                try
                {
                    Directory.CreateDirectory(destFolder);
                    File.WriteAllBytes(Path.Combine(destFolder, fileName), content);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to write UploadFileToFolderAsync file to mock drive.");
                }

                return new DriveFileInfo
                {
                    Id = $"mock-{Guid.NewGuid():N}",
                    Name = fileName,
                    MimeType = mimeType,
                    Size = content.Length,
                    WebViewLink = $"https://drive.google.com/file/d/mock/view",
                    CreatedTime = DateTime.UtcNow,
                    ModifiedTime = DateTime.UtcNow,
                    RelativePath = $"{folderName}/{fileName}"
                };
            }

            try
            {
                var service = await CreateDriveServiceAsync(activeDriveKey);
                var folderId = await FindFolderByNameAsync(service, folderName, null)
                    ?? await GetOrCreateFolderAsync(service, folderName, null);

                var fileMetadata = new Google.Apis.Drive.v3.Data.File
                {
                    Name = fileName,
                    Parents = new List<string> { folderId }
                };

                using var stream = new MemoryStream(content);
                var uploadRequest = service.Files.Create(fileMetadata, stream, mimeType);
                uploadRequest.SupportsAllDrives = true;
                uploadRequest.Fields = "id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime";
                var progress = await uploadRequest.UploadAsync();
                if (progress.Status == UploadStatus.Failed)
                    throw progress.Exception ?? new Exception("Upload failed");

                var f = uploadRequest.ResponseBody;
                return new DriveFileInfo
                {
                    Id = f?.Id ?? "",
                    Name = f?.Name ?? fileName,
                    MimeType = f?.MimeType ?? mimeType,
                    Size = f?.Size,
                    WebViewLink = f?.WebViewLink ?? "",
                    WebContentLink = f?.WebContentLink ?? "",
                    CreatedTime = f?.CreatedTimeDateTimeOffset?.UtcDateTime,
                    ModifiedTime = f?.ModifiedTimeDateTimeOffset?.UtcDateTime,
                    RelativePath = $"{folderName}/{fileName}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "UploadFileToFolderAsync failed for {File}", fileName);
                return null;
            }
        }

        private string GetDriveKey(AcademicCategory category) => category switch
        {
            AcademicCategory.Topic => _driveKey2_Topic ?? "",
            AcademicCategory.Thesis => _driveKey3_Thesis ?? "",
            _ => _driveKey1_Project ?? ""
        };

        private async Task<DriveService> CreateDriveServiceAsync(string activeDriveKey)
        {
            if (activeDriveKey.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
            {
                string credPath = ResolveCredentialPath(activeDriveKey);
                GoogleCredential credential = GoogleCredential.FromJson(File.ReadAllText(credPath))
                    .CreateScoped(DriveService.ScopeConstants.DriveFile, DriveService.ScopeConstants.Drive);
                return new DriveService(new BaseClientService.Initializer
                {
                    HttpClientInitializer = credential,
                    ApplicationName = "Thesis-Management"
                });
            }

            return new DriveService(new BaseClientService.Initializer
            {
                ApiKey = activeDriveKey,
                ApplicationName = "Thesis-Management"
            });
        }

        private string ResolveCredentialPath(string activeDriveKey)
        {
            string credPath = Path.Combine(AppContext.BaseDirectory, activeDriveKey);
            if (File.Exists(credPath)) return credPath;
            credPath = Path.Combine(Directory.GetCurrentDirectory(), activeDriveKey);
            if (File.Exists(credPath)) return credPath;
            string? dir = AppContext.BaseDirectory;
            while (dir != null)
            {
                string checkPath = Path.Combine(dir, activeDriveKey);
                if (File.Exists(checkPath)) return checkPath;
                dir = Path.GetDirectoryName(dir);
            }
            throw new FileNotFoundException($"Google credentials not found: {activeDriveKey}");
        }

        private async Task<string?> FindFolderByNameAsync(DriveService service, string folderName, string? parentId)
        {
            var listRequest = service.Files.List();
            listRequest.SupportsAllDrives = true;
            listRequest.IncludeItemsFromAllDrives = true;
            var query = $"mimeType = 'application/vnd.google-apps.folder' and name = '{folderName.Replace("'", "\\'")}' and trashed = false";
            if (!string.IsNullOrEmpty(parentId))
                query += $" and '{parentId}' in parents";
            listRequest.Q = query;
            listRequest.Fields = "files(id, name)";
            var response = await listRequest.ExecuteAsync();
            return response.Files?.FirstOrDefault()?.Id;
        }

        private async Task ListFolderRecursiveAsync(DriveService service, string folderId, string currentPath, List<DriveFileInfo> results)
        {
            string? pageToken = null;
            do
            {
                var listReq = service.Files.List();
                listReq.SupportsAllDrives = true;
                listReq.IncludeItemsFromAllDrives = true;
                listReq.Q = $"'{folderId}' in parents and trashed = false";
                listReq.Fields = "nextPageToken, files(id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime)";
                listReq.PageSize = 100;
                if (pageToken != null) listReq.PageToken = pageToken;

                var listRes = await listReq.ExecuteAsync();
                if (listRes.Files == null) break;

                foreach (var f in listRes.Files)
                {
                    var relPath = $"{currentPath}/{f.Name}";
                    if (f.MimeType == "application/vnd.google-apps.folder")
                    {
                        await ListFolderRecursiveAsync(service, f.Id, relPath, results);
                        continue;
                    }

                    if (f.MimeType == "application/vnd.google-apps.shortcut") continue;

                    var info = new DriveFileInfo
                    {
                        Id = f.Id,
                        Name = f.Name,
                        MimeType = f.MimeType ?? "unknown",
                        Size = f.Size,
                        WebViewLink = f.WebViewLink ?? $"https://drive.google.com/file/d/{f.Id}/view",
                        WebContentLink = f.WebContentLink ?? "",
                        CreatedTime = f.CreatedTimeDateTimeOffset?.UtcDateTime,
                        ModifiedTime = f.ModifiedTimeDateTimeOffset?.UtcDateTime,
                        RelativePath = relPath
                    };

                    var meta = DrivePathParser.ParseCourseProjectPath(relPath);
                    info.Major = meta.Major ?? "";
                    info.MajorKey = meta.MajorKey ?? "";
                    info.Subject = meta.Subject ?? "";
                    info.SubjectCode = meta.SubjectCode ?? "";
                    info.StudentUid = meta.StudentUid ?? "";
                    info.ProjectName = meta.ProjectName ?? "";
                    _logger.LogInformation("🔍 [GoogleDrive] Found file: '{FileName}' at path '{RelativePath}'. Parsed: StudentUid='{StudentUid}', ProjectName='{ProjectName}', MajorKey='{MajorKey}', SubjectCode='{SubjectCode}'", info.Name, info.RelativePath, info.StudentUid, info.ProjectName, info.MajorKey, info.SubjectCode);
                    results.Add(info);
                }

                pageToken = listRes.NextPageToken;
            } while (pageToken != null);
        }

        private static List<DriveFileInfo> BuildMockCourseProjectFiles() =>
            DriveSampleCatalog.BuildMockDriveFiles();
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
