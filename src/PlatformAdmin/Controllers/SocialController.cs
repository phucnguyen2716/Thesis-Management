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
    [ApiController]
    [Route("api/[controller]")]
    public class SocialController : ControllerBase
    {
        private readonly AppDbContext _db;

        public SocialController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("posts")]
        public async Task<ActionResult<IEnumerable<SocialPostDto>>> GetPosts([FromQuery] bool publishedOnly = true)
        {
            var query = _db.SocialPosts.AsQueryable();
            if (publishedOnly)
            {
                query = query.Where(p => p.Published);
            }

            var posts = await query
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new SocialPostDto
                {
                    Id = p.Id.ToString(),
                    Title = p.Title,
                    Category = p.Category,
                    BadgeClass = p.BadgeClass,
                    Image = p.Image,
                    Desc = p.Desc,
                    Content = p.Content,
                    Published = p.Published,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            return Ok(posts);
        }

        [HttpPost("posts")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SocialPostDto>> CreatePost([FromBody] CreateSocialPostRequest request)
        {
            var post = new SocialPost
            {
                Title = request.Title,
                Category = request.Category,
                BadgeClass = request.BadgeClass,
                Image = request.Image,
                Desc = request.Desc,
                Content = request.Content,
                Published = request.Published,
                CreatedAt = DateTime.UtcNow
            };

            _db.SocialPosts.Add(post);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPosts), new SocialPostDto
            {
                Id = post.Id.ToString(),
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
        public async Task<IActionResult> UpdatePost(int id, [FromBody] UpdateSocialPostRequest request)
        {
            var post = await _db.SocialPosts.FindAsync(id);
            if (post == null) return NotFound();

            post.Title = request.Title;
            post.Category = request.Category;
            post.BadgeClass = request.BadgeClass;
            post.Image = request.Image;
            post.Desc = request.Desc;
            post.Content = request.Content;
            post.Published = request.Published;

            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("posts/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePost(int id)
        {
            var post = await _db.SocialPosts.FindAsync(id);
            if (post == null) return NotFound();

            _db.SocialPosts.Remove(post);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }

    public class SocialPostDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string BadgeClass { get; set; } = string.Empty;
        public string Image { get; set; } = string.Empty;
        public string Desc { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool Published { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateSocialPostRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = "Tin mới";
        public string BadgeClass { get; set; } = "bg-primary text-on-primary";
        public string Image { get; set; } = string.Empty;
        public string Desc { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool Published { get; set; } = true;
    }

    public class UpdateSocialPostRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = "Tin mới";
        public string BadgeClass { get; set; } = "bg-primary text-on-primary";
        public string Image { get; set; } = string.Empty;
        public string Desc { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool Published { get; set; }
    }
}
