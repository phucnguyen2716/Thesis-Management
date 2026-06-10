using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PlatformAdmin.Interfaces;
using PlatformAdmin.Attributes;
using PlatformAdmin.DTOs.Social;

namespace PlatformAdmin.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SocialController : ControllerBase
    {
        private readonly ISocialService _socialService;

        public SocialController(ISocialService socialService)
        {
            _socialService = socialService;
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
