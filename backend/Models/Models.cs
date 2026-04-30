using Microsoft.AspNetCore.Identity;

namespace Dialed.Api.Models;

public class ApplicationUser : IdentityUser { }

public class RefreshToken
{
    public int    Id        { get; set; }
    public string UserId    { get; set; } = string.Empty;
    public string Token     { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool   IsRevoked { get; set; }

    public ApplicationUser User { get; set; } = null!;
}

public class BeanOrigin
{
    public int     Id          { get; set; }
    public string  Country     { get; set; } = string.Empty;
    public string? Region      { get; set; }
    public string? Farm        { get; set; }
    public string? Altitude    { get; set; }
    public string? ProcessType { get; set; }
    public DateTime CreatedAt  { get; set; }

    public ICollection<Brew> Brews { get; set; } = new List<Brew>();
}

public class BrewMethod
{
    public int     Id          { get; set; }
    public string  Name        { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<Brew> Brews { get; set; } = new List<Brew>();
}

public class Brew
{
    public int    Id           { get; set; }
    public string UserId       { get; set; } = string.Empty;
    public int    BeanOriginId { get; set; }
    public int    BrewMethodId { get; set; }

    public decimal  CoffeeGrams         { get; set; }
    public decimal  WaterGrams          { get; set; }
    public decimal  BrewRatio           { get; set; }  // computed column, read-only

    public int      ExtractionTimeSec   { get; set; }
    public decimal? WaterTempFahrenheit { get; set; }
    public string?  GrindSize           { get; set; }

    public byte?  AcidityScore      { get; set; }
    public byte?  SweetnessScore    { get; set; }
    public byte?  BitnessScore      { get; set; }
    public byte?  BodyScore         { get; set; }
    public byte?  ComplexityScore   { get; set; }
    public byte?  AftertasteScore   { get; set; }
    public byte?  SmoothnnessScore  { get; set; }
    public byte   OverallScore      { get; set; }

    public string?  Notes     { get; set; }
    public DateTime BrewedAt  { get; set; }
    public DateTime CreatedAt { get; set; }

    public ApplicationUser User       { get; set; } = null!;
    public BeanOrigin      BeanOrigin { get; set; } = null!;
    public BrewMethod      BrewMethod { get; set; } = null!;
}
