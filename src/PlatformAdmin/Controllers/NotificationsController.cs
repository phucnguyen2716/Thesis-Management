using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatformAdmin.Data;
using PlatformAdmin.Entities;

namespace PlatformAdmin.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public NotificationsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetMyNotifications()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            {
                return Unauthorized();
            }

            var notifs = await _db.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(30)
                .Select(n => new
                {
                    id = n.Id,
                    title = n.Title,
                    desc = n.Message,
                    isRead = n.IsRead,
                    createdAt = n.CreatedAt,
                    time = FormatTime(n.CreatedAt),
                    icon = GetIconForTitle(n.Title),
                    color = GetColorForTitle(n.Title),
                    bg = GetBgForTitle(n.Title)
                })
                .ToListAsync();

            return Ok(notifs);
        }

        [HttpPost("mark-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            {
                return Unauthorized();
            }

            var unread = await _db.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var n in unread)
            {
                n.IsRead = true;
            }

            await _db.SaveChangesAsync();
            return NoContent();
        }

        private static string FormatTime(DateTime dt)
        {
            var span = DateTime.UtcNow - dt;
            if (span.TotalMinutes < 1) return "Vừa xong";
            if (span.TotalMinutes < 60) return $"{(int)span.TotalMinutes} phút trước";
            if (span.TotalHours < 24) return $"{(int)span.TotalHours} giờ trước";
            return $"{(int)span.TotalDays} ngày trước";
        }

        private static string GetIconForTitle(string title)
        {
            var t = title.ToLower();
            if (t.Contains("đề tài") || t.Contains("thesis") || t.Contains("đồ án")) return "description";
            if (t.Contains("bảo trì") || t.Contains("hệ thống") || t.Contains("maintenance")) return "settings";
            if (t.Contains("chấm điểm") || t.Contains("đánh giá") || t.Contains("grade") || t.Contains("phê duyệt")) return "fact_check";
            return "notifications";
        }

        private static string GetColorForTitle(string title)
        {
            var t = title.ToLower();
            if (t.Contains("đề tài") || t.Contains("thesis") || t.Contains("đồ án")) return "text-blue-600";
            if (t.Contains("bảo trì") || t.Contains("hệ thống") || t.Contains("maintenance")) return "text-orange-600";
            if (t.Contains("chấm điểm") || t.Contains("đánh giá") || t.Contains("grade") || t.Contains("phê duyệt")) return "text-emerald-600";
            return "text-primary";
        }

        private static string GetBgForTitle(string title)
        {
            var t = title.ToLower();
            if (t.Contains("đề tài") || t.Contains("thesis") || t.Contains("đồ án")) return "bg-blue-50";
            if (t.Contains("bảo trì") || t.Contains("hệ thống") || t.Contains("maintenance")) return "bg-orange-50";
            if (t.Contains("chấm điểm") || t.Contains("đánh giá") || t.Contains("grade") || t.Contains("phê duyệt")) return "bg-emerald-50";
            return "bg-slate-50";
        }
    }
}
