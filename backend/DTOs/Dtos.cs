namespace BrewTracker.Api.DTOs;

// ---- Brews ----

public record CreateBrewDto(
    int BeanOriginId,
    int BrewMethodId,
    decimal CoffeeGrams,
    decimal WaterGrams,
    int ExtractionTimeSec,
    decimal? WaterTempFahrenheit,
    string? GrindSize,
    byte? AcidityScore,
    byte? SweetnessScore,
    byte? BitnessScore,
    byte OverallScore,
    string? Notes,
    DateTime? BrewedAt
);

public record BrewDto(
    int Id,
    string BeanOrigin,
    string BrewMethod,
    decimal CoffeeGrams,
    decimal WaterGrams,
    decimal BrewRatio,
    int ExtractionTimeSec,
    decimal? WaterTempFahrenheit,
    string? GrindSize,
    byte? AcidityScore,
    byte? SweetnessScore,
    byte? BitnessScore,
    byte OverallScore,
    string? Notes,
    DateTime BrewedAt
);

public record BrewFilterDto(
    int? BrewMethodId,
    int? BeanOriginId,
    byte? MinScore,
    DateTime? From,
    DateTime? To
);

// ---- Analytics ----

public record AverageBrewParamsDto(
    string BrewMethod,
    string Origin,
    string? ProcessType,
    int BrewCount,
    decimal AvgCoffeeGrams,
    decimal AvgWaterGrams,
    decimal AvgBrewRatio,
    double AvgExtractionSec,
    decimal? AvgWaterTempF,
    double AvgOverallScore
);

public record BestBrewParametersDto(
    string BrewMethod,
    decimal CoffeeGrams,
    decimal WaterGrams,
    decimal RatioRounded,
    string? GrindSize,
    decimal? TempRounded,
    int BrewCount,
    double AvgScore,
    double AvgExtractionSec
);

public record ExtractionTrendPointDto(
    int Id,
    DateTime BrewedAt,
    int ExtractionTimeSec,
    byte OverallScore,
    byte? AcidityScore,
    byte? SweetnessScore,
    byte? BitnessScore,
    string? GrindSize,
    string? Notes
);

// ---- Lookups ----

public record BeanOriginDto(int Id, string Country, string? Region, string? Farm, string? ProcessType);
public record BrewMethodDto(int Id, string Name, string? Description);
