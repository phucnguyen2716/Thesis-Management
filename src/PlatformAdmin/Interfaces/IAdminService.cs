using System.Collections.Generic;
using System.Threading.Tasks;
using PlatformAdmin.DTOs.Admin;

namespace PlatformAdmin.Interfaces
{
    public interface IAdminService
    {
        Task<IEnumerable<AdminUserDto>> GetUsersAsync();
        Task<AdminUserDto?> CreateUserAsync(CreateAdminUserRequest request);
        Task<bool> UpdateUserAsync(int id, UpdateAdminUserRequest request);
        Task<bool> DeleteUserAsync(int id);
        Task<IEnumerable<AdminAuditLogDto>> GetAuditLogsAsync();
    }
}
