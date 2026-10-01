# plan-app

Split shared bills with friends, see netted balances, and nudge people to settle up. v1 runs locally.

- Product and engineering decisions: [docs/specs/README.md](docs/specs/README.md)
- Vocabulary: [GLOSSARY.md](GLOSSARY.md)
- Tickets: [.scratch/](.scratch/)

## Requirements

- Node.js 22+ (developed on 24)
- pnpm 10 (`corepack enable` picks up the pinned version)

## Setup

```sh
pnpm install
cp .env.example .env   # optional; defaults work without it
pnpm db:migrate
pnpm dev
```

Open http://localhost:5173. The page shows "API: ok" when the web app can reach the API.

## Layout

| Path | What |
|---|---|
| `apps/web` | React + Vite + Tailwind + shadcn/ui, React Query. Calls the API through Hono's typed RPC client; `/api` is proxied to the API in dev. |
| `apps/api` | Node + Hono API, SQLite via Drizzle + better-sqlite3. Migrations live in `apps/api/drizzle`. |
| `packages/domain` | Pure domain logic shared by both apps (money, and later splits, allocation, debt simplification). |

## Commands

| Command | Does |
|---|---|
| `pnpm dev` | Runs the API (port 8787) and the web app (port 5173) with reload |
| `pnpm test` | Runs all tests (Vitest). API tests use a fresh in-memory SQLite database per test |
| `pnpm typecheck` | Typechecks every package |
| `pnpm lint` | ESLint across the repo |
| `pnpm db:generate` | Generates a migration from schema changes (`apps/api/src/db/schema.ts`) |
| `pnpm db:migrate` | Applies migrations to the local database (`data/plan-app.sqlite` by default) |

## Configuration

All settings are optional environment variables in the repo-root `.env` (see `.env.example`): `DATABASE_PATH`, `API_PORT`, `WEB_PORT`.
