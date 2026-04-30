-- ============================================================
-- Brew Tracker — SQL Server Schema
-- ============================================================

SET QUOTED_IDENTIFIER ON;
GO

CREATE DATABASE BrewTracker;
GO
USE BrewTracker;
GO

-- ------------------------------------------------------------
-- Bean Origins
-- Normalized lookup table so origin data stays consistent
-- and can be filtered/aggregated cleanly in queries.
-- ------------------------------------------------------------
CREATE TABLE BeanOrigins (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    Country     NVARCHAR(100)   NOT NULL,
    Region      NVARCHAR(100)   NULL,
    Farm        NVARCHAR(150)   NULL,
    Altitude    NVARCHAR(50)    NULL,  -- e.g. "1800-2000 masl"
    ProcessType NVARCHAR(50)    NULL,  -- Washed, Natural, Honey
    CreatedAt   DATETIME2       NOT NULL DEFAULT GETUTCDATE()
);

-- ------------------------------------------------------------
-- Brew Methods
-- Aeropress, Pour Over, Espresso, French Press, etc.
-- Keeping this normalized lets us add method-specific
-- guidance later without schema changes.
-- ------------------------------------------------------------
CREATE TABLE BrewMethods (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    Name        NVARCHAR(100)   NOT NULL UNIQUE,
    Description NVARCHAR(500)   NULL
);

-- ------------------------------------------------------------
-- Brews
-- Core fact table. Every logged brew session lives here.
-- Ratios are stored as separate columns rather than a single
-- string so we can run real arithmetic in queries.
-- ------------------------------------------------------------
CREATE TABLE Brews (
    Id                  INT IDENTITY(1,1) PRIMARY KEY,
    BeanOriginId        INT             NOT NULL REFERENCES BeanOrigins(Id),
    BrewMethodId        INT             NOT NULL REFERENCES BrewMethods(Id),

    -- Brew ratio (e.g. 1:15 coffee to water)
    CoffeeGrams         DECIMAL(6,2)    NOT NULL,
    WaterGrams          DECIMAL(7,2)    NOT NULL,
    BrewRatio           AS (WaterGrams / CoffeeGrams) PERSISTED, -- computed

    -- Extraction
    ExtractionTimeSec   INT             NOT NULL,  -- total brew time in seconds
    WaterTempFahrenheit DECIMAL(5,2)    NULL,
    GrindSize           NVARCHAR(50)    NULL,      -- Coarse / Medium / Fine / Extra Fine

    -- Taste profile (1-10 scale)
    AcidityScore        TINYINT         NULL CHECK (AcidityScore BETWEEN 1 AND 10),
    SweetnessScore      TINYINT         NULL CHECK (SweetnessScore BETWEEN 1 AND 10),
    BitnessScore        TINYINT         NULL CHECK (BitnessScore BETWEEN 1 AND 10),
    OverallScore        TINYINT         NOT NULL CHECK (OverallScore BETWEEN 1 AND 10),

    Notes               NVARCHAR(1000)  NULL,
    BrewedAt            DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX IX_Brews_BeanOriginId  ON Brews(BeanOriginId);
CREATE INDEX IX_Brews_BrewMethodId  ON Brews(BrewMethodId);
CREATE INDEX IX_Brews_BrewedAt      ON Brews(BrewedAt DESC);
CREATE INDEX IX_Brews_OverallScore  ON Brews(OverallScore DESC);
GO

-- ============================================================
-- STORED PROCEDURES
-- Analytical queries that would be expensive or messy to
-- reconstruct in application code on every request.
-- ============================================================

-- ------------------------------------------------------------
-- usp_GetAverageBrewParams
-- Returns average parameters grouped by brew method and/or
-- bean origin. The @MinScore filter lets users see only
-- parameters that produced brews they actually liked.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_GetAverageBrewParams
    @BrewMethodId   INT     = NULL,
    @BeanOriginId   INT     = NULL,
    @MinScore       TINYINT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        bm.Name                             AS BrewMethod,
        bo.Country                          AS Origin,
        bo.ProcessType,
        COUNT(*)                            AS BrewCount,
        ROUND(AVG(b.CoffeeGrams), 2)        AS AvgCoffeeGrams,
        ROUND(AVG(b.WaterGrams), 2)         AS AvgWaterGrams,
        ROUND(AVG(b.BrewRatio), 2)          AS AvgBrewRatio,
        ROUND(AVG(CAST(b.ExtractionTimeSec AS FLOAT)), 0) AS AvgExtractionSec,
        ROUND(AVG(b.WaterTempFahrenheit), 1)   AS AvgWaterTempF,
        ROUND(AVG(CAST(b.OverallScore AS FLOAT)), 2)      AS AvgOverallScore
    FROM Brews b
    JOIN BrewMethods  bm ON bm.Id = b.BrewMethodId
    JOIN BeanOrigins  bo ON bo.Id = b.BeanOriginId
    WHERE
        (@BrewMethodId IS NULL OR b.BrewMethodId = @BrewMethodId)
        AND (@BeanOriginId IS NULL OR b.BeanOriginId = @BeanOriginId)
        AND b.OverallScore >= @MinScore
    GROUP BY
        bm.Name, bo.Country, bo.ProcessType
    ORDER BY
        AvgOverallScore DESC;
END;
GO

-- ------------------------------------------------------------
-- usp_GetBestBrewParameters
-- Finds the single best-performing parameter combination
-- for a given brew method, defined as highest average score
-- with at least @MinBrewCount data points (so one lucky brew
-- doesn't skew the results).
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_GetBestBrewParameters
    @BrewMethodId   INT,
    @MinBrewCount   INT     = 3
AS
BEGIN
    SET NOCOUNT ON;

    WITH RankedParams AS (
        SELECT
            b.CoffeeGrams,
            b.WaterGrams,
            ROUND(b.BrewRatio, 1)               AS RatioRounded,
            b.GrindSize,
            ROUND(b.WaterTempFahrenheit, 0)         AS TempRounded,
            COUNT(*)                             AS BrewCount,
            ROUND(AVG(CAST(b.OverallScore AS FLOAT)), 2) AS AvgScore,
            ROUND(AVG(CAST(b.ExtractionTimeSec AS FLOAT)), 0) AS AvgExtractionSec
        FROM Brews b
        WHERE b.BrewMethodId = @BrewMethodId
        GROUP BY
            b.CoffeeGrams,
            b.WaterGrams,
            ROUND(b.BrewRatio, 1),
            b.GrindSize,
            ROUND(b.WaterTempFahrenheit, 0)
        HAVING COUNT(*) >= @MinBrewCount
    )
    SELECT TOP 1
        bm.Name     AS BrewMethod,
        rp.*
    FROM RankedParams rp
    JOIN BrewMethods bm ON bm.Id = @BrewMethodId
    ORDER BY rp.AvgScore DESC;
END;
GO

-- ------------------------------------------------------------
-- usp_GetExtractionTrend
-- Returns score vs extraction time for a given method so
-- the front end can plot whether the user is over- or
-- under-extracting over time.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE usp_GetExtractionTrend
    @BrewMethodId   INT,
    @BeanOriginId   INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        b.Id,
        b.BrewedAt,
        b.ExtractionTimeSec,
        b.OverallScore,
        b.AcidityScore,
        b.SweetnessScore,
        b.BitnessScore,
        b.GrindSize,
        b.Notes
    FROM Brews b
    WHERE
        b.BrewMethodId = @BrewMethodId
        AND (@BeanOriginId IS NULL OR b.BeanOriginId = @BeanOriginId)
    ORDER BY b.BrewedAt ASC;
END;
GO

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO BrewMethods (Name, Description) VALUES
    ('Pour Over',   'Manual drip method using a cone dripper and paper filter. Produces a clean, bright cup.'),
    ('Aeropress',   'Pressure-based immersion brewer. Forgiving and fast, great for travel.'),
    ('Espresso',    'High-pressure extraction through finely ground coffee. Produces a concentrated shot.'),
    ('French Press','Full immersion with a metal mesh press. Bold and heavy-bodied.'),
    ('Moka Pot',    'Stovetop brewer using steam pressure. Strong and rich, not quite espresso.');

INSERT INTO BeanOrigins (Country, Region, Farm, Altitude, ProcessType) VALUES
    ('Ethiopia',    'Yirgacheffe',  'Kochere Cooperative',  '1900-2200 masl', 'Washed'),
    ('Ethiopia',    'Guji',         'Shakiso',              '1800-2000 masl', 'Natural'),
    ('Colombia',    'Huila',        'Las Flores',           '1700-1900 masl', 'Washed'),
    ('Guatemala',   'Antigua',      NULL,                   '1500-1700 masl', 'Washed'),
    ('Kenya',       'Nyeri',        'Gakuyuini',            '1700-1900 masl', 'Washed'),
    ('Brazil',      'Sul de Minas', 'Fazenda Serra Negra',  '1000-1200 masl', 'Natural'),
    ('Costa Rica',  'Tarrazu',      'La Minita',            '1500-1700 masl', 'Honey'),
    ('Panama',      'Boquete',      'Hacienda La Esmeralda','1600-1800 masl', 'Washed');
GO
