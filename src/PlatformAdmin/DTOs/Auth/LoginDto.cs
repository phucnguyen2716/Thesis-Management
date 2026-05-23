namespace PlatformAdmin.DTOs.Auth;

public record LoginRequest(string Email, string Password);

public record LoginResponse(
    string Token,
    string RefreshToken,
    string FullName,
    string Email,
    string Role,
    int UserId
);

public record RegisterRequest(
    string FullName,
    string Email,
    string Password,
    string Role,
    string? StudentId,
    string? Department
);
