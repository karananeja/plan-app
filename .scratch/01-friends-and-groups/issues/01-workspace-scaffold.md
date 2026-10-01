# 01: Workspace scaffold and walking skeleton

**What to build:** A developer can clone the repo, install dependencies, and run one command that starts the web app and the API together. The web app shows a page that fetches a health status from the API through the typed RPC client and displays it. This sets the pattern every later ticket follows: a pnpm workspace with a web app (React, Vite, Tailwind, shadcn/ui, React Query), an API (Node, Hono, zod) and a shared domain package; SQLite through Drizzle with migrations; and a Vitest setup in which each API test gets a fresh in-memory SQLite database with migrations applied.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] One dev command starts both apps; the web page shows "API: ok" from the health endpoint via the typed RPC client
- [x] The web app has Tailwind and shadcn/ui set up, with at least one shadcn component rendered
- [x] The database file location and other config come from environment variables, with a committed example env file; the SQLite file is git-ignored
- [x] Drizzle migrations can be generated and applied with a workspace script
- [x] The API test helper gives each test a fresh in-memory SQLite database with migrations applied; one passing test proves it
- [x] The domain package is importable from both apps, with one passing unit test
- [x] Workspace-level scripts run typecheck, lint and all tests
- [x] A short README at the repo root explains setup and the dev, test and migrate commands

## Comments

- 2026-10-01: Done. The API's default port is **8787**, not 3000, which another local app already uses. The migration journal starts empty; Ticket 02 generates the first real migration (Person). The page was checked by fetching through the Vite proxy and by a production build, not in a browser.
