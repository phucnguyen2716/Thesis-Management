using PlatformAdmin.DTOs.Auth;

namespace PlatformAdmin.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<LoginResponse> RegisterAsync(RegisterRequest request);
    Task<LoginResponse> LoginWithGoogleAsync(string googleToken);
    Task<LoginResponse> LoginWithGoogleInfoAsync(string email, string name);
    Task<bool> RevokeTokenAsync(string token);
}
