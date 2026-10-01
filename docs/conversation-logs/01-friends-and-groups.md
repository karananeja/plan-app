# Conversation Log — Friends & Groups

Spec: [../specs/01-friends-and-groups.md](../specs/01-friends-and-groups.md) · Format: [README](./README.md)

---

## Entry 1 — 2026-10-01 — Requirements captured, spec drafted

**Session goal:** Turn the original product requirements into a feature spec.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Requirement 4: "the user can create a group and add their friends to it and create the splits for the expenses".

### Decided
- Built first: every other feature needs people and Groups. — **why:** Expenses reference Participants and Group membership.
- One `Person` record covers both Users and Invited Persons. — **why:** expenses with friends not yet on the app must survive their sign-up without a migration.
- Friendship is mutual and automatic, with no accept step in v1. — **why:** keeps the flow fast; blocking and requests are deferred.
- Flat Group permissions; leaving or removal requires a zero Group Balance. — **why:** simple, and prevents unrecoverable debts.
- Archive rather than delete as the normal end of a Group. — **why:** keeps history explainable.

### Changed
- Created `docs/specs/01-friends-and-groups.md`.
- Created `GLOSSARY.md` (shared vocabulary across all specs) and `docs/specs/README.md` (index + cross-cutting decisions).

### Verified
- No code yet. Spec reviewed for consistency with the glossary and the other specs.

### Open / Next
- [ ] Confirm flat permissions are acceptable (no Group admins in v1).
- [ ] Confirm auto-friending of all Group Members is wanted.
- [ ] Resolve the cross-cutting open questions in [docs/specs/README.md](../specs/README.md) (stack, auth, currency, test seam).
- [ ] Break the spec into tickets and start implementation. Log each session as a new entry below.

---

## Entry 2 — 2026-10-01 — Grilling round 1 (decisions + vocabulary)

**Session goal:** Settle root product decisions and sharpen domain language (`/grill-with-docs`).
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Answered round 1 questions Q1–Q14 with "yes go ahead". Claude took this to mean all recommended answers were accepted.

### Decided
- Cross-cutting: MVP for real use; installable web app (PWA) with web push; Google sign-in + email one-time code; one currency per Group / non-group Expense; high-trust model. See [specs README](../specs/README.md#product-decisions-grilling-round-1-2026-10-01).
- Group Members automatically become Friends (Q6). — **why:** needed for Net Balance netting across Groups.
- Flat Group permissions confirmed (part of the high-trust model, Q5).
- Invites match on verified email; phone-only invites are claimed once the user verifies that phone. — **why:** follows from Google/email sign-in without SMS cost.

### Changed
- `docs/specs/01-friends-and-groups.md`: sign-in story, sign-in + invite matching decisions.

### Verified
- Read the changed specs against `GLOSSARY.md` for consistent terms.

### Open / Next
- [ ] Round 2: whether phone invites stay in v1 and what happens when removing a Friend you share a Group with.

---

## Entry 3 — 2026-10-01 — Grilling round 2 (stack, v1 scope, edge cases)

**Session goal:** Choose the stack and v1 scope, and settle the edge cases raised by round 1.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Round 2 questions Q15–Q22. The user replied: "keep the options as suggested", so all recommendations were accepted.

### Decided
- Stack (Q15): TypeScript, Next.js, Postgres + Drizzle, Auth.js, Vercel + Neon, Inngest/Vercel Cron, Resend. Domain logic in framework-free TS modules. See [specs README](../specs/README.md#product-decisions-grilling-round-2-2026-10-01).
- v1 scope (Q16): invites by **email only**. Phone invites, SMS and the contact picker are cut. — **why:** no SMS provider/DLT cost; the Contact Picker API only works on Android Chrome.
- Non-group Expenses auto-friend everyone on them (Q19). — **why:** a Debt between two people needs a Friendship for Net Balance netting.
- Removing a Friend is blocked while the Net Balance isn't zero or the two share a non-archived Group (Q20). — **why:** auto-friending would recreate the Friendship immediately.

### Changed
- `docs/specs/01-friends-and-groups.md`: stories 3, 4, 6, 8, 11, 12; sign-in/invite/removal/auto-friending decisions; Out of Scope.
- `GLOSSARY.md`: Invited Person is now email only.

### Verified
- Grepped specs for leftover phone/SMS/receipt/digest references after the scope cuts.

### Open / Next
- [ ] Round 3: test seam and test database, how domain events are delivered (in-process vs outbox), repo layout.

---

## Entry 4 — 2026-10-01 — Grilling round 3 (engineering shape)

**Session goal:** Settle the test seam, event delivery, API style, layout, dates, currency default, and where tickets live.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Round 3 questions Q23–Q29. The user replied: "keep the options as suggested", so all recommendations were accepted.

### Decided
- Shared: Vitest + PGlite against the service layer; Activity as the outbox; Server Actions; a single Next.js app; GitHub Issues for tickets. See [specs README](../specs/README.md#engineering-decisions-grilling-round-3-2026-10-01).
- Group currency defaults to the creator's profile currency, prefilled from their locale (Q28).

### Changed
- `docs/specs/01-friends-and-groups.md`: Group currency decision.

### Open / Next
- [ ] Round 4: repo name/visibility, data visibility rules, account deletion, ADR for Activity-as-outbox.

---

## Entry 5 — 2026-10-01 — Grilling round 4 (final branches)

**Session goal:** Close the remaining branches of the design tree.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Round 4 questions Q30–Q33. The user replied: "keep the options as suggested", so all recommendations were accepted.

### Decided
- The repo will be a private GitHub repo named `plan-app` (Q30). It won't be created until the user confirms the overall design.
- Visibility rules written down (Q31). A new Group Member sees the full history.
- Account deletion is out of v1; the post-v1 plan is to anonymise, and only at zero balances (Q32).

### Changed
- `docs/specs/01-friends-and-groups.md`: Visibility decision, Out of Scope.

### Open / Next
- [ ] The user confirms the overall design, then: git init, GitHub repo, `/setup-matt-pocock-skills`, tickets, TDD implementation.

---

## Entry 6 — 2026-10-01 — Grilling round 5 (stack change for v1)

**Session goal:** Re-plan v1 around a stack change requested by the user.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- User: "few changes in tech stack for v1: use react/vite for frontend with shadcn and tailwind; use node.js for backend and choose sqlite for db; notifications can be simple polling mechanism".
- Follow-up answers:
  - Q37: in-app only.
  - Q38: "it is a local set up for v1".
  - Q41: accepted Hono / Drizzle + better-sqlite3 / better-auth / pnpm workspace / Vitest + in-memory SQLite.
  - Q42: "locally usable for v1".
  - Q43: "have the google login support but seed with some users and have email login for them".
  - Q44: (a).
  - Q45: (b).
  - Q46: "keep in app simple notifications".

### Decided
- The new stack replaces rounds 2–3 (Next.js/Postgres/Vercel/Inngest/Auth.js/PGlite are gone). See [specs README → Current decisions](../specs/README.md#current-decisions).
- Sign-in uses better-auth with Google + email one-time code (Q43). Locally, emails print to the API console. A seed script creates users who sign in by email.
- v1 runs locally (Q38, Q42). Config comes from env vars so it can be deployed later.

### Changed
- `docs/specs/README.md`: decision sections rewritten as "Current decisions".
- `docs/specs/01-friends-and-groups.md`: sign-in decision.

### Open / Next
- [ ] The user confirms the overall design, then: git init, private GitHub repo `plan-app`, `/setup-matt-pocock-skills`, tickets, TDD implementation.

---

## Entry 7 — 2026-10-01 — Sign-in corrected to email + password

**Session goal:** Break Spec 01 into tickets (`/to-tickets`). A sign-in correction came up while reviewing the draft.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- User: "correction, it is email password login and not email otp login".

### Decided
- Sign-in is Google or email + password, via better-auth. This replaces the email one-time code from round 5 (Q43).
- An Invited Person is claimed only when the account's email is **verified**. Google emails count as verified; password accounts verify via an emailed link. — **why:** a password sign-up doesn't prove the person owns the email, so claiming on sign-up would let anyone take over an invited friend's history.
- Password reset by emailed link is included in v1. — **why:** a password login needs it, and better-auth provides it.
- Seed users have known passwords and are pre-verified.

### Changed
- `docs/specs/01-friends-and-groups.md`: story 1, sign-in and invite-matching decisions.
- `docs/specs/README.md`: sign-in, notification email and auth lines.
- `docs/specs/05-notifications.md`: list of emails sent.

### Open / Next
- [ ] Approve the Spec 01 ticket breakdown, then publish to `.scratch/01-friends-and-groups/issues/`.

---

## Entry 8 — 2026-10-01 — Spec broken into tickets

**Session goal:** Publish Spec 01 as tracer-bullet tickets (`/to-tickets`).
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- `/to-tickets docs/specs/01-friends-and-groups.md`. The user approved the 10-ticket breakdown ("ok").

### Decided
- Ticket 01 is a workspace scaffold / walking skeleton, because the repo has no code yet.
- A **Balances interface** that reports zero is introduced in Ticket 04. — **why:** Spec 01's guards depend on balances (Spec 03), and with no Transactions zero is the true answer. Spec 03 replaces it and adds the non-zero tests.
- Ticket 04 also introduces the **Activity recording** seam (written in the same transaction as the change).
- Expense-dependent criteria moved to Spec 02 ("Carried over from Spec 01"). — **why:** they can't be verified until Expenses exist.
- Group image becomes **emoji + colour** in v1. — **why:** uploads need file storage, the same reason receipt photos were cut.

### Changed
- `.scratch/01-friends-and-groups/README.md` (ticket graph) and `issues/01`–`10`.
- `docs/specs/01-friends-and-groups.md`: stories 13 and 18, the Balances note, a ticket link.
- `docs/specs/02-expense-splitting-and-nudges.md`: "Carried over from Spec 01".
- `docs/specs/03-balances-and-settlements.md`: a note that it replaces the zero-reporting Balances implementation.

### Open / Next
- [ ] Implement Ticket 01 (workspace scaffold), using `/tdd`.

---

## Entry 9 — 2026-10-01 — Ticket 01: workspace scaffold (TDD)

**Session goal:** Implement `.scratch/01-friends-and-groups/issues/01-workspace-scaffold.md` test-first (`/tdd`).
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- User approved implementing Ticket 01 with `/tdd` and the three proposed test seams ("ok").

### Decided
- **Test seams for this ticket**:
  1. The Hono app called in-process (`GET /api/health` with a fresh in-memory database).
  2. The domain package's public exports. Money conversion is the first real domain function: `toMinorUnits` and `formatMoney`, working on strings with no floating point.
  3. No web test. Verified by running.
- **TypeScript pinned to 6.0.x.** — **why:** TypeScript 7.0.2 is `latest`, but typescript-eslint supports `<6.1.0`.
- **No placeholder migration.** The Drizzle migration journal starts empty. — **why:** an empty custom migration fails ("no statements"), and a dummy table would be invented schema. Ticket 02 adds the first real table.
- **The API listens on 8787 by default.** — **why:** port 3000 was taken by another local app (an "FMS" dev server).
- **Vite loads the repo-root `.env`** with `loadEnv`, so the API and the web proxy agree on ports.
- shadcn's CLI (Vite template, Radix base, new-york style) now installs `cn`, shadcn's own package (repo `shadcn-ui/cn`), instead of clsx + tailwind-merge. Checked and kept.

### Changed
- Workspace: `pnpm-workspace.yaml` (with build scripts allowed for better-sqlite3 and esbuild), root `package.json` scripts, `tsconfig.base.json`, `eslint.config.js`, `.env.example`, `.gitignore` (`data/`), `README.md`.
- `packages/domain`: money module and its tests.
- `apps/api`: Hono app with `GET /api/health`, server entry, config, Drizzle client/migrator, migrate CLI, test-database helper, health test.
- `apps/web`: Vite + React + Tailwind v4 + shadcn (Button), React Query, typed Hono RPC client, health page.

### Verified
- `pnpm test`: domain 2/2, api 1/1, web has no tests (by design).
- `pnpm typecheck` and `pnpm lint` are clean. `pnpm --filter @plan-app/web build` succeeds.
- `pnpm db:migrate` creates `data/plan-app.sqlite`.
- `pnpm dev`: `GET /api/health` returns `{"status":"ok","db":"ok"}` both directly on :8787 and through the Vite proxy on :5173.
- Both apps resolve `@plan-app/domain` at runtime.
- **Not verified:** the rendered page in a real browser. Only the proxy fetch and the build were checked.
- Incident: an early cleanup ran `pkill -f vite`, which matches any Vite process on the machine. The user's other app on :3000 was confirmed still running; any other Vite dev server could have been stopped. Since then, processes are only stopped by the PIDs we started.

### Open / Next
- [ ] Ticket 02: email + password sign-in and profile (first migration: Person).
