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
pnpm db:seed           # optional demo users
pnpm dev
```

Open http://localhost:5173 and sign up, or sign in as a demo user.

### Demo users (from `pnpm db:seed`)

`asha@example.com`, `ben@example.com`, `chen@example.com`, `divya@example.com`, all with password `demo-password`. They're already verified. Asha has created two demo Groups: "Goa Trip" (all four) and "Flat 4B" (Asha and Ben).

### Emails when running locally

The app doesn't send real email locally. Verification links, password-reset links and (later) invites are **printed in the API console** where `pnpm dev` runs. Open the link in your browser to follow it.

### Google sign-in (optional)

Without credentials the Google button is hidden and email + password still works. To enable it:

1. In the [Google Cloud console](https://console.cloud.google.com/apis/credentials), create (or pick) a project and configure the OAuth consent screen (External, testing mode is fine; add your Google account as a test user).
2. Create an **OAuth client ID** of type **Web application** with:
   - Authorized JavaScript origin: `http://localhost:5173`
   - Authorized redirect URI: `http://localhost:5173/api/auth/callback/google`
3. Put the client ID and secret in `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and restart `pnpm dev`.

If you change `WEB_PORT` or `WEB_ORIGIN`, use that origin in both URLs instead.

A Google sign-in with the email of an existing password account signs into that account only if its email is already verified (this prevents someone pre-registering your email). Otherwise the sign-in page explains what to do.

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
| `pnpm db:seed` | Adds the demo users. Safe to re-run |

## Configuration

All settings are optional environment variables in the repo-root `.env` (see `.env.example`): `DATABASE_PATH`, `API_PORT`, `WEB_PORT`, `WEB_ORIGIN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `BETTER_AUTH_SECRET` (without it, an insecure development secret is used and a warning is printed).
