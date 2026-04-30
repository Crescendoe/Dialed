using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dialed.Api.Data;
using Dialed.Api.DTOs;
using Dialed.Api.Models;

namespace Dialed.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BrewsController : ControllerBase
{
    private readonly DialedContext _db;

    public BrewsController(DialedContext db) => _db = db;

    // GET api/brews
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BrewDto>>> GetBrews([FromQuery] BrewFilterDto filter)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var query = _db.Brews
            .Where(b => b.UserId == userId)
            .Include(b => b.BeanOrigin)
            .Include(b => b.BrewMethod)
            .AsQueryable();

        if (filter.BrewMethodId.HasValue)
            query = query.Where(b => b.BrewMethodId == filter.BrewMethodId);

        if (filter.BeanOriginId.HasValue)
            query = query.Where(b => b.BeanOriginId == filter.BeanOriginId);

        if (filter.MinScore.HasValue)
            query = query.Where(b => b.OverallScore >= filter.MinScore.Value);

        if (filter.From.HasValue)
            query = query.Where(b => b.BrewedAt >= filter.From.Value);

        if (filter.To.HasValue)
            query = query.Where(b => b.BrewedAt <= filter.To.Value);

        var brews = await query
            .OrderByDescending(b => b.BrewedAt)
            .Select(b => MapToDto(b))
            .ToListAsync();

        return Ok(brews);
    }

    // GET api/brews/5
    [HttpGet("{id}")]
    public async Task<ActionResult<BrewDto>> GetBrew(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var brew = await _db.Brews
            .Include(b => b.BeanOrigin)
            .Include(b => b.BrewMethod)
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

        if (brew is null) return NotFound();
        return Ok(MapToDto(brew));
    }

    // POST api/brews
    [HttpPost]
    public async Task<ActionResult<BrewDto>> CreateBrew(CreateBrewDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var originExists = await _db.BeanOrigins.AnyAsync(o => o.Id == dto.BeanOriginId);
        var methodExists = await _db.BrewMethods.AnyAsync(m => m.Id == dto.BrewMethodId);

        if (!originExists || !methodExists)
            return BadRequest("Invalid BeanOriginId or BrewMethodId.");

        var brew = new Brew
        {
            UserId              = userId,
            BeanOriginId        = dto.BeanOriginId,
            BrewMethodId        = dto.BrewMethodId,
            CoffeeGrams         = dto.CoffeeGrams,
            WaterGrams          = dto.WaterGrams,
            ExtractionTimeSec   = dto.ExtractionTimeSec,
            WaterTempFahrenheit = dto.WaterTempFahrenheit,
            GrindSize           = dto.GrindSize,
            AcidityScore        = dto.AcidityScore,
            SweetnessScore      = dto.SweetnessScore,
            BitnessScore        = dto.BitnessScore,
            BodyScore           = dto.BodyScore,
            ComplexityScore     = dto.ComplexityScore,
            AftertasteScore     = dto.AftertasteScore,
            SmoothnnessScore    = dto.SmoothnnessScore,
            OverallScore        = dto.OverallScore,
            Notes               = dto.Notes,
            BrewedAt            = dto.BrewedAt ?? DateTime.UtcNow,
            CreatedAt           = DateTime.UtcNow
        };

        _db.Brews.Add(brew);
        await _db.SaveChangesAsync();

        await _db.Entry(brew).Reference(b => b.BeanOrigin).LoadAsync();
        await _db.Entry(brew).Reference(b => b.BrewMethod).LoadAsync();

        return CreatedAtAction(nameof(GetBrew), new { id = brew.Id }, MapToDto(brew));
    }

    // DELETE api/brews/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBrew(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var brew   = await _db.Brews.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

        if (brew is null) return NotFound();

        _db.Brews.Remove(brew);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static BrewDto MapToDto(Brew b) => new(
        b.Id,
        $"{b.BeanOrigin.Country}{(b.BeanOrigin.Region != null ? $", {b.BeanOrigin.Region}" : "")}",
        b.BrewMethod.Name,
        b.CoffeeGrams,
        b.WaterGrams,
        b.BrewRatio,
        b.ExtractionTimeSec,
        b.WaterTempFahrenheit,
        b.GrindSize,
        b.AcidityScore,
        b.SweetnessScore,
        b.BitnessScore,
        b.BodyScore,
        b.ComplexityScore,
        b.AftertasteScore,
        b.SmoothnnessScore,
        b.OverallScore,
        b.Notes,
        b.BrewedAt
    );
}
