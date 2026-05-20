using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Dialed.Api.Data;
using Dialed.Api.DTOs;

namespace Dialed.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LookupsController : ControllerBase
{
    private readonly DialedContext _db;
    private readonly IMemoryCache _cache;
    private const string OriginsCacheKey = "BeanOriginsList";
    private const string MethodsCacheKey = "BrewMethodsList";

    public LookupsController(DialedContext db, IMemoryCache cache)
    {
        _db = db;
        _cache = cache;
    }

    [HttpGet("bean-origins")]
    public async Task<ActionResult<IEnumerable<BeanOriginDto>>> GetOrigins()
    {
        // Serve from fast in-memory cache if available, otherwise hit the database
        if (!_cache.TryGetValue(OriginsCacheKey, out IEnumerable<BeanOriginDto>? origins))
        {
            origins = await _db.BeanOrigins
                .OrderBy(o => o.Country).ThenBy(o => o.Region)
                .Select(o => new BeanOriginDto(o.Id, o.Country, o.Region, o.Farm, o.ProcessType))
                .ToListAsync();

            // Cache the result for 12 hours since origins rarely change
            _cache.Set(OriginsCacheKey, origins, TimeSpan.FromHours(12));
        }

        return Ok(origins);
    }

    [HttpGet("brew-methods")]
    public async Task<ActionResult<IEnumerable<BrewMethodDto>>> GetMethods()
    {
        if (!_cache.TryGetValue(MethodsCacheKey, out IEnumerable<BrewMethodDto>? methods))
        {
            methods = await _db.BrewMethods
                .OrderBy(m => m.Name)
                .Select(m => new BrewMethodDto(m.Id, m.Name, m.Description))
                .ToListAsync();

            _cache.Set(MethodsCacheKey, methods, TimeSpan.FromHours(12));
        }

        return Ok(methods);
    }
}