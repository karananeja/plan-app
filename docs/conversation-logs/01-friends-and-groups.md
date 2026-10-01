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
