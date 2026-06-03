using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatformAdmin.Data;
using PlatformAdmin.Entities;

namespace PlatformAdmin.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AdminController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsers()
        {
            var users = await _db.Users
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new AdminUserDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    Role = u.Role,
                    StudentId = u.StudentId,
                    Department = u.Department,
                    Phone = u.Phone,
                    IsActive = u.IsActive
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPost("users")]
        public async Task<ActionResult<AdminUserDto>> CreateUser([FromBody] CreateAdminUserRequest request)
        {
            if (await _db.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower()))
            {
                return BadRequest(new { message = "Email đã tồn tại trên hệ thống." });
            }

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                Role = request.Role,
                StudentId = request.StudentId,
                Department = request.Department,
                Phone = request.Phone,
                IsActive = request.IsActive,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"), // Default password for newly created users
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUsers), new AdminUserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                StudentId = user.StudentId,
                Department = user.Department,
                Phone = user.Phone,
                IsActive = user.IsActive
            });
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateAdminUserRequest request)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.FullName = request.FullName;
            user.Email = request.Email;
            user.Role = request.Role;
            user.StudentId = request.StudentId;
            user.Department = request.Department;
            user.Phone = request.Phone;
            user.IsActive = request.IsActive;

            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("audit-logs")]
        public async Task<ActionResult<IEnumerable<AdminAuditLogDto>>> GetAuditLogs()
        {
            var logs = await _db.AuditLogs
                .OrderByDescending(l => l.CreatedAt)
                .Select(l => new AdminAuditLogDto
                {
                    Id = l.Id,
                    Email = l.Email,
                    Role = l.Role,
                    Success = l.Success,
                    Message = l.Message,
                    UserAgent = l.UserAgent,
                    At = l.CreatedAt
                })
                .ToListAsync();

            return Ok(logs);
        }
    }

    public class AdminUserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? StudentId { get; set; }
        public string? Department { get; set; }
        public string? Phone { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateAdminUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "Student";
        public string? StudentId { get; set; }
        public string? Department { get; set; }
        public string? Phone { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateAdminUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "Student";
        public string? StudentId { get; set; }
        public string? Department { get; set; }
        public string? Phone { get; set; }
        public bool IsActive { get; set; }
    }

    public class AdminAuditLogDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public DateTime At { get; set; }
    }
}
