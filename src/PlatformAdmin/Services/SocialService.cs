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
                // Verify if it belongs to the current Cloudinary account. If not (e.g. it is from 'uef_social_media'), re-upload it.
                var isCurrentCloud = post.Image.Contains($"/{_cloudinaryService.CloudName}/", StringComparison.OrdinalIgnoreCase);
                if (isCurrentCloud)
                {
                    post.CloudinaryStatus = "Uploaded";
                    await _db.SaveChangesAsync();
                    return;
                }
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
                    // If the download/upload failed (e.g. 404 Not Found because it was a mock URL that doesn't exist)
                    // and the URL contains "res.cloudinary.com", it means the original image is lost.
                    // Let's replace it with a beautiful, category-appropriate placeholder from Unsplash!
                    if (post.Image.Contains("res.cloudinary.com"))
                    {
                        var fallbackUrl = GetCategoryPlaceholderUrl(post.Category, post.Title);
                        var fallbackResult = await _cloudinaryService.UploadImageFromUrlAsync(fallbackUrl);
                        if (fallbackResult.Success)
                        {
                            post.Image = fallbackResult.SecureUrl;
                            post.CloudinaryStatus = "Uploaded";
                        }
                        else
                        {
                            post.CloudinaryStatus = "Failed";
                        }
                    }
                    else
                    {
                        post.CloudinaryStatus = "Failed";
                    }
                }
            }
            catch
            {
                if (post.Image.Contains("res.cloudinary.com"))
                {
                    try
                    {
                        var fallbackUrl = GetCategoryPlaceholderUrl(post.Category, post.Title);
                        var fallbackResult = await _cloudinaryService.UploadImageFromUrlAsync(fallbackUrl);
                        if (fallbackResult.Success)
                        {
                            post.Image = fallbackResult.SecureUrl;
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
                }
                else
                {
                    post.CloudinaryStatus = "Failed";
                }
            }

            await _db.SaveChangesAsync();
        }

        private string GetCategoryPlaceholderUrl(string category, string title)
        {
            var cat = category?.ToLowerInvariant() ?? "";
            var t = title?.ToLowerInvariant() ?? "";

            if (cat.Contains("sự kiện") || cat.Contains("event") || t.Contains("hội thảo") || t.Contains("seminar") || t.Contains("workshop"))
            {
                return "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"; // Event / conference hall
            }
            if (cat.Contains("hướng dẫn") || cat.Contains("guide") || t.Contains("đề cương") || t.Contains("tài liệu"))
            {
                return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80"; // Study / books
            }
            if (cat.Contains("tính năng") || t.Contains("ai") || t.Contains("gemini") || t.Contains("phần mềm"))
            {
                return "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80"; // AI / tech
            }
            
            return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"; // General news / university campus
        }
    }
}

