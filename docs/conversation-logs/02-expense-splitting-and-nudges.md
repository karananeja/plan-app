# Conversation Log — Expense Splitting & Nudges

Spec: [../specs/02-expense-splitting-and-nudges.md](../specs/02-expense-splitting-and-nudges.md) · Format: [README](./README.md)

---

## Entry 1 — 2026-10-01 — Requirements captured, spec drafted

**Session goal:** Turn the original product requirements into a feature spec.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Requirement 1: users can ask friends to pay for bills and split them as needed, and nudge them through the app instead of reminding them manually.
- Example given: pay for food at a restaurant and split among 4 people by share or percentage.

### Decided
- Four split methods: Equal, Exact Amounts, Percentage, Share Units. — **why:** covers the "share or percentage" example plus itemised bills.
- Money stored in integer minor units; leftover cents go by largest remainder, ties broken by entry order. — **why:** shares must always sum exactly to the total, deterministically.
- Store both raw split input and computed share. — **why:** old Expenses stay stable and the edit form can show what was typed.
- The split calculator is a pure module with the heaviest test coverage. — **why:** it is the riskiest arithmetic and has no I/O.
- Single Payer per Expense in v1. — **why:** scope; multiple payers deferred.
- "Ask friends to pay" = Debts shown in balances + Nudge; there is no separate payment-request object. — **why:** avoids duplicating balance state.
- Nudge only when the target owes you; 1 per pair per 24h. — **why:** prevents spam and mistaken nudges.

### Changed
- Created `docs/specs/02-expense-splitting-and-nudges.md`.
- Created `GLOSSARY.md` (shared vocabulary across all specs) and `docs/specs/README.md` (index + cross-cutting decisions).

### Verified
- No code yet. Spec reviewed for consistency with the glossary and the other specs.

### Open / Next
- [ ] Confirm the category list (food, travel, rent, utilities, entertainment, other).
- [ ] Confirm the 24h Nudge rate limit.
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
- Rounding: largest remainder, ties by entry order, confirmed (Q8).
- Nudge rules confirmed as specced (Q9).
- A Group Nudge uses each member's **Group Debt** to the nudger (Q14). — **why:** the amount must be what that person owes *you*, not their position against the whole Group.
- **Payment Requests** (collecting money in advance) are out of scope for v1 (Q13). — **why:** a second way to create debt would bring a reconciliation problem.

### Changed
- `docs/specs/02-expense-splitting-and-nudges.md`: Group Nudge rule, Out of Scope.

### Verified
- Read the changed specs against `GLOSSARY.md` for consistent terms.

### Open / Next
- [ ] Round 2: v1 scope for receipt photos.

---

## Entry 3 — 2026-10-01 — Grilling round 2 (stack, v1 scope, edge cases)

**Session goal:** Choose the stack and v1 scope, and settle the edge cases raised by round 1.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Round 2 questions Q15–Q22. The user replied: "keep the options as suggested", so all recommendations were accepted.

### Decided
- Stack (Q15): TypeScript, Next.js, Postgres + Drizzle, Auth.js, Vercel + Neon, Inngest/Vercel Cron, Resend. Domain logic in framework-free TS modules. See [specs README](../specs/README.md#product-decisions-grilling-round-2-2026-10-01).
- Receipt photos cut from v1 (Q16). — **why:** needs file storage and an upload UI.
- Non-group Expense Payer and Participants can be any of the creator's Friends or new Invited Persons. Everyone on the Expense is auto-friended (Q19).
- Nudges to Invited Persons go by email only.

### Changed
- `docs/specs/02-expense-splitting-and-nudges.md`: story 15, story 33, Expense shape (removed `receiptUrl`), validation rule, Out of Scope.

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
- An Expense `date` is a calendar date with no time, in the creator's local time (Q27). — **why:** it's the date on the bill, and it lands in the same month for everyone.

### Changed
- `docs/specs/02-expense-splitting-and-nudges.md`: Expense shape notes.

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
- Non-group Expenses are visible only to the Payer and Participants (Q31).

### Changed
- None in this spec. The visibility rules live in Spec 01.

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
- Nudges are delivered in-app only (Q37). Nudging an Invited Person is disabled in v1 (Q45 b). Story 33 is deferred.
- The split calculator lives in `packages/domain`, shared with the web app for live previews (Q39/Q41).

### Changed
- `docs/specs/README.md`: decision sections rewritten as "Current decisions".
- `docs/specs/02-expense-splitting-and-nudges.md`: story 33, Nudge rules.

### Open / Next
- [ ] The user confirms the overall design, then: git init, private GitHub repo `plan-app`, `/setup-matt-pocock-skills`, tickets, TDD implementation.

---

## Entry 7 — 2026-10-01 — Spec broken into tickets

**Session goal:** Publish Spec 02 as tracer-bullet tickets (`/to-tickets`).
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- `/to-tickets docs/specs/02-expense-splitting-and-nudges.md`. The user accepted decisions A–C and the 9-ticket breakdown ("yes go ahead").

### Decided
- **A. Real Balances are built in Spec 02 (ticket 07)**, derived from Expenses, replacing Spec 01's zero-reporting implementation. Spec 03 adds Settlements on top. — **why:** Nudges need real balances, and story 21 ("balances update immediately") is in this spec. Spec 01's real-ledger guard tests also move here.
- **B. Debtor-side Nudges** appear as a dismissible banner on Home until Spec 05's notification centre exists.
- **C. Friend page** for non-group Expenses and the Nudge button.
- **Spec 01 carry-overs** go in ticket 02 (un-archive on Expense, currency lock, delete block, claimed invite keeps Expenses) and in tickets 02 and 04 (seed Expenses).
- Ticket 01 (split calculator) is a pure prefactor: the deep module everything else uses.

### Changed
- `.scratch/02-expense-splitting-and-nudges/README.md` (graph) and `issues/01`–`09`.
- `docs/specs/02-expense-splitting-and-nudges.md`: real Balances here, the debtor banner, the Friend page, a link to the tickets.
- `docs/specs/03-balances-and-settlements.md`: builds on Spec 02's Balances.

### Open / Next
- [ ] Implement ticket 01 (split calculator) with `/tdd`.
