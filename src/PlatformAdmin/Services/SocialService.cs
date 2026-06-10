using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PlatformAdmin.Data;
using PlatformAdmin.Entities;
using PlatformAdmin.Interfaces;
using PlatformAdmin.DTOs.Social;

namespace PlatformAdmin.Services
{
    public class SocialService : ISocialService
    {
        private readonly AppDbContext _db;

        public SocialService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<SocialPostDto>> GetPostsAsync(bool publishedOnly)
        {
            var query = _db.SocialPosts.AsQueryable();
            if (publishedOnly)
            {
                query = query.Where(p => p.Published);
            }

            return await query
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
        }

        public async Task<SocialPostDto> CreatePostAsync(CreateSocialPostRequest request)
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

            return new SocialPostDto
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
            };
        }

        public async Task<bool> UpdatePostAsync(int id, UpdateSocialPostRequest request)
        {
            var post = await _db.SocialPosts.FindAsync(id);
            if (post == null) return false;

            post.Title = request.Title;
            post.Category = request.Category;
            post.BadgeClass = request.BadgeClass;
            post.Image = request.Image;
            post.Desc = request.Desc;
            post.Content = request.Content;
            post.Published = request.Published;

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeletePostAsync(int id)
        {
            var post = await _db.SocialPosts.FindAsync(id);
            if (post == null) return false;

            _db.SocialPosts.Remove(post);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
