using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BrewTracker.Api.Data;
using BrewTracker.Api.DTOs;

namespace BrewTracker.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LookupsController : ControllerBase
{
    private readonly BrewTrackerContext _db;
    public LookupsController(BrewTrackerContext db) => _db = db;

    [HttpGet("bean-origins")]
    public async Task<ActionResult<IEnumerable<BeanOriginDto>>> GetOrigins() =>
        Ok(await _db.BeanOrigins
            .OrderBy(o => o.Country).ThenBy(o => o.Region)
            .Select(o => new BeanOriginDto(o.Id, o.Country, o.Region, o.Farm, o.ProcessType))
            .ToListAsync());

    [HttpGet("brew-methods")]
    public async Task<ActionResult<IEnumerable<BrewMethodDto>>> GetMethods() =>
        Ok(await _db.BrewMethods
            .OrderBy(m => m.Name)
            .Select(m => new BrewMethodDto(m.Id, m.Name, m.Description))
            .ToListAsync());
}
