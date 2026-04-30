# Brew Tracker

A data-driven coffee brew logging application built with **React**, **C# .NET 8 Web API**, and **Microsoft SQL Server**. Users log brew sessions — ratios, extraction times, bean origins, taste scores — and the app uses SQL queries, aggregations, and stored procedures to surface patterns and optimal parameters across their brew history.

Built as a portfolio project to demonstrate full-stack proficiency across the same technology stack commonly used in enterprise .NET environments.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Front End  | React 18, Vite, custom SVG charts |
| API        | C# .NET 8 Web API, Entity Framework Core 8 |
| Database   | Microsoft SQL Server (SQL Server Express works fine) |
| ORM        | EF Core with raw SQL for stored procedures |

## Design

A custom dark "specialty roastery" aesthetic — Fraunces (italic serif) for headings and origin names paired with JetBrains Mono for data and labels. Warm amber accents on a deep espresso background with a subtle grain texture overlay. The analytics dashboard reads like a cupping report rather than a generic SaaS dashboard. No off-the-shelf charting library — the score-vs-extraction-time scatter plot is hand-rendered SVG with a "sweet spot" overlay highlighting the parameter window where high-scoring brews cluster.

---

## Features

### Brew Logging
- Log brew sessions with coffee/water grams, extraction time, water temperature, grind size, and a 1–10 taste profile (acidity, sweetness, bitterness, overall)
- Brew ratio is auto-calculated live in the UI and stored as a computed column in SQL Server
- Bean origins and brew methods are normalized lookup tables — clean relational design, no free-text mess

### Brew Log with Filtering
- Filter logged brews by method, origin, and minimum score
- Filters run client-side against the already-fetched dataset; the API supports server-side filtering parameters as well (`brewMethodId`, `beanOriginId`, `minScore`, `from`, `to`)

### Analytics Dashboard
Three analytical views, each backed by a SQL Server stored procedure:

1. **Best Parameters** (`usp_GetBestBrewParameters`) — finds the highest-scoring parameter combination for a given brew method, requiring a configurable minimum number of data points so one lucky brew doesn't skew the result
2. **Average Score by Origin** (`usp_GetAverageBrewParams`) — aggregates average scores, ratios, and extraction times grouped by bean origin and process type, filtered by minimum score threshold
3. **Score vs Extraction Time** (`usp_GetExtractionTrend`) — scatter plot of every brew showing score against extraction time, with grind size and notes visible on hover; lets you visually identify over- and under-extraction patterns

---

## Project Structure

```
brew-tracker/
├── backend/                    # C# .NET 8 Web API
│   ├── Controllers/
│   │   ├── BrewsController.cs       # CRUD + filtering
│   │   ├── AnalyticsController.cs   # Stored procedure endpoints
│   │   └── LookupsController.cs     # Bean origins, brew methods
│   ├── Models/
│   │   └── Models.cs               # EF Core entity classes
│   ├── Data/
│   │   └── BrewTrackerContext.cs    # DbContext, computed column config
│   ├── DTOs/
│   │   └── Dtos.cs                 # Request/response shapes
│   ├── Program.cs
│   └── appsettings.json
├── frontend/                   # React + Vite
│   └── src/
│       ├── components/
│       │   ├── BrewForm.jsx         # Log a new brew
│       │   ├── BrewTable.jsx        # Filterable brew history
│       │   └── AnalyticsDashboard.jsx # Charts + best params
│       ├── hooks/
│       │   └── useBrewData.js       # Shared data fetching hooks
│       ├── utils/
│       │   └── api.js              # All fetch calls centralized
│       ├── App.jsx
│       └── App.css
└── database/
    └── schema.sql              # Full schema, indexes, stored procedures, seed data
```

---

## Database Design

### Tables

**`BeanOrigins`** — normalized lookup: country, region, farm, altitude, process type (Washed / Natural / Honey)

**`BrewMethods`** — normalized lookup: Pour Over, Aeropress, Espresso, French Press, Moka Pot

**`Brews`** — fact table storing every logged session. Key design decisions:
- `BrewRatio` is a **persisted computed column** (`WaterGrams / CoffeeGrams`) — the database maintains it, not the application, which means it's always accurate and queryable with no overhead
- Taste scores use `TINYINT` with `CHECK` constraints enforcing the 1–10 range at the database level
- Indexed on `BrewedAt`, `BrewMethodId`, `BeanOriginId`, and `OverallScore` to keep analytical queries fast as data grows

### Stored Procedures

```sql
usp_GetAverageBrewParams   -- AVG aggregations grouped by method/origin, filterable by min score
usp_GetBestBrewParameters  -- TOP 1 parameter combo by avg score, requires N data points minimum
usp_GetExtractionTrend     -- Full time series of score vs extraction for scatter plot
```

The stored procedures are called from the API via `SqlQueryRaw` with parameterized inputs — no string concatenation, no SQL injection surface.

---

## Setup

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (free) or any SQL Server instance
- [Node.js 18+](https://nodejs.org/)

### 1 — Database

Open SQL Server Management Studio (or `sqlcmd`) and run:

```bash
sqlcmd -S localhost -E -i database/schema.sql
```

This creates the `BrewTracker` database, all tables, indexes, stored procedures, and seed data (brew methods + 8 bean origins).

### 2 — Backend API

```bash
cd backend
# Update the connection string in appsettings.json if needed
dotnet run
```

API runs at `http://localhost:5000`. Swagger UI available at `http://localhost:5000/swagger`.

### 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

---

## API Endpoints

### Brews
| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/brews` | Get all brews (supports `brewMethodId`, `beanOriginId`, `minScore`, `from`, `to` query params) |
| `GET`  | `/api/brews/{id}` | Get single brew |
| `POST` | `/api/brews` | Log a new brew |
| `DELETE` | `/api/brews/{id}` | Delete a brew |

### Analytics
| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/analytics/averages` | Calls `usp_GetAverageBrewParams` |
| `GET`  | `/api/analytics/best` | Calls `usp_GetBestBrewParameters` |
| `GET`  | `/api/analytics/trend` | Calls `usp_GetExtractionTrend` |

### Lookups
| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/lookups/bean-origins` | All bean origins |
| `GET`  | `/api/lookups/brew-methods` | All brew methods |

---

## What This Demonstrates

This project was built to show practical proficiency with the kind of stack common in enterprise .NET shops — not just that I can write code, but that I understand *why* certain decisions get made:

- **Computed columns over application logic** for derived values that need to be queryable
- **Stored procedures for analytics** rather than pulling raw data and crunching it in C# — the database engine is better at set-based operations
- **Parameterized queries** everywhere stored procedures are called, never string-built SQL
- **Normalized lookups** for reference data instead of free-text fields that make GROUP BY queries painful
- **DTOs as the API contract** — entities never leak out of the API layer
- **CORS scoped to the dev origin** — not a wildcard
- **EF Core for CRUD, raw SQL for analytics** — using the right tool for each job rather than forcing everything through the ORM

---

## Potential Extensions

- User authentication (ASP.NET Identity or JWT)
- Export brew history to CSV
- Bean origin management UI (add your own origins)
- Target range overlays on the extraction trend chart (highlight the "sweet spot" window)
- Mobile-responsive layout improvements
