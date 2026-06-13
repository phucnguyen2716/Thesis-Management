using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PlatformAdmin.Data;
using PlatformAdmin.Entities;
using PlatformAdmin.Interfaces;
using PlatformAdmin.DTOs.Social;
using Hangfire;

namespace PlatformAdmin.Services
{
    public class SocialService : ISocialService
    {
        private readonly AppDbContext _db;
        private readonly ICloudinaryService _cloudinaryService;

        public SocialService(AppDbContext db, ICloudinaryService cloudinaryService)
        {
            _db = db;
            _cloudinaryService = cloudinaryService;
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
                    CloudinaryStatus = p.CloudinaryStatus,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<SocialPostDto> CreatePostAsync(CreateSocialPostRequest request)
        {
            var hasImage = !string.IsNullOrEmpty(request.Image);
            var post = new SocialPost
            {
                Title = request.Title,
                Category = request.Category,
                BadgeClass = request.BadgeClass,
                Image = request.Image,
                Desc = request.Desc,
                Content = request.Content,
                Published = request.Published,
                CloudinaryStatus = hasImage ? "Pending" : "None",
                CreatedAt = DateTime.UtcNow
            };

            _db.SocialPosts.Add(post);
            await _db.SaveChangesAsync();

            if (hasImage)
            {
                // Queue Hangfire background job
                BackgroundJob.Enqueue<ISocialService>(s => s.UploadPostImageToCloudinaryAsync(post.Id));
            }

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
                CloudinaryStatus = post.CloudinaryStatus,
                CreatedAt = post.CreatedAt
            };
        }

        public async Task<bool> UpdatePostAsync(int id, UpdateSocialPostRequest request)
        {
            var post = await _db.SocialPosts.FindAsync(id);
            if (post == null) return false;

            var oldImage = post.Image;
            post.Title = request.Title;
            post.Category = request.Category;
            post.BadgeClass = request.BadgeClass;
            post.Image = request.Image;
            post.Desc = request.Desc;
            post.Content = request.Content;
            post.Published = request.Published;

            var imageChanged = oldImage != request.Image;
            if (imageChanged)
            {
                var hasImage = !string.IsNullOrEmpty(request.Image);
                post.CloudinaryStatus = hasImage ? "Pending" : "None";
                
                await _db.SaveChangesAsync();

                if (hasImage)
                {
                    // Queue Hangfire background job
                    BackgroundJob.Enqueue<ISocialService>(s => s.UploadPostImageToCloudinaryAsync(post.Id));
                }
            }
            else
            {
                await _db.SaveChangesAsync();
            }

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

        public async Task UploadPostImageToCloudinaryAsync(int postId)
        {
            var post = await _db.SocialPosts.FindAsync(postId);
            if (post == null || string.IsNullOrEmpty(post.Image)) return;

            // If it is already uploaded to Cloudinary, update status to Uploaded
            if (post.Image.Contains("res.cloudinary.com"))
            {
                post.CloudinaryStatus = "Uploaded";
                await _db.SaveChangesAsync();
                return;
            }

            try
            {
                var result = await _cloudinaryService.UploadImageFromUrlAsync(post.Image);
                if (result.Success)
                {
                    post.Image = result.SecureUrl;
                    post.CloudinaryStatus = "Uploaded";
                }
                else
                {
                    post.CloudinaryStatus = "Failed";
                }
            }
            catch
            {
                post.CloudinaryStatus = "Failed";
            }

            await _db.SaveChangesAsync();
        }
    }
}
