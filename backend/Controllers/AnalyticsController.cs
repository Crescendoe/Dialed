using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Dialed.Api.Data;
using Dialed.Api.DTOs;

namespace Dialed.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly DialedContext _db;

    public AnalyticsController(DialedContext db) => _db = db;

    // GET api/analytics/averages
    [HttpGet("averages")]
    public async Task<ActionResult<IEnumerable<AverageBrewParamsDto>>> GetAverages(
        [FromQuery] int? brewMethodId,
        [FromQuery] int? beanOriginId,
        [FromQuery] byte minScore = 1)
    {
        var userId  = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var results = await _db.Database
            .SqlQueryRaw<AverageBrewParamsDto>(
                "EXEC usp_GetAverageBrewParams @UserId, @BrewMethodId, @BeanOriginId, @MinScore",
                new SqlParameter("@UserId",       userId),
                new SqlParameter("@BrewMethodId", (object?)brewMethodId ?? DBNull.Value),
                new SqlParameter("@BeanOriginId", (object?)beanOriginId ?? DBNull.Value),
                new SqlParameter("@MinScore",     minScore))
            .ToListAsync();

        return Ok(results);
    }

    // GET api/analytics/best
    [HttpGet("best")]
    public async Task<ActionResult<BestBrewParametersDto?>> GetBest(
        [FromQuery] int brewMethodId,
        [FromQuery] int minBrewCount = 3)
    {
        var userId  = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var results = await _db.Database
            .SqlQueryRaw<BestBrewParametersDto>(
                "EXEC usp_GetBestBrewParameters @UserId, @BrewMethodId, @MinBrewCount",
                new SqlParameter("@UserId",       userId),
                new SqlParameter("@BrewMethodId", brewMethodId),
                new SqlParameter("@MinBrewCount", minBrewCount))
            .ToListAsync();

        return Ok(results.FirstOrDefault());
    }

    // GET api/analytics/trend
    [HttpGet("trend")]
    public async Task<ActionResult<IEnumerable<ExtractionTrendPointDto>>> GetTrend(
        [FromQuery] int  brewMethodId,
        [FromQuery] int? beanOriginId)
    {
        var userId  = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var results = await _db.Database
            .SqlQueryRaw<ExtractionTrendPointDto>(
                "EXEC usp_GetExtractionTrend @UserId, @BrewMethodId, @BeanOriginId",
                new SqlParameter("@UserId",       userId),
                new SqlParameter("@BrewMethodId", brewMethodId),
                new SqlParameter("@BeanOriginId", (object?)beanOriginId ?? DBNull.Value))
            .ToListAsync();

        return Ok(results);
    }
}
