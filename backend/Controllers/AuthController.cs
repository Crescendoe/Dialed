using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using BrewTracker.Api.Data;
using BrewTracker.Api.DTOs;
using BrewTracker.Api.Models;

namespace BrewTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly BrewTrackerContext           _db;
    private readonly IConfiguration               _config;

    public AuthController(
        UserManager<ApplicationUser> users,
        BrewTrackerContext db,
        IConfiguration config)
    {
        _users  = users;
        _db     = db;
        _config = config;
    }

    // POST api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var user   = new ApplicationUser { UserName = dto.Email, Email = dto.Email };
        var result = await _users.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
            return BadRequest(string.Join("; ", result.Errors.Select(e => e.Description)));

        return await IssueTokens(user);
    }

    // POST api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user = await _users.FindByEmailAsync(dto.Email);
        if (user is null || !await _users.CheckPasswordAsync(user, dto.Password))
            return Unauthorized("Invalid email or password.");

        return await IssueTokens(user);
    }

    // POST api/auth/refresh
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshRequestDto dto)
    {
        var stored = await _db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r =>
                r.Token == dto.RefreshToken &&
                !r.IsRevoked &&
                r.ExpiresAt > DateTime.UtcNow);

        if (stored is null) return Unauthorized("Invalid or expired refresh token.");

        stored.IsRevoked = true;
        await _db.SaveChangesAsync();

        return await IssueTokens(stored.User);
    }

    // POST api/auth/logout
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequestDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var token  = await _db.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == dto.RefreshToken && r.UserId == userId);

        if (token is not null)
        {
            token.IsRevoked = true;
            await _db.SaveChangesAsync();
        }

        return NoContent();
    }

    private async Task<IActionResult> IssueTokens(ApplicationUser user)
    {
        var jwt          = GenerateJwt(user);
        var refreshToken = GenerateRefreshToken();

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId    = user.Id,
            Token     = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        return Ok(new AuthResponseDto(jwt, refreshToken, user.Email!));
    }

    private string GenerateJwt(ApplicationUser user)
    {
        var section = _config.GetSection("Jwt");
        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(section["Secret"]!));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email,          user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:             section["Issuer"],
            audience:           section["Audience"],
            claims:             claims,
            expires:            DateTime.UtcNow.AddMinutes(double.Parse(section["ExpiryMinutes"]!)),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
}
