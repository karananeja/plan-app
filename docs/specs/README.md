# Specs

One spec per feature. Vocabulary follows [GLOSSARY.md](../../GLOSSARY.md). Each spec has a matching implementation conversation log in [`docs/conversation-logs/`](../conversation-logs/).

Specs are ordered by build dependency, not by the order the requirements were first written down. The "Req" column maps back to the original requirement number.

| # | Spec | Req | Depends on | Conversation log |
|---|------|-----|------------|------------------|
| 01 | [Friends & Groups](./01-friends-and-groups.md) | 4 | — | [log](../conversation-logs/01-friends-and-groups.md) |
| 02 | [Expense Splitting & Nudges](./02-expense-splitting-and-nudges.md) | 1 | 01 | [log](../conversation-logs/02-expense-splitting-and-nudges.md) |
| 03 | [Balances & Settlements](./03-balances-and-settlements.md) | 3 | 02 | [log](../conversation-logs/03-balances-and-settlements.md) |
| 04 | [Activity & Spend Overview](./04-activity-and-spend-overview.md) | 2 | 02, 03 | [log](../conversation-logs/04-activity-and-spend-overview.md) |
| 05 | [Notifications](./05-notifications.md) | 5 | 01–04 emit events | [log](../conversation-logs/05-notifications.md) |

## Original requirements

1. A user can ask friends to pay for bills and split them as needed, nudging them through the app instead of reminding them manually. _e.g. I pay for food at a restaurant and split it among 4 people by shares or percentage._
2. A user can see their transactions across the app and get an overview of their spending. _e.g. I pay friend X and friend Y._
3. The app nets out what a user owes and is owed. _e.g. I owe $125 to friend X and X owes me $100, so my net balance is $25 owed to X._
4. A user can create a group, add friends to it, and create splits for expenses within it.
5. Users are notified of any event change in the app.

## Cross-cutting decisions (apply to every spec)

- **Money is stored as integer minor units plus an ISO 4217 currency code.** Never floating point.
- **Balances are derived, never stored as the source of truth.** The Ledger (Expenses + Settlements) is the source of truth; any cached balance must be rebuildable from it.
- **Every state change emits a domain event** (e.g. `ExpenseCreated`). Activity (04) records them and Notifications (05) are read from Activity; features 01–03 don't call notification code directly.
- **Soft delete with history** for Expenses and Settlements, so balances and activity can always be explained.
- **The app never moves money.** Settlements record payments made elsewhere (cash, UPI, bank transfer).

## Current decisions

Grilling rounds 1–5 (2026-10-01). Round 5 replaced the original stack. The full history is in the [conversation logs](../conversation-logs/).

### Product

- **Purpose**: v1 is a **local MVP**. It runs on one machine (`localhost`) and is usable end to end there. Config comes from environment variables so it can be deployed later; deployment is not part of v1.
- **Platform**: a responsive web app.
- **Sign-in**: **Google sign-in** (needs your own OAuth client ID and secret in `.env`) and **email one-time code**. Locally, emails (codes and invites) are printed to the API console. A **seed script** creates several users who sign in with email codes, plus sample Groups and Expenses. Verified email is the key for matching invites.
- **Currency**: one currency per Group and per non-group Expense. No conversion. Default comes from the creator's profile currency (prefilled from their locale).
- **Trust model**: high trust. Any Participant or Group Member can edit or delete Expenses; only the two parties may record a Settlement; nothing needs confirmation; every change is kept in history.
- **Visibility**: Group Transactions are visible to all Group Members, including history from before they joined. Non-group Transactions are visible only to the people involved.
- **Notifications**: **in-app only, by polling** (every 30 s while the tab is visible, and on focus). There's no push and no notification emails. Email is used only for sign-in codes and invites.
- **Nudges**: in-app only. Disabled for Invited Persons.
- **v1 scope**: keep simplify debts and CSV export. Cut receipt photos, the weekly digest, SMS, phone invites, the contact picker, notification preferences/mute, Payment Requests, and account deletion (post-v1 plan: anonymise at zero balances; never hard delete).
- **Vocabulary**: see [GLOSSARY.md](../../GLOSSARY.md). In particular: Transaction, Spend vs Paid Out, Group Balance vs Group Debt, Settlement Allocation.

### Engineering

- **Repo**: a **pnpm workspace**.
  - `apps/web`: React + Vite + **shadcn/ui** + **Tailwind**, with React Query.
  - `apps/api`: **Node.js** + **Hono**, with zod validation. The web app uses Hono's typed RPC client.
  - `packages/domain`: pure logic (split calculator, Settlement Allocation, debt simplifier) plus the zod schemas both apps share.
- **Database**: **SQLite** via **Drizzle + better-sqlite3**. Money is stored as integers; Expense dates are `YYYY-MM-DD` text (the calendar date on the bill).
- **Auth**: **better-auth** (Google + email one-time code) on the same SQLite database. Email goes through an `EmailSender` interface; locally it logs to the console.
- **Events**: services write each Activity row in the same database transaction as the change. Notifications are a query over Activity ([ADR 0004](../adr/0004-notifications-are-a-view-over-activity.md)).
- **Tests**: Vitest.
  - API: service functions called directly against a **fresh in-memory SQLite** per test, with migrations applied.
  - Domain: table-driven + property tests.
  - Web: component tests only for logic-heavy pieces (split editor, notification badge).
  - No end-to-end tests in v1.
- **Code and tickets**: git + a **private** GitHub repo named **`plan-app`**, with tickets as GitHub Issues (via `/setup-matt-pocock-skills`).
- **ADRs**: [0001](../adr/0001-balances-derived-from-ledger.md) balances derived from the Ledger · [0002](../adr/0002-settlement-allocation-oldest-first.md) Settlement Allocation · [0003](../adr/0003-activity-is-the-outbox.md) Activity is the outbox (superseded) · [0004](../adr/0004-notifications-are-a-view-over-activity.md) Notifications are a view over Activity.

## Open questions

None. The design tree was fully covered in grilling rounds 1–5.
