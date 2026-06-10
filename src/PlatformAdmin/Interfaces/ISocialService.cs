using System.Collections.Generic;
using System.Threading.Tasks;
using PlatformAdmin.DTOs.Social;

namespace PlatformAdmin.Interfaces
{
    public interface ISocialService
    {
        Task<IEnumerable<SocialPostDto>> GetPostsAsync(bool publishedOnly);
        Task<SocialPostDto> CreatePostAsync(CreateSocialPostRequest request);
        Task<bool> UpdatePostAsync(int id, UpdateSocialPostRequest request);
        Task<bool> DeletePostAsync(int id);
    }
}
