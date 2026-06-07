using PlatformAdmin.DTOs.Thesis;

namespace PlatformAdmin.Interfaces;

public interface IThesisService
{
    Task<ThesisListResponse> GetAllAsync(int page, int pageSize, string? status, string? search, int? studentId, int? advisorId, string? category = null);
    Task<ThesisDto?> GetByIdAsync(int id);
    Task<ThesisDto> CreateAsync(int studentId, CreateThesisRequest request);
    Task<ThesisDto> UpdateAsync(int id, UpdateThesisRequest request);
    Task DeleteAsync(int id);
    Task<ThesisDto> SubmitAsync(int id);
    Task<ThesisDto> AssignAdvisorAsync(int id, AssignAdvisorRequest request);
    Task<ThesisDto> ApproveAsync(int id);
    Task<ThesisDto> RejectAsync(int id, string reason);
    Task<ThesisDto> SetRevisionAsync(int id);
    Task<string> UploadFileAsync(int id, Stream fileStream, string fileName, string contentType);
    Task<ThesisStatsDto> GetStatsAsync();
    Task SyncDriveFoldersAsync(string category);
}
