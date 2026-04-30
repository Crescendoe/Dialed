-- ============================================================
-- Brew Tracker — SQL Server Schema
-- ============================================================

SET QUOTED_IDENTIFIER ON;
GO

CREATE DATABASE BrewTracker;
GO
USE BrewTracker;
GO

-- ============================================================
-- ASP.NET Core Identity tables
-- ============================================================

CREATE TABLE AspNetUsers (
    Id                   NVARCHAR(450)  NOT NULL PRIMARY KEY,
    UserName             NVARCHAR(256)  NULL,
    NormalizedUserName   NVARCHAR(256)  NULL,
    Email                NVARCHAR(256)  NULL,
    NormalizedEmail      NVARCHAR(256)  NULL,
    EmailConfirmed       BIT            NOT NULL,
    PasswordHash         NVARCHAR(MAX)  NULL,
    SecurityStamp        NVARCHAR(MAX)  NULL,
    ConcurrencyStamp     NVARCHAR(MAX)  NULL,
    PhoneNumber          NVARCHAR(MAX)  NULL,
    PhoneNumberConfirmed BIT            NOT NULL,
    TwoFactorEnabled     BIT            NOT NULL,
    LockoutEnd           DATETIMEOFFSET NULL,
    LockoutEnabled       BIT            NOT NULL,
    AccessFailedCount    INT            NOT NULL
);

CREATE UNIQUE INDEX UserNameIndex ON AspNetUsers (NormalizedUserName) WHERE NormalizedUserName IS NOT NULL;
CREATE INDEX EmailIndex ON AspNetUsers (NormalizedEmail);

CREATE TABLE AspNetRoles (
    Id               NVARCHAR(450) NOT NULL PRIMARY KEY,
    Name             NVARCHAR(256) NULL,
    NormalizedName   NVARCHAR(256) NULL,
    ConcurrencyStamp NVARCHAR(MAX) NULL
);

CREATE UNIQUE INDEX RoleNameIndex ON AspNetRoles (NormalizedName) WHERE NormalizedName IS NOT NULL;

CREATE TABLE AspNetUserRoles (
    UserId NVARCHAR(450) NOT NULL,
    RoleId NVARCHAR(450) NOT NULL,
    PRIMARY KEY (UserId, RoleId),
    FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id) ON DELETE CASCADE,
    FOREIGN KEY (RoleId) REFERENCES AspNetRoles(Id) ON DELETE CASCADE
);

CREATE TABLE AspNetUserClaims (
    Id         INT           IDENTITY(1,1) PRIMARY KEY,
    UserId     NVARCHAR(450) NOT NULL,
    ClaimType  NVARCHAR(MAX) NULL,
    ClaimValue NVARCHAR(MAX) NULL,
    FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id) ON DELETE CASCADE
);

CREATE TABLE AspNetUserLogins (
    LoginProvider       NVARCHAR(128) NOT NULL,
    ProviderKey         NVARCHAR(128) NOT NULL,
    ProviderDisplayName NVARCHAR(MAX) NULL,
    UserId              NVARCHAR(450) NOT NULL,
    PRIMARY KEY (LoginProvider, ProviderKey),
    FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id) ON DELETE CASCADE
);

CREATE TABLE AspNetUserTokens (
    UserId        NVARCHAR(450) NOT NULL,
    LoginProvider NVARCHAR(128) NOT NULL,
    Name          NVARCHAR(128) NOT NULL,
    Value         NVARCHAR(MAX) NULL,
    PRIMARY KEY (UserId, LoginProvider, Name),
    FOREIGN KEY (UserId) REFERENCES AspNetUsers(Id) ON DELETE CASCADE
);

CREATE TABLE AspNetRoleClaims (
    Id         INT           IDENTITY(1,1) PRIMARY KEY,
    RoleId     NVARCHAR(450) NOT NULL,
    ClaimType  NVARCHAR(MAX) NULL,
    ClaimValue NVARCHAR(MAX) NULL,
    FOREIGN KEY (RoleId) REFERENCES AspNetRoles(Id) ON DELETE CASCADE
);
GO

-- ============================================================
-- Application tables
-- ============================================================

CREATE TABLE BeanOrigins (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    Country     NVARCHAR(100) NOT NULL,
    Region      NVARCHAR(100) NULL,
    Farm        NVARCHAR(150) NULL,
    Altitude    NVARCHAR(50)  NULL,
    ProcessType NVARCHAR(50)  NULL,
    CreatedAt   DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE BrewMethods (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    Name        NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500) NULL
);

CREATE TABLE Brews (
    Id                  INT IDENTITY(1,1) PRIMARY KEY,
    UserId              NVARCHAR(450) NOT NULL REFERENCES AspNetUsers(Id) ON DELETE CASCADE,
    BeanOriginId        INT           NOT NULL REFERENCES BeanOrigins(Id),
    BrewMethodId        INT           NOT NULL REFERENCES BrewMethods(Id),

    CoffeeGrams         DECIMAL(6,2)  NOT NULL,
    WaterGrams          DECIMAL(7,2)  NOT NULL,
    BrewRatio           AS (WaterGrams / CoffeeGrams) PERSISTED,

    ExtractionTimeSec   INT           NOT NULL,
    WaterTempFahrenheit DECIMAL(5,2)  NULL,
    GrindSize           NVARCHAR(50)  NULL,

    AcidityScore        TINYINT       NULL CHECK (AcidityScore   BETWEEN 1 AND 10),
    SweetnessScore      TINYINT       NULL CHECK (SweetnessScore BETWEEN 1 AND 10),
    BitnessScore        TINYINT       NULL CHECK (BitnessScore   BETWEEN 1 AND 10),
    BodyScore           TINYINT       NULL CHECK (BodyScore      BETWEEN 1 AND 10),
    ComplexityScore     TINYINT       NULL CHECK (ComplexityScore BETWEEN 1 AND 10),
    AftertasteScore     TINYINT       NULL CHECK (AftertasteScore BETWEEN 1 AND 10),
    SmoothnnessScore    TINYINT       NULL CHECK (SmoothnnessScore BETWEEN 1 AND 10),
    OverallScore        TINYINT       NOT NULL CHECK (OverallScore BETWEEN 1 AND 10),

    Notes               NVARCHAR(1000) NULL,
    BrewedAt            DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    CreatedAt           DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX IX_Brews_UserId       ON Brews(UserId);
CREATE INDEX IX_Brews_BeanOriginId ON Brews(BeanOriginId);
CREATE INDEX IX_Brews_BrewMethodId ON Brews(BrewMethodId);
CREATE INDEX IX_Brews_BrewedAt     ON Brews(BrewedAt DESC);
CREATE INDEX IX_Brews_OverallScore ON Brews(OverallScore DESC);

CREATE TABLE RefreshTokens (
    Id        INT           IDENTITY(1,1) PRIMARY KEY,
    UserId    NVARCHAR(450) NOT NULL REFERENCES AspNetUsers(Id) ON DELETE CASCADE,
    Token     NVARCHAR(500) NOT NULL,
    ExpiresAt DATETIME2     NOT NULL,
    CreatedAt DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    IsRevoked BIT           NOT NULL DEFAULT 0
);

CREATE INDEX IX_RefreshTokens_Token  ON RefreshTokens(Token);
CREATE INDEX IX_RefreshTokens_UserId ON RefreshTokens(UserId);
GO

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

CREATE OR ALTER PROCEDURE usp_GetAverageBrewParams
    @UserId       NVARCHAR(450),
    @BrewMethodId INT     = NULL,
    @BeanOriginId INT     = NULL,
    @MinScore     TINYINT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        bm.Name                                            AS BrewMethod,
        bo.Country                                         AS Origin,
        bo.ProcessType,
        COUNT(*)                                           AS BrewCount,
        ROUND(AVG(b.CoffeeGrams), 2)                      AS AvgCoffeeGrams,
        ROUND(AVG(b.WaterGrams), 2)                       AS AvgWaterGrams,
        ROUND(AVG(b.BrewRatio), 2)                        AS AvgBrewRatio,
        ROUND(AVG(CAST(b.ExtractionTimeSec AS FLOAT)), 0) AS AvgExtractionSec,
        ROUND(AVG(b.WaterTempFahrenheit), 1)              AS AvgWaterTempF,
        ROUND(AVG(CAST(b.OverallScore AS FLOAT)), 2)      AS AvgOverallScore
    FROM Brews b
    JOIN BrewMethods bm ON bm.Id = b.BrewMethodId
    JOIN BeanOrigins bo ON bo.Id = b.BeanOriginId
    WHERE
        b.UserId = @UserId
        AND (@BrewMethodId IS NULL OR b.BrewMethodId = @BrewMethodId)
        AND (@BeanOriginId IS NULL OR b.BeanOriginId = @BeanOriginId)
        AND b.OverallScore >= @MinScore
    GROUP BY
        bm.Name, bo.Country, bo.ProcessType
    ORDER BY
        AvgOverallScore DESC;
END;
GO

CREATE OR ALTER PROCEDURE usp_GetBestBrewParameters
    @UserId       NVARCHAR(450),
    @BrewMethodId INT,
    @MinBrewCount INT = 3
AS
BEGIN
    SET NOCOUNT ON;

    WITH RankedParams AS (
        SELECT
            b.CoffeeGrams,
            b.WaterGrams,
            ROUND(b.BrewRatio, 1)                             AS RatioRounded,
            b.GrindSize,
            ROUND(b.WaterTempFahrenheit, 0)                   AS TempRounded,
            COUNT(*)                                          AS BrewCount,
            ROUND(AVG(CAST(b.OverallScore AS FLOAT)), 2)      AS AvgScore,
            ROUND(AVG(CAST(b.ExtractionTimeSec AS FLOAT)), 0) AS AvgExtractionSec
        FROM Brews b
        WHERE b.UserId = @UserId AND b.BrewMethodId = @BrewMethodId
        GROUP BY
            b.CoffeeGrams,
            b.WaterGrams,
            ROUND(b.BrewRatio, 1),
            b.GrindSize,
            ROUND(b.WaterTempFahrenheit, 0)
        HAVING COUNT(*) >= @MinBrewCount
    )
    SELECT TOP 1
        bm.Name AS BrewMethod,
        rp.*
    FROM RankedParams rp
    JOIN BrewMethods bm ON bm.Id = @BrewMethodId
    ORDER BY rp.AvgScore DESC;
END;
GO

CREATE OR ALTER PROCEDURE usp_GetExtractionTrend
    @UserId       NVARCHAR(450),
    @BrewMethodId INT,
    @BeanOriginId INT = NULL
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
        b.UserId = @UserId
        AND b.BrewMethodId = @BrewMethodId
        AND (@BeanOriginId IS NULL OR b.BeanOriginId = @BeanOriginId)
    ORDER BY b.BrewedAt ASC;
END;
GO

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO BrewMethods (Name, Description) VALUES
    ('Pour Over',    'Manual drip method using a cone dripper and paper filter. Produces a clean, bright cup.'),
    ('Aeropress',    'Pressure-based immersion brewer. Forgiving and fast, great for travel.'),
    ('Espresso',     'High-pressure extraction through finely ground coffee. Produces a concentrated shot.'),
    ('French Press', 'Full immersion with a metal mesh press. Bold and heavy-bodied.'),
    ('Moka Pot',     'Stovetop brewer using steam pressure. Strong and rich, not quite espresso.');

INSERT INTO BeanOrigins (Country, Region, Farm, Altitude, ProcessType) VALUES
    ('Ethiopia',   'Yirgacheffe', 'Kochere Cooperative',   '1900-2200 masl', 'Washed'),
    ('Ethiopia',   'Guji',        'Shakiso',               '1800-2000 masl', 'Natural'),
    ('Colombia',   'Huila',       'Las Flores',            '1700-1900 masl', 'Washed'),
    ('Guatemala',  'Antigua',      NULL,                   '1500-1700 masl', 'Washed'),
    ('Kenya',      'Nyeri',       'Gakuyuini',             '1700-1900 masl', 'Washed'),
    ('Brazil',     'Sul de Minas','Fazenda Serra Negra',   '1000-1200 masl', 'Natural'),
    ('Costa Rica', 'Tarrazu',     'La Minita',             '1500-1700 masl', 'Honey'),
    ('Panama',     'Boquete',     'Hacienda La Esmeralda', '1600-1800 masl', 'Washed');
GO
