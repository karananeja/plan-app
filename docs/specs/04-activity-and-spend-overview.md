# Spec 04 — Activity & Spend Overview

> Requirement 2: A user can see their transactions across the app and get an overview of their spending.
> _e.g. I pay friend X and friend Y._
> Log: [conversation-logs/04-activity-and-spend-overview.md](../conversation-logs/04-activity-and-spend-overview.md)

## Problem Statement

My shared spending is spread across Groups and one-off Expenses with different friends. I can't easily answer simple questions: what did I spend on food this month, how much have I paid back to X, what changed since I last opened the app. Balances (Spec 03) tell me where I stand now, but not how I got there or where my money went.

## Solution

Two complementary views:

1. **Transactions**: one chronological, filterable list of every Transaction (Expense or Settlement) I'm involved in, across all Groups and outside them. Each entry shows its effect on me ("you lent $40", "you paid X $25").
2. **Spend Overview**: totals and charts of my spending by month, category, Group and Friend. It opens on **Spend**, with a toggle to **Paid Out**.

It's built on an **Activity** feed that records who did what, which Notifications (Spec 05) also use.

### Spend vs Paid Out

Overviews must keep these apart, because users mix them up (see glossary):

- **Spend**: what I actually consumed: Σ my Shares. This answers "what did I spend on food?"
- **Paid Out**: what left my pocket: Expenses I paid in full plus Settlements I paid. This answers "how much money did I hand over?"

_Example_: I pay a $200 dinner split four ways, then pay X $25 to settle up. Spend = $50. Paid Out = $225.

## User Stories

### Transactions
1. As a User, I want one list of all Expenses and Settlements I'm involved in, newest first, so that I can review my history in one place.
2. As a User, I want each entry to show its effect on me ("you lent $150", "you borrowed $40", "you paid X $25", "X paid you $25"), so that I don't have to work it out.
3. As a User, I want to filter Transactions by date range, so that I can review a specific month.
4. As a User, I want to filter Transactions by Group, so that I can review one trip.
5. As a User, I want to filter Transactions by Friend, so that I can see everything between me and X.
6. As a User, I want to filter Transactions by category, so that I can review e.g. food spend.
7. As a User, I want to filter by type (Expenses only / Settlements only), so that I can see just repayments.
8. As a User, I want to search Transactions by description, so that I can find "Goa hotel".
9. As a User, I want to open any Transaction to see its full detail (Spec 02 / Spec 03), so that I can check it.
10. As a User, I want deleted Expenses and Settlements to be visible (marked deleted) when I opt to show them, so that I can understand balance changes.
11. As a User, I want the list to load quickly and page smoothly however long my history is, so that it stays usable over years.

### Spend Overview
12. As a User, I want to see my total Spend for this month vs last month, so that I can track my spending.
13. As a User, I want to see my Spend broken down by category, so that I know where my money goes.
14. As a User, I want to see spend by Group, so that I know what each trip or household costs me.
15. As a User, I want to see how much I've paid to and received from each Friend over a period, so that I understand my money flows (e.g. paid X $40, paid Y $25).
16. As a User, I want a monthly trend chart for the last 6/12 months, so that I can spot patterns.
17. As a User, I want to switch between Spend and Paid Out views, so that I can answer both questions.
18. As a User, I want each currency shown separately, so that totals are never mixed.
19. As a User, I want to tap a chart segment to see the Transactions behind it, so that every number can be explained.
20. As a User, I want to export my Transactions for a period as CSV, so that I can keep my own records.

### Activity feed
21. As a User, I want an Activity feed of everything that happened involving me (Expenses added/edited/deleted, Settlements, Group changes, Nudges), so that I'm up to date.
22. As a User, I want each Activity item to say who did it and what changed (e.g. "A changed the amount from $80 to $90"), so that edits are transparent.
23. As a User, I want unread Activity highlighted, so that I can see what's new since I last looked.
24. As a Group Member, I want a per-Group Activity feed, so that I can catch up on one Group.

## Implementation Decisions

- **Modules**
  - *Activity*: one Activity record per domain event from Specs 01–03, with the set of people it involves (`audience`). It's written **in the same database transaction** as the change that caused it, so no change can go unrecorded. It's the single source for the feed, and Notifications (Spec 05) are a query over it.
  - *Transactions query*: a read model over the Ledger (Expenses + Settlements) filtered by an involved person. Each row is computed from that person's perspective.
  - *Spend reports*: aggregate queries over the same read model.
- **Activity shape (indicative)**:
  ```
  Activity { id, type, actorId, audience: personId[], groupId?, subjectType, subjectId,
             summary, diff?, occurredAt }
  ActivityRead { personId, lastReadAt }
  ```
  Unread = `occurredAt > lastReadAt`, which avoids one read-flag per item.
- **"Effect on me" calculation**:
  - Expense: if I'm the Payer, `+(total − myShare)` ("you lent"); otherwise `−myShare` ("you borrowed").
  - Settlement: ±amount by direction.
  - This must match the Balances module's sign convention (Spec 03).
- **Spend definitions**:
  - *Spend* = Σ `shareMinor` over Expenses where I'm a Participant.
  - *Paid Out* = Σ `totalMinor` where I'm the Payer + Σ Settlements where I'm `fromId`.
  - Both exclude deleted entries, are grouped by currency, and use the Expense/Settlement `date`, not the creation time.
- **Visibility** follows Spec 01: a Group Member sees all of that Group's Transactions, including ones they weren't part of (shown with a zero effect on them, and filterable out). Non-group Transactions are shown only to the people involved.
- **Pagination**: cursor-based on (`date`, `id`).
- **CSV export columns**: date, type, description, group, category, currency, total, my Share, effect on me, counterparty.

## Testing Decisions

- Test through the query/service seam with Ledger fixtures built via Spec 02/03 APIs.
- Must-cover:
  - The Spend vs Paid Out example above.
  - Effect-on-me signs for Payer, non-Payer, and both Settlement directions.
  - Filter combinations.
  - Deleted entries are excluded by default.
  - Currencies are kept separate.
  - Each event type produces exactly one Activity with the correct audience.
  - Edit Activities carry a correct diff.
  - Unread counts.
- Consistency check: for a pair of people, Σ effect-on-me across all their Transactions equals their Net Balance from Spec 03.
- Prior art: Spec 03 ledger-fixture tests.

## Out of Scope

- Budgets, spending limits and alerts.
- Personal (non-shared) expense tracking.
- Bank or card import.
- PDF reports.

## Further Notes

- The original requirement's example ("I pay friend X and friend Y") is covered by the per-Friend "paid to / received from" view (Story 15) and the Settlement entries in Transactions.
- Activity is the bridge to Spec 05: Notifications are Activities fanned out to the audience (minus the actor) through Channels.
