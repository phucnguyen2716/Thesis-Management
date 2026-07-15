using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PlatformAdmin.Interfaces;
using PlatformAdmin.Attributes;
using PlatformAdmin.Data;
using PlatformAdmin.Entities;
using PlatformAdmin.DTOs.Social;

namespace PlatformAdmin.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SocialController : ControllerBase
    {
        private readonly ISocialService _socialService;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly AppDbContext _db;

        public SocialController(
            ISocialService socialService,
            IHubContext<NotificationHub> hubContext,
            AppDbContext db)
        {
            _socialService = socialService;
            _hubContext = hubContext;
            _db = db;
        }

        [HttpGet("posts")]
        [ApiResponse(typeof(IEnumerable<SocialPostDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<SocialPostDto>>> GetPosts([FromQuery] bool publishedOnly = true)
        {
            var posts = await _socialService.GetPostsAsync(publishedOnly);
            return Ok(posts);
        }

        [HttpPost("posts")]
        [Authorize(Roles = "Admin")]
        [ApiResponse(typeof(SocialPostDto), StatusCodes.Status201Created)]
        [ApiResponse(StatusCodes.Status400BadRequest)]
        [ApiResponse(StatusCodes.Status401Unauthorized)]
        [ApiResponse(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<SocialPostDto>> CreatePost([FromBody] CreateSocialPostRequest request)
        {
            var post = await _socialService.CreatePostAsync(request);

            try
            {
                // Find all active users to write notifications to the database
                var activeUsers = await _db.Users.Where(u => u.IsActive).ToListAsync();
                foreach (var user in activeUsers)
                {
                    _db.Notifications.Add(new Notification
                    {
                        UserId = user.Id,
                        Title = "Bài báo mới đăng",
                        Message = $"{post.Title} [link:/news/{post.Id}]",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
                await _db.SaveChangesAsync();

                // Broadcast SignalR notification to all online clients
                await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
                {
                    title = "Bài báo mới đăng",
                    desc = $"{post.Title} [link:/news/{post.Id}]",
                    time = "Vừa xong",
                    icon = "description",
                    color = "text-blue-600",
                    bg = "bg-blue-50"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SocialController] Failed to dispatch notifications: {ex.Message}");
            }

            return CreatedAtAction(nameof(GetPosts), new SocialPostDto
            {
                Id = post.Id,
                Title = post.Title,
                Category = post.Category,
                BadgeClass = post.BadgeClass,
                Image = post.Image,
                Desc = post.Desc,
                Content = post.Content,
                Published = post.Published,
                CreatedAt = post.CreatedAt
            });
        }

        [HttpPut("posts/{id}")]
        [Authorize(Roles = "Admin")]
        [ApiResponse(StatusCodes.Status204NoContent)]
        [ApiResponse(StatusCodes.Status400BadRequest)]
        [ApiResponse(StatusCodes.Status401Unauthorized)]
        [ApiResponse(StatusCodes.Status403Forbidden)]
        [ApiResponse(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdatePost(int id, [FromBody] UpdateSocialPostRequest request)
        {
            var updated = await _socialService.UpdatePostAsync(id, request);
            if (!updated) return NotFound();
            return NoContent();
        }

        [HttpDelete("posts/{id}")]
        [Authorize(Roles = "Admin")]
        [ApiResponse(StatusCodes.Status204NoContent)]
        [ApiResponse(StatusCodes.Status401Unauthorized)]
        [ApiResponse(StatusCodes.Status403Forbidden)]
        [ApiResponse(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeletePost(int id)
        {
            var deleted = await _socialService.DeletePostAsync(id);
            if (!deleted) return NotFound();
            return NoContent();
        }
    }
}
