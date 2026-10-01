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

---

## Entry 10 — 2026-10-01 — Ticket 02: email + password sign-in and profile (TDD)

**Session goal:** Implement `.scratch/01-friends-and-groups/issues/02-email-password-sign-in-and-profile.md` test-first.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- `/tdd` for Ticket 02. The user approved the seams ("go ahead"):
  1. The Hono app in-process, with a cookie-keeping test client and a fake email sender, for 6 account flows.
  2. The domain function `currencyForLocale`.
  3. The `seed(db)` function, checked by signing in through seam 1.

### Decided
- **Person table** added (`invited | active`, unique email, optional `userId`). A better-auth `user.create.after` hook creates the active Person. — **why:** Expenses will reference a Person, never a User (Spec 01).
- **Name lives on both User and Person**; `PATCH /api/me` updates both in one transaction. — **why:** Invited Persons have no User but need a name.
- **Profile currency** is a better-auth additional field on User. It's validated by a shared zod `currencyCode` schema (3 letters, known to `Intl`). The web app sends `currencyForLocale(navigator.language)` at sign-up.
- **Unverified Users can sign in.** Verification matters for claiming invites (Ticket 05). A test fixes this behaviour.
- **Email links point at the web origin** (`WEB_ORIGIN`, default :5173), which proxies `/api`, so links work from the browser.
- **The seed** creates asha/ben/chen/divya @example.com with password `demo-password`, already verified, currency INR. It skips Users that already exist.
- Added `@hono/zod-validator` for typed request bodies, and `react-router` and the better-auth React client on the web side.

### Changed
- `apps/api`: schema (better-auth tables + `person`) and first migration; `auth.ts`, `email.ts`, `seed.ts`, `db/seed-cli.ts`, `GET/PATCH /api/me`; config for `BETTER_AUTH_SECRET` and `WEB_ORIGIN`; test helpers (fake email sender, cookie-keeping test client).
- `packages/domain`: `currencyCode`, `updateProfileInput`, `currencyForLocale`.
- `apps/web`: router; sign-in, sign-up, forgot-password, reset-password and profile pages; an app shell with initials avatar, sign-out and an "unverified email" banner with resend; shadcn input, label, card and alert. The Ticket 01 health page was replaced.
- `README.md`, `.env.example`: demo users, local emails, auth settings.

### Verified
- `pnpm test`: domain 9/9, api 8/8. Two API tests (sign-out, sign-in) passed on first run because better-auth provides the behaviour. The sign-out test was confirmed to fail with the sign-out step removed. The sign-in test guards the "unverified Users can sign in" decision.
- `pnpm typecheck`, `pnpm lint` and the web production build are clean.
- End-to-end with curl through the dev proxy against a scratch database:
  - Seeded sign-in.
  - Sign-up, then following the verification link from the console (302 to `/`), then `emailVerified: true`.
  - Forgot password, reset link, `/reset-password?token=…`, new password works.
  - `PATCH /api/me` currency.
  - Sign-out, then 401.
- **Not verified:** the pages in a real browser.
- Incident: the first end-to-end run hit a zsh glob error that skipped setting the scratch `DATABASE_PATH`. The run wrote a test User into `data/plan-app.sqlite`, which had been created by this session in Ticket 01 and held no user data. The file was deleted and the run was repeated against the scratch database.

### Open / Next
- [ ] Ticket 03 (Google sign-in) and Ticket 04 (add Friend & Friends list) are now unblocked.

---

## Entry 11 — 2026-10-01 — Ticket 04: add a Friend and the Friends list (TDD)

**Session goal:** Implement Ticket 04 test-first (Ticket 03 follows in the same session).
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- User: "go ahead with both" (Tickets 04 and 03), then approved the seams ("yes"):
  - Ticket 04 seam 1: the API app in-process (5 Friends tests).
  - Ticket 04 seam 2: Activity, read through `activityFor(db, personId)`, plus an atomicity test through `recordActivity`.

### Decided
- **Friendship** is stored as two rows, one per direction, with a composite primary key, so re-adding is a no-op.
- **Activity** has an `activity` table plus an `activity_audience` table (one row per person involved), so "Activity involving me" is a simple join. `recordActivity(tx, …)` only accepts a transaction handle. — **why:** ADR 0004 requires Activity to be written in the same transaction as the change.
- **Balances interface** introduced with a `noTransactionsYet` implementation and injectable through `createApp`. **Net Balance is returned per currency** (`netBalances: [{ currency, amount }]`, empty = Settled Up). — **why:** currencies are never added together. This changed test 5 from the agreed `netBalance: 0` before implementation.
- **`RuleError`** is mapped to HTTP 400 with the message. It's used for "You can't add yourself as a friend."
- Emails are normalised (trimmed, lower-cased) before lookup. An Invited Person's name is their email until they join.
- An invite email is sent only when the Invited Person is first created.

### Changed
- `apps/api`: `friendship`, `activity` and `activity_audience` tables (migrations 0001, 0002); `friends/service.ts`; `activity/index.ts`; `balances/index.ts`; `errors.ts`; a `signedIn` middleware exposing the caller's Person; `GET/POST /api/friends`; a `signedUp` test helper.
- `packages/domain`: `addFriendInput`.
- `apps/web`: Friends page (add by email, search, Invited badge, per-currency balance text) and nav link; shadcn badge.

### Verified
- `pnpm test`: api 16/16 (5 friends, 3 activity), domain 9/9. The dedupe test was confirmed to fail with email normalisation removed. The atomicity test passed first time, as expected: it pins the transaction guarantee rather than new code.
- Typecheck, lint and web build are clean.
- End-to-end through the dev proxy (scratch database): add an existing User, an unknown email and yourself (400); list; search; the invite link printed in the console.
- **Found:** signing up with an invited email returns **500** (`UNIQUE constraint failed: person.email`). Recorded on Tickets 04 and 05. Ticket 05 must fix it.
- **Not verified:** the Friends page in a real browser.

### Open / Next
- [ ] Ticket 03 (Google sign-in), then Ticket 05, which also fixes the invited sign-up 500.

---

## Entry 12 — 2026-10-01 — Ticket 03: Google sign-in (TDD)

**Session goal:** Implement Ticket 03 test-first (second half of "go ahead with both").
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Seams approved with Ticket 04: the API app in-process, with **Google's HTTP token endpoint faked**, covering 3 tests (options endpoint, new Google user, linking to an existing password account).

### Decided
- **Fake at Google's token endpoint only.** better-auth decodes, rather than verifies, the id token it gets back from that endpoint. So a stubbed `fetch` for `oauth2.googleapis.com/token` lets tests drive the real `/sign-in/social` and `/callback/google` flow. No fallback to a narrower seam was needed.
- **Linking requires a verified local email** (better-auth's default `requireLocalEmailVerified`). — **why:** it prevents account pre-hijacking. The test changed from "links to a password account" to "links to a **verified** password account", and a test was added for the refusal (`/sign-in?error=account_not_linked`). Recorded on Ticket 03.
- **`GET /api/auth/options`** reports `{ google }`, and the web app shows "Continue with Google" only when it's true. OAuth errors return to `/sign-in` (`errorCallbackURL`) with a readable message.
- Config: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, where both are needed to enable Google. The OAuth redirect URI is `{WEB_ORIGIN}/api/auth/callback/google`.

### Changed
- `apps/api`: Google provider in `auth.ts`; the `/auth/options` route; `googleOAuth()` config; server wiring; test helper `test/google.ts` (unsigned id token + `fetch` stub); `google.test.ts` (4 tests).
- `apps/web`: `GoogleButton` on the sign-in and sign-up pages; OAuth error message on sign-in.
- `README.md` (Google setup steps, linking rule), `.env.example`.

### Verified
- `pnpm test`: api 20/20, domain 9/9. The new-Google-user test passed on first run, because the provider was configured in the options-test step. It asserts the exact faked name and email through `/api/me`, which only the real callback can produce. The linking test went red, and the cause was the test's assumption, not the code.
- Typecheck, lint and web build are clean.
- The real dev server: `google:false` without credentials. With dummy credentials, `google:true`, and the redirect to `accounts.google.com` carries `redirect_uri=http://localhost:5173/api/auth/callback/google`, which matches the README.
- **Not verified:** a real Google sign-in. It needs the user's OAuth client ID and secret.

### Open / Next
- [ ] Ticket 05 next: claiming invites, and the **invited-email sign-up 500** found in Ticket 04.

---

## Entry 13 — 2026-10-01 — Ticket 05: claim an invite on a verified email (TDD)

**Session goal:** Implement Ticket 05 test-first, including the invited-email sign-up 500 found in Ticket 04.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- "go ahead" for Ticket 05. Then approved option (a), "a User with no Person until verified", and the 5 API tests ("go ahead").

### Decided
- **No Person until verified** for a User whose email matches an Invited Person. `/api/me` returns `person: null, inviteWaiting: true`; the `signedIn` middleware returns **403** "Verify your email to continue…" when a session has no Person (401 stays for no session). — **why:** an unverified sign-up mustn't get someone's invited history, and a temporary Person would need merging.
- **Claiming** lives in `people/index.ts` and runs from both better-auth hooks:
  - `user.create.after`: Google sign-ups arrive verified and claim at once.
  - `user.update.after`: verifying the email claims.
  - The claim sets `userId`, `status: active` and the sign-up name on the **same Person id**, and records `InviteClaimed` (audience: the Person plus their Friends) in one transaction.
- Matching is by verified email, so the join link isn't required. The link only pre-fills the sign-up email.

### Changed
- `apps/api`: `people/index.ts` (`onUserCreated`, `onUserUpdated`, `invitedPersonFor`); `auth.ts` hooks; the `signedIn` middleware returns 403 when there's no Person; `/api/me` has `inviteWaiting`; `InviteClaimed` activity type; `invites.test.ts` (5 tests).
- `apps/web`: sign-up pre-fills `?email=` with an "a friend added you" description; app shell shows a "verify your email to continue" screen while an invite is waiting.
- `docs/specs/01-friends-and-groups.md`: the pre-verification window is recorded.

### Verified
- `pnpm test`: api 25/25, domain 9/9. Test 1 reproduced the 500 before the fix. Test 5 (uninvited sign-up) passed on first run as a regression guard.
- Typecheck, lint and web build are clean.
- End-to-end through the dev proxy: Asha invites Zoe (join link in console), then Zoe signs up (200, `inviteWaiting`, friends 403), then Zoe verifies (302), then `/api/me` shows an active Person whose id equals the one Asha invited, and each sees the other as a Friend.
- Incident: an earlier run's API was still running because `tsx watch` respawned it after the server PID was killed. The new run's API failed with EADDRINUSE and requests went to the stale server. This also explains the odd first end-to-end run in Ticket 04. Cleanup now also stops this project's `tsx watch` by its exact command line.
- **Not verified:** the pages in a real browser.

### Open / Next
- [ ] Frontier: Ticket 06 (create & list Groups). Tickets 07–10 follow it.

---

## Entry 14 — 2026-10-01 — Ticket 06: create and list Groups (TDD)

**Session goal:** Implement Ticket 06 test-first.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- "go ahead". Then approved 3 seams and 7 tests, plus a named 8-colour palette and type-based default emoji ("yes").

### Decided
- **Tables**: `expense_group` (`group` is an SQL keyword) holding name, type, emoji, colour, currency, creator and `archivedAt`; `group_member` (composite key, `joinedAt`). Members are listed in join order, creator first.
- **Shared input** `createGroupInput` in `packages/domain`: name 1–60, type enum, colour enum, optional emoji, optional currency (defaults to the creator's profile currency, else USD), up to 50 member emails.
- **Reuse**: `findOrInvitePerson`, `befriend` and `sendInvite` moved into `people/index.ts`, and both Friends and Groups use them. Invite emails are sent after the transaction commits.
- **`FriendAdded` subject** is the person being added (the second in the pair), with `data.between` holding both ids. — **why:** auto-friending pairs that don't include the actor had no obvious subject.
- **Activity**: `GroupCreated` (subject: group) and one `GroupMemberAdded` per added member, all with `groupId` set and every member in the audience.
- **Ordering**: Groups are sorted by their latest Activity (`max(activity.occurredAt)` for the group, falling back to `createdAt`).
- **`NotFoundError`** maps to 404. Non-members get 404, never 403, so a Group's existence isn't revealed.
- **Balances**: the interface gains `groupBalances(groupId, personId)`, still reporting zero.

### Changed
- `apps/api`: migration 0003; `groups/service.ts`; `GET/POST /api/groups`, `GET /api/groups/:id`; people helpers; `errors.ts`; seed adds "Goa Trip" (all four demo users) and "Flat 4B" (Asha and Ben); `groups.test.ts` (6 tests) and a seed test.
- `packages/domain`: `groups.ts` (types, colours, default emoji, `createGroupInput`).
- `apps/web`: Groups page, "New group" dialog (type, colour, emoji, currency, Friends checkboxes plus other emails), Group page with members and Group Balances, a `GroupIcon` and a shared `BalanceText`; nav link.

### Verified
- `pnpm test`: api 32/32, domain 9/9. Three tests passed on first run because I'd written the code early: the validation (from the input schema in step 1), the non-member 404 and the ordering (both from `getGroup`/`listGroups` in step 1). That was a TDD slip. The 404 and ordering tests were confirmed to fail with the membership check removed and with ordering switched to creation time.
- Typecheck, lint and web build are clean.
- End-to-end through the dev proxy against a scratch database: seeded Groups are listed; creating "Lunch club" with Ben and a new email works, the currency defaults to INR, and the new person is marked invited with an invite link in the console; it sorts first; Ben gets 200 and Chen 404.
- Shell issues this session: assigning `GID` in zsh fails (reserved variable), which aborted a run and left dev servers up. They were stopped, and the end-to-end check now runs as a bash script that stops every process under this project's `apps/` path.
- **Not verified:** the pages in a real browser.

### Open / Next
- [ ] Tickets 07 (add members), 08 (edit/archive/delete), 09 (leave/remove member) and 10 (remove Friend) are now unblocked.

---

## Entry 15 — 2026-10-01 — Ticket 07: add members to an existing Group (TDD)

**Session goal:** Implement Tickets 07–10 in order ("go ahead"). Seams for all four were approved together ("go ahead"):
- the API app in-process;
- Activity read through `activityFor`;
- a **`StubBalances`** passed to `createTestApp({ balances })` for "blocked while money is owed" guards. Spec 03 adds the same tests against real Expenses.

**Participants:** user, Claude Code (Opus 5.5)

### Decided
- `POST /api/groups/:id/members { emails }`: any member, active Groups only (`RuleError` 400 when archived), non-members get 404, re-adding is a no-op with no Activity.
- **One `addMembers` helper** now backs both Group creation and adding members. `GroupCreated` is recorded after the initial members are added, so they're all in its audience.
- **Newcomers are friended only with members who joined before them.** — **why:** friending against the full member list made `FriendAdded` name the wrong person (caught by the Ticket 06 activity test during the refactor).
- Shared test helpers moved to `test/groups.ts`; `StubBalances` added to `test/app.ts`.

### Changed
- `apps/api`: `groups/service.ts` (`addMembers`, `requireMembership`, `requireActive`, `addGroupMembers`), the route, and `group-members.test.ts` (3 tests).
- `packages/domain`: `addGroupMembersInput`.
- `apps/web`: "Add people by email" form on the Group page (hidden when archived).

### Verified
- `pnpm test`: api 35/35. Tests 2–3 passed on first run because the guards came with step 1's helper. The archived-Group guard was confirmed by removing it (the test failed). The archived state was set up by a direct database write, because the archive endpoint arrives in Ticket 08.
- Typecheck and lint are clean. The end-to-end check runs after Ticket 10.

### Open / Next
- [ ] Ticket 08.

---

## Entry 16 — 2026-10-01 — Ticket 08: edit, archive and delete a Group (TDD)

**Participants:** user, Claude Code (Opus 5.5). Seams approved in Entry 15.

### Decided
- **Edit**: `PATCH /api/groups/:id` with `updateGroupInput` (a non-empty subset of name, emoji, colour, currency). Any member; active Groups only. Records `GroupUpdated` with `data.changes = { field: { from, to } }`, only for fields that actually changed.
- **Archive**: `POST …/archive`, any member, only when **every** member's `groupBalances` is empty, otherwise a 400 saying everyone must be settled up. Records `GroupArchived`. Archived Groups reject edits and new members (400).
- **Un-archive**: `POST …/unarchive`, recorded as `GroupUpdated` with `changes.archived: { from: true, to: false }`.
- **Delete**: `DELETE …`, creator only (400 otherwise). Records `GroupDeleted` (data: name) for all members, then deletes the memberships and the Group. Activity rows are kept (their `groupId` isn't a foreign key).
- **Bug fix**: `activityFor` now orders by `occurredAt` desc, then `rowid` desc. — **why:** archive and unarchive in the same millisecond came back in arbitrary order. The Spec 04 feed would have had the same bug.

### Changed
- `apps/api`: `updateGroup`, `archiveGroup`, `unarchiveGroup`, `deleteGroup`, `memberIds`; routes; activity types; `delete()` on the test browser; `group-lifecycle.test.ts` (5 tests).
- `packages/domain`: `updateGroupInput`.
- `apps/web`: `EditGroupDialog`; Archive, Un-archive and Delete (creator only, with a confirm) on the Group page; "Archived" badge and a separate Archived section in the Groups list.

### Verified
- `pnpm test`: api 40/40. Every new test went red first. The un-archive test went red a second time because of the ordering bug, which was fixed in product code. The suite was then run 3 times with no flakes.
- Typecheck and lint are clean. The end-to-end check runs after Ticket 10.

### Open / Next
- [ ] Ticket 09.

---

## Entry 17 — 2026-10-01 — Ticket 09: leave a Group and remove a member (TDD)

**Participants:** user, Claude Code (Opus 5.5). Seams approved in Entry 15.

### Decided
- `POST /api/groups/:id/leave`: needs a zero Group Balance for me, and more than one member. The last member gets "Archive or delete the group instead". Records `GroupMemberLeft` for everyone who was a member, including the leaver.
- `DELETE /api/groups/:id/members/:personId`: any member, and the target must have a zero Group Balance. Records `GroupMemberRemoved` with the removed person in the audience. Removing yourself is refused ("use Leave"); a target who isn't a member gets 404.
- Friendships made through the Group are kept after leaving or removal.
- **Leaving and removal are allowed in archived Groups.** — **why:** archiving freezes the Group's content, not who belongs to it. (A judgement call; the ticket was silent.)

### Changed
- `apps/api`: `leaveGroup`, `removeGroupMember`, `requireSettledUp`; routes; `group-leave.test.ts` (4 tests).
- `apps/web`: Leave button (with confirm), and Remove on each other member's row (with confirm).

### Verified
- `pnpm test`: api 44/44, every new test went red first. Typecheck and lint are clean. The end-to-end check runs after Ticket 10.

### Open / Next
- [ ] Ticket 10.
