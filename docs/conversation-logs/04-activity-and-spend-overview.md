# Conversation Log — Activity & Spend Overview

Spec: [../specs/04-activity-and-spend-overview.md](../specs/04-activity-and-spend-overview.md) · Format: [README](./README.md)

---

## Entry 1 — 2026-10-01 — Requirements captured, spec drafted

**Session goal:** Turn the original product requirements into a feature spec.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Requirement 2: as a user, see transactions across the app and get an overview of spending.
- Example given: I pay friend X and friend Y.

### Decided
- Two views: Transactions (a filterable Ledger list from my perspective) and Spend Overview (aggregates). — **why:** covers both "what happened" and "where did my money go".
- Separate "my share" (consumption) from "I paid" (cash out). — **why:** the two are easily confused and answer different questions.
- An Activity module records one entry per domain event with an audience, and powers both the feed and Notifications. — **why:** a single source for "what changed" across Specs 01–05.
- Unread is tracked with a per-person `lastReadAt` rather than a flag on each item. — **why:** cheaper and simpler.

### Changed
- Created `docs/specs/04-activity-and-spend-overview.md`.
- Created `GLOSSARY.md` (shared vocabulary across all specs) and `docs/specs/README.md` (index + cross-cutting decisions).

### Verified
- No code yet. Spec reviewed for consistency with the glossary and the other specs.

### Open / Next
- [ ] Confirm the default overview view ("my share" vs "I paid").
- [ ] Confirm whether CSV export is in v1.
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
- **Transaction** = an Expense or a Settlement (Q11). Removed from Expense's _Avoid_ list.
- **Spend** (Σ own Shares) vs **Paid Out** (Expenses paid + Settlements paid) are now glossary terms, replacing "my share" / "I paid" (Q12).

### Changed
- `docs/specs/04-activity-and-spend-overview.md`: renamed throughout.
- `GLOSSARY.md`: added Transaction, Spend, Paid Out.

### Verified
- Read the changed specs against `GLOSSARY.md` for consistent terms.

### Open / Next
- [ ] Round 2: default overview view; CSV export in v1?

---

## Entry 3 — 2026-10-01 — Grilling round 2 (stack, v1 scope, edge cases)

**Session goal:** Choose the stack and v1 scope, and settle the edge cases raised by round 1.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Round 2 questions Q15–Q22. The user replied: "keep the options as suggested", so all recommendations were accepted.

### Decided
- Stack (Q15): TypeScript, Next.js, Postgres + Drizzle, Auth.js, Vercel + Neon, Inngest/Vercel Cron, Resend. Domain logic in framework-free TS modules. See [specs README](../specs/README.md#product-decisions-grilling-round-2-2026-10-01).
- CSV export stays in v1 (Q16).
- The Spend Overview opens on Spend, with a toggle to Paid Out (Q21).

### Changed
- `docs/specs/04-activity-and-spend-overview.md`: Solution section.

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
- Activity rows are written in the same database transaction as the change, which makes Activity the outbox (Q24). — **why:** every change is recorded atomically, with no extra outbox table.

### Changed
- `docs/specs/04-activity-and-spend-overview.md`: Activity module description.

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
- Group Members see every Transaction in their Groups, even ones they weren't part of, shown with a zero effect and filterable out (Q31).
- ADR 0003, Activity is the outbox (Q33).

### Changed
- `docs/specs/04-activity-and-spend-overview.md`: Visibility decision.
- `docs/adr/0003-activity-is-the-outbox.md`.

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
- Activity is still written in the same transaction as the change, but it is no longer an outbox: Notifications read from it directly (Q46).

### Changed
- `docs/specs/README.md`: decision sections rewritten as "Current decisions".
- `docs/specs/04-activity-and-spend-overview.md`: Activity module description.

### Open / Next
- [ ] The user confirms the overall design, then: git init, private GitHub repo `plan-app`, `/setup-matt-pocock-skills`, tickets, TDD implementation.
