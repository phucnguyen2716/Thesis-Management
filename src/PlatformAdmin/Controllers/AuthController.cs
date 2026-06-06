using PlatformAdmin.DTOs.Auth;
using PlatformAdmin.Interfaces;
using PlatformAdmin.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

namespace PlatformAdmin.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [ApiResponse(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("register")]
    [ApiResponse(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<LoginResponse>> Register(RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("google-login")]
    [ApiResponse(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ApiResponse(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        try
        {
            var response = await _authService.LoginWithGoogleAsync(request.Token);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }
}

public class GoogleLoginRequest
{
    public string Token { get; set; } = string.Empty;
}
