# CONTINUE.md — Dialed (brew-tracker)

> Pick-up guide for resuming work on this project. For setup instructions, see README.md.

---

## Project at a Glance

**Dialed** is a full-stack coffee brew logging app, live at [dialedcoffee.app](https://www.dialedcoffee.app).

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | React 18 + Vite (no UI framework, custom CSS) | Azure Static Web Apps (auto-deploys from `main`) |
| Backend | C# .NET 8 Web API + EF Core 8 | Azure App Service B1 (`deploy-backend.yml` on `main`) |
| Database | SQL Server / Azure SQL Database (serverless) | Azure SQL |
| Domain | dialedcoffee.app | Namecheap → Azure CDN |

---

## Current State (as of 2026-05-04)

**Branch:** `main` — deployed to production  
**Version:** 0.2.0

### Uncommitted changes
`backend/appsettings.json` has local dev credentials filled in (connection string + JWT secret). These are intentionally not committed — production secrets live in Azure App Service > Application Settings.

### Recent work (last meaningful commits)
- `dcfb924` — removed unused footer meta
- `5390076` — fixed API connection error message
- `6ce4f80` — README updated with live deployment info
- `dafb04f` — wired `VITE_API_URL` for production Azure backend
- `be9e6fa` — Azure Static Web Apps CI/CD workflow added

The project reached a stable, deployed state after CI/CD was wired up. No open bugs or in-progress features are known.

---

## Architecture Summary

### Frontend (`frontend/src/`)

Tab-based SPA (no React Router). Five tabs: **Log**, **History**, **Analytics**, **Settings**, Sign out.

```
App.jsx                   — Shell, tab state, auth gate
components/
  AuthForm.jsx            — Login / register
  BrewForm.jsx            — Log a new brew (unit conversion, ratio calc)
  BrewTable.jsx           — Brew history with client-side filters + delete
  AnalyticsDashboard.jsx  — Three analytical views (see below)
  SettingsPage.jsx        — Unit prefs, default ratio, advanced taste toggle
  BrewLogo.jsx            — SVG logo
contexts/
  AuthContext.jsx         — JWT + refresh token (localStorage)
  SettingsContext.jsx     — Unit prefs (localStorage)
hooks/
  useBrewData.js          — useLookups(), useBrews() custom hooks
utils/
  api.js                  — All API calls; auto-refreshes JWT on 401
```

**No external chart library.** The scatter plot in `AnalyticsDashboard.jsx` is hand-rendered SVG.

### Backend (`backend/`)

```
Controllers/
  AuthController.cs       — Register, login, refresh, logout
  BrewsController.cs      — CRUD + filtering (user-scoped via JWT claim)
  AnalyticsController.cs  — Three stored procedure endpoints
  LookupsController.cs    — Read-only bean origins & brew methods
Models/Models.cs          — EF Core entities
Data/BrewTrackerContext.cs — DbContext (computed column config, precision constraints)
DTOs/Dtos.cs              — All request/response shapes (entities never leak out)
Program.cs                — DI, JWT, CORS, Swagger middleware pipeline
```

**Auth flow:** JWT (60 min) + refresh token (30 day, stored in `RefreshTokens` table). Client auto-refreshes on 401.

### Database (`database/schema.sql`)

Key design decisions:
- `BrewRatio` is a **persisted computed column** (`WaterGrams / CoffeeGrams`) — stored in SQL, not calculated in code
- Taste scores are `TINYINT` with `CHECK (score BETWEEN 1 AND 10)` at DB level
- Indexes on `BrewedAt`, `BrewMethodId`, `BeanOriginId`, `OverallScore`

Three stored procedures power the Analytics tab:
| Proc | Analytics View |
|------|---------------|
| `usp_GetAverageBrewParams` | Score by Origin table |
| `usp_GetBestBrewParameters` | Best Parameters card (min 3 brews threshold) |
| `usp_GetExtractionTrend` | Extraction Scatter plot |

All SPs are user-scoped (`@UserId` param) and called with `SqlParameter` — no string concatenation.

---

## Environment Setup

### Backend local dev
1. Ensure SQL Server is running locally (or update the connection string)
2. Fill in `backend/appsettings.json`:
   - `ConnectionStrings.BrewTracker` — your local SQL Server
   - `Jwt.Secret` — any 32+ char string
3. Run the schema: `database/schema.sql` against your DB
4. `dotnet run --project backend/BrewTracker.Api.csproj`

### Frontend local dev
```
cd frontend
npm install
npm run dev      # starts on http://localhost:5173
```
API URL is read from `frontend/.env.local` → `VITE_API_URL=http://localhost:5000/api`  
Production URL is in `frontend/.env.production`.

---

## Deployment

| What | How |
|------|-----|
| **Frontend** | Push to `main` — GitHub Actions auto-deploys via `.github/workflows/azure-static-web-apps-mango-hill-03a523510.yml` |
| **Backend** | Push to `main` with changes under `backend/` — auto-deploys via `.github/workflows/deploy-backend.yml`; also supports manual dispatch |
| **Secrets** | `AZURE_APP_NAME`, `AZURE_WEBAPP_PUBLISH_PROFILE` in GitHub repo secrets; DB connection string + JWT secret in Azure App Service > Application Settings |

No Docker. Azure App Service runs the .NET 8 runtime directly.

---

## Potential Next Steps

These are areas that could reasonably be extended — none are planned or in-progress:

- **Brew editing** — `BrewsController` only has GET/POST/DELETE; a PUT endpoint + form UI would complete CRUD
- **Bean origin management** — Origins are seed data; a UI to add custom origins would improve UX
- **Data export** — CSV/JSON download of a user's brew history
- **Dependency updates** — React 18.2 → 18.3+, .NET 8 → 9, Vite 5 → 6
- **More analytics** — Score over time line chart; best method comparison
- **Tests** — No automated tests exist; xUnit for backend, Vitest for frontend would add confidence

---

## Key Files Quick Reference

| Purpose | File |
|---------|------|
| All API calls (frontend) | [frontend/src/utils/api.js](frontend/src/utils/api.js) |
| Auth state | [frontend/src/contexts/AuthContext.jsx](frontend/src/contexts/AuthContext.jsx) |
| User preferences | [frontend/src/contexts/SettingsContext.jsx](frontend/src/contexts/SettingsContext.jsx) |
| Analytics views + SVG chart | [frontend/src/components/AnalyticsDashboard.jsx](frontend/src/components/AnalyticsDashboard.jsx) |
| Brew log form | [frontend/src/components/BrewForm.jsx](frontend/src/components/BrewForm.jsx) |
| All CSS | [frontend/src/index.css](frontend/src/index.css) |
| DI + middleware pipeline | [backend/Program.cs](backend/Program.cs) |
| EF Core entities | [backend/Models/Models.cs](backend/Models/Models.cs) |
| All DTOs | [backend/DTOs/Dtos.cs](backend/DTOs/Dtos.cs) |
| DB schema + stored procs | [database/schema.sql](database/schema.sql) |
| Frontend CI/CD | [.github/workflows/azure-static-web-apps-mango-hill-03a523510.yml](.github/workflows/azure-static-web-apps-mango-hill-03a523510.yml) |
| Backend CI/CD | [.github/workflows/deploy-backend.yml](.github/workflows/deploy-backend.yml) |
