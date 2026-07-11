using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PlatformAdmin.Interfaces;
using PlatformAdmin.Attributes;
using PlatformAdmin.DTOs.Admin;

namespace PlatformAdmin.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("users")]
        [ApiResponse(typeof(IEnumerable<AdminUserDto>), StatusCodes.Status200OK)]
        [ApiResponse(StatusCodes.Status401Unauthorized)]
        [ApiResponse(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsers()
        {
            var users = await _adminService.GetUsersAsync();
            return Ok(users);
        }

        [HttpPost("users")]
        [ApiResponse(typeof(AdminUserDto), StatusCodes.Status201Created)]
        [ApiResponse(StatusCodes.Status400BadRequest)]
        [ApiResponse(StatusCodes.Status401Unauthorized)]
        [ApiResponse(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<AdminUserDto>> CreateUser([FromBody] CreateAdminUserRequest request)
        {
            var user = await _adminService.CreateUserAsync(request);
            if (user == null)
            {
                return BadRequest(new { message = "Email đã tồn tại trên hệ thống." });
            }

            return CreatedAtAction(nameof(GetUsers), user);
        }

        [HttpPut("users/{id}")]
        [ApiResponse(StatusCodes.Status204NoContent)]
        [ApiResponse(StatusCodes.Status400BadRequest)]
        [ApiResponse(StatusCodes.Status401Unauthorized)]
        [ApiResponse(StatusCodes.Status403Forbidden)]
        [ApiResponse(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateAdminUserRequest request)
        {
            var updated = await _adminService.UpdateUserAsync(id, request);
            if (!updated) return NotFound();
            return NoContent();
        }

        [HttpDelete("users/{id}")]
        [ApiResponse(StatusCodes.Status204NoContent)]
        [ApiResponse(StatusCodes.Status401Unauthorized)]
        [ApiResponse(StatusCodes.Status403Forbidden)]
        [ApiResponse(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var deleted = await _adminService.DeleteUserAsync(id);
            if (!deleted) return NotFound();
            return NoContent();
        }

        [HttpGet("audit-logs")]
        [ApiResponse(typeof(IEnumerable<AdminAuditLogDto>), StatusCodes.Status200OK)]
        [ApiResponse(StatusCodes.Status401Unauthorized)]
        [ApiResponse(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IEnumerable<AdminAuditLogDto>>> GetAuditLogs()
        {
            var logs = await _adminService.GetAuditLogsAsync();
            return Ok(logs);
        }

        [HttpGet("dashboard-stats")]
        [ApiResponse(typeof(AdminDashboardDto), StatusCodes.Status200OK)]
        [ApiResponse(StatusCodes.Status401Unauthorized)]
        [ApiResponse(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<AdminDashboardDto>> GetDashboardStats()
        {
            var stats = await _adminService.GetDashboardStatsAsync();
            return Ok(stats);
        }
    }
}
