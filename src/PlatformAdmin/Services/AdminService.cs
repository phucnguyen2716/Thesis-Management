using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PlatformAdmin.Data;
using PlatformAdmin.Entities;
using PlatformAdmin.Interfaces;
using PlatformAdmin.DTOs.Admin;

namespace PlatformAdmin.Services
{
    public class AdminService : IAdminService
    {
        private readonly AppDbContext _db;

        public AdminService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<AdminUserDto>> GetUsersAsync()
        {
            return await _db.Users
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
        }

        public async Task<AdminUserDto?> CreateUserAsync(CreateAdminUserRequest request)
        {
            if (await _db.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower()))
            {
                return null; // Email already exists
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
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return new AdminUserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                StudentId = user.StudentId,
                Department = user.Department,
                Phone = user.Phone,
                IsActive = user.IsActive
            };
        }

        public async Task<bool> UpdateUserAsync(int id, UpdateAdminUserRequest request)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return false;

            user.FullName = request.FullName;
            user.Email = request.Email;
            user.Role = request.Role;
            user.StudentId = request.StudentId;
            user.Department = request.Department;
            user.Phone = request.Phone;
            user.IsActive = request.IsActive;

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return false;

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<AdminAuditLogDto>> GetAuditLogsAsync()
        {
            return await _db.AuditLogs
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
        }
    }
}
