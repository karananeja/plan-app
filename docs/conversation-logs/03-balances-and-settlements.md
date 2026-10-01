# Conversation Log — Balances & Settlements

Spec: [../specs/03-balances-and-settlements.md](../specs/03-balances-and-settlements.md) · Format: [README](./README.md)

---

## Entry 1 — 2026-10-01 — Requirements captured, spec drafted

**Session goal:** Turn the original product requirements into a feature spec.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Requirement 3: the app should net out what the user owes against what they are owed.
- Example given: I owe $125 to friend X and X owes me $100, so my net balance is $25 owed to X.

### Decided
- Balances are derived from the Ledger and never stored as the source of truth. — **why:** edits and deletes to old Expenses are always safe and every number is explainable.
- The Net Balance nets across all Groups and non-group Expenses, per currency. — **why:** matches the $125/$100 → $25 example regardless of where the Debts arose.
- Settlements record payments made outside the app; either party may record one; no confirmation step in v1. — **why:** the app does not move money; confirmation flow deferred.
- Leaving a Group checks the Group Balance, not the Net Balance. — **why:** a Group must be settled within itself.
- Debt simplification is advisory, per Group, using a greedy algorithm. — **why:** fewer transfers without rewriting the Ledger.

### Changed
- Created `docs/specs/03-balances-and-settlements.md`.
- Created `GLOSSARY.md` (shared vocabulary across all specs) and `docs/specs/README.md` (index + cross-cutting decisions).

### Verified
- No code yet. Spec reviewed for consistency with the glossary and the other specs.

### Open / Next
- [ ] Confirm whether "simplify debts" is in v1 or should move to Out of Scope.
- [ ] Confirm that overpayment should be allowed (with a warning) rather than blocked.
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
- **Settlement Allocation** (Q7): a Settlement recorded from a Friend's page is spread across the Groups and the non-group bucket, oldest Debt first. The spread is stored with the Settlement. Any overpayment goes to the non-group bucket. — **why:** the user thinks "I paid X back"; this keeps Net Balance and Group Balances consistent and lets them leave Groups.
- **Group Balance** (member vs the whole Group) vs **Group Debt** (member vs one member, within a Group) named separately (Q14). Leaving a Group requires a zero Group Balance.
- Settlements need no confirmation (Q5).

### Changed
- `docs/specs/03-balances-and-settlements.md`: user stories 8/15/16, derivation formula, Settlement shape with `allocations`, allocation rules, leave rule, API, tests, invariants.
- `GLOSSARY.md`: added Settlement Allocation, Group Debt; redefined Group Balance.

### Verified
- Read the changed specs against `GLOSSARY.md` for consistent terms.

### Open / Next
- [ ] Round 2: is "simplify debts" in v1? Overpayment: allow with a warning, or block?
- [ ] Offer an ADR for derived balances + Settlement Allocation.

---

## Entry 3 — 2026-10-01 — Grilling round 2 (stack, v1 scope, edge cases)

**Session goal:** Choose the stack and v1 scope, and settle the edge cases raised by round 1.
**Participants:** user, Claude Code (Opus 5.5)

### Asked
- Round 2 questions Q15–Q22. The user replied: "keep the options as suggested", so all recommendations were accepted.

### Decided
- Stack (Q15): TypeScript, Next.js, Postgres + Drizzle, Auth.js, Vercel + Neon, Inngest/Vercel Cron, Resend. Domain logic in framework-free TS modules. See [specs README](../specs/README.md#product-decisions-grilling-round-2-2026-10-01).
- Simplify debts stays in v1 (Q16). — **why:** a small pure function.
- Overpayment allowed with a warning (Q17).
- Only the two parties may record a Settlement (Q18). — **why:** a Settlement is a private fact between two people, while Expenses are shared facts.
- Two ADRs written (Q22).

### Changed
- `docs/specs/03-balances-and-settlements.md`: who may record a Settlement, a new test case.
- `docs/adr/0001-balances-derived-from-ledger.md`, `docs/adr/0002-settlement-allocation-oldest-first.md`.

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
- Oldest-first allocation breaks ties on the same date by creation time (follows from Q27).

### Changed
- `docs/specs/03-balances-and-settlements.md`: allocation rule.

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
- Non-group Settlements are visible only to their two parties. Within a Group, everyone sees all Group Balances and Group Debts (Q31).

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
- No domain changes. Balances and allocation run on SQLite via Drizzle. The allocation and simplifier are pure functions in `packages/domain`.

### Changed
- `docs/specs/README.md`: decision sections rewritten as "Current decisions".
- None in this spec.

### Open / Next
- [ ] The user confirms the overall design, then: git init, private GitHub repo `plan-app`, `/setup-matt-pocock-skills`, tickets, TDD implementation.
