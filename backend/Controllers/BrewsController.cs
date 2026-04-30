using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BrewTracker.Api.Data;
using BrewTracker.Api.DTOs;
using BrewTracker.Api.Models;

namespace BrewTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BrewsController : ControllerBase
{
    private readonly BrewTrackerContext _db;

    public BrewsController(BrewTrackerContext db) => _db = db;

    // GET api/brews
    // Supports optional filtering by method, origin, score range, and date range.
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BrewDto>>> GetBrews([FromQuery] BrewFilterDto filter)
    {
        var query = _db.Brews
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
        var brew = await _db.Brews
            .Include(b => b.BeanOrigin)
            .Include(b => b.BrewMethod)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (brew is null) return NotFound();
        return Ok(MapToDto(brew));
    }

    // POST api/brews
    [HttpPost]
    public async Task<ActionResult<BrewDto>> CreateBrew(CreateBrewDto dto)
    {
        var originExists = await _db.BeanOrigins.AnyAsync(o => o.Id == dto.BeanOriginId);
        var methodExists = await _db.BrewMethods.AnyAsync(m => m.Id == dto.BrewMethodId);

        if (!originExists || !methodExists)
            return BadRequest("Invalid BeanOriginId or BrewMethodId.");

        var brew = new Brew
        {
            BeanOriginId        = dto.BeanOriginId,
            BrewMethodId        = dto.BrewMethodId,
            CoffeeGrams         = dto.CoffeeGrams,
            WaterGrams          = dto.WaterGrams,
            ExtractionTimeSec   = dto.ExtractionTimeSec,
            WaterTempFahrenheit    = dto.WaterTempFahrenheit,
            GrindSize           = dto.GrindSize,
            AcidityScore        = dto.AcidityScore,
            SweetnessScore      = dto.SweetnessScore,
            BitnessScore        = dto.BitnessScore,
            OverallScore        = dto.OverallScore,
            Notes               = dto.Notes,
            BrewedAt            = dto.BrewedAt ?? DateTime.UtcNow,
            CreatedAt           = DateTime.UtcNow
        };

        _db.Brews.Add(brew);
        await _db.SaveChangesAsync();

        // Reload with navigation properties so the response is fully populated
        await _db.Entry(brew).Reference(b => b.BeanOrigin).LoadAsync();
        await _db.Entry(brew).Reference(b => b.BrewMethod).LoadAsync();

        return CreatedAtAction(nameof(GetBrew), new { id = brew.Id }, MapToDto(brew));
    }

    // DELETE api/brews/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBrew(int id)
    {
        var brew = await _db.Brews.FindAsync(id);
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
        b.OverallScore,
        b.Notes,
        b.BrewedAt
    );
}
