using PlatformAdmin.DTOs.Auth;

namespace PlatformAdmin.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<LoginResponse> RegisterAsync(RegisterRequest request);
    Task<bool> RevokeTokenAsync(string token);
}
