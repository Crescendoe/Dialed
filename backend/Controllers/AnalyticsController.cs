using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using BrewTracker.Api.Data;
using BrewTracker.Api.DTOs;

namespace BrewTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly BrewTrackerContext _db;

    public AnalyticsController(BrewTrackerContext db) => _db = db;

    // GET api/analytics/averages?brewMethodId=1&minScore=7
    // Calls usp_GetAverageBrewParams
    [HttpGet("averages")]
    public async Task<ActionResult<IEnumerable<AverageBrewParamsDto>>> GetAverages(
        [FromQuery] int? brewMethodId,
        [FromQuery] int? beanOriginId,
        [FromQuery] byte minScore = 1)
    {
        var results = await _db.Database
            .SqlQueryRaw<AverageBrewParamsDto>(
                "EXEC usp_GetAverageBrewParams @BrewMethodId, @BeanOriginId, @MinScore",
                new SqlParameter("@BrewMethodId",   (object?)brewMethodId  ?? DBNull.Value),
                new SqlParameter("@BeanOriginId",   (object?)beanOriginId  ?? DBNull.Value),
                new SqlParameter("@MinScore",        minScore))
            .ToListAsync();

        return Ok(results);
    }

    // GET api/analytics/best?brewMethodId=1&minBrewCount=3
    // Calls usp_GetBestBrewParameters
    [HttpGet("best")]
    public async Task<ActionResult<BestBrewParametersDto?>> GetBest(
        [FromQuery] int brewMethodId,
        [FromQuery] int minBrewCount = 3)
    {
        var results = await _db.Database
            .SqlQueryRaw<BestBrewParametersDto>(
                "EXEC usp_GetBestBrewParameters @BrewMethodId, @MinBrewCount",
                new SqlParameter("@BrewMethodId",  brewMethodId),
                new SqlParameter("@MinBrewCount",  minBrewCount))
            .ToListAsync();

        return Ok(results.FirstOrDefault());
    }

    // GET api/analytics/trend?brewMethodId=1&beanOriginId=2
    // Calls usp_GetExtractionTrend
    [HttpGet("trend")]
    public async Task<ActionResult<IEnumerable<ExtractionTrendPointDto>>> GetTrend(
        [FromQuery] int brewMethodId,
        [FromQuery] int? beanOriginId)
    {
        var results = await _db.Database
            .SqlQueryRaw<ExtractionTrendPointDto>(
                "EXEC usp_GetExtractionTrend @BrewMethodId, @BeanOriginId",
                new SqlParameter("@BrewMethodId",  brewMethodId),
                new SqlParameter("@BeanOriginId",  (object?)beanOriginId ?? DBNull.Value))
            .ToListAsync();

        return Ok(results);
    }
}
