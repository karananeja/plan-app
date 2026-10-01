# Spec 03 — Balances & Settlements

> Requirement 3: The app should net out what a user owes against what they are owed.
> _e.g. I owe $125 to friend X and friend X owes me $100, so my net balance is $25 owed to friend X._
> Log: [conversation-logs/03-balances-and-settlements.md](../conversation-logs/03-balances-and-settlements.md)

## Problem Statement

Between friends, money flows both ways: I paid for dinner, they paid for the cab, we split groceries in the flat group and tickets on the trip. Looking at Debts one by one, I can't tell what I actually owe or am owed. Paying them back individually means pointless back-and-forth transfers ($125 one way, $100 the other).

## Solution

The app offsets every Debt between two people, across all Groups and outside any Group, into one **Net Balance** per pair: "You owe X $25" or "X owes you $25". It also shows each Group's balances on their own. When someone pays the other back outside the app, either of them records a **Settlement**, which reduces the Net Balance. Once it reaches zero, they're Settled Up.

### Worked example

| Source | Direction | Amount |
|---|---|---|
| Expense "Trip hotel" (Group: Goa Trip) | I owe X | $125.00 |
| Expense "Dinner" (no Group) | X owes me | $100.00 |
| **Net Balance** | **I owe X** | **$25.00** |

I record a $25 Settlement to X, and the Net Balance becomes $0, Settled Up.

## User Stories

### Seeing balances
1. As a User, I want to see one Net Balance with each Friend, so that I know the single amount to pay or collect.
2. As a User, I want the Net Balance to include Expenses from every Group we share and those outside any Group, so that it's the true figure.
3. As a User, I want to see a breakdown of a Net Balance by Group and non-group, so that I understand where it comes from.
4. As a User, I want to see the list of Expenses and Settlements behind a Net Balance, so that I can verify it.
5. As a User, I want an Overall Balance on my home screen ("you are owed $X", "you owe $Y", total), so that I know my position at a glance.
6. As a User, I want my Friends list split into "owes you" and "you owe", so that I can act on each.
7. As a Group Member, I want to see every member's Group Balance, so that the Group knows who's up and down.
8. As a Group Member, I want to see the Group Debts (who owes whom within the Group), so that I know exactly whom to pay.
9. As a User, I want balances in different currencies shown separately, never added together, so that amounts are never mis-stated.
10. As a User, I want balances to update straight away after any Expense or Settlement change, so that they're always current.

### Settling up
11. As a debtor, I want to record that I paid a Friend, so that my balance goes down.
12. As a creditor, I want to record that a Friend paid me, so that I can mark a debt cleared even if they forget.
13. As a User, I want "Settle up" to prefill the full Net Balance, so that clearing a debt takes one tap.
14. As a User, I want to record a partial Settlement, so that paying in instalments works.
15. As a User, I want to record a Settlement within a Group context, so that it pays off my Group Debt in that Group specifically.
16. As a User, I want a Settlement recorded from a Friend's page to be applied automatically across the Groups where I owe them, so that I don't have to settle Group by Group and my Group Balances stay correct.
17. As a User, I want to note how I paid (cash, UPI, bank transfer, other) and add a note, so that there's a record.
18. As a User, I want to be warned (not blocked) when a Settlement exceeds what's owed, so that I don't flip the balance by mistake.
19. As the other party, I want to be notified when someone records a Settlement involving me, so that I can check it (Spec 05).
20. As the person who recorded a Settlement, I want to edit or delete it, so that mistakes can be fixed.
21. As a User, I want to see "Settled Up" clearly when a balance is zero, so that I know we're even.

### Simplifying
22. As a Group Member, I want an optional "simplify debts" view for the Group that suggests the fewest payments to settle everyone, so that settling a big Group needs fewer transfers.

## Implementation Decisions

- **Modules**
  - *Balances*: a read-side module that derives balances from the Ledger. A deep module behind a small interface.
  - *Settlements*: create/edit/delete Settlements.
  - *Debt simplifier*: a pure function that takes a Group's member balances and returns a minimal-ish list of transfers.
- **Replaces the zero-reporting Balances implementation from Spec 01.** Spec 01's guards (leave Group, remove member, archive Group, remove Friend) gain real-ledger "blocked when non-zero" tests here.
- **Balances are derived.** Per (personA, personB, currency, groupId|null) the pairwise amount = Σ Debts A→B − Σ Debts B→A − Settlement Allocations, from non-deleted Transactions. That's the **Group Debt** when groupId is set, and the non-group amount when it's null. Net Balance = sum over all groupIds for the pair, per currency. **Group Balance** for a member = the sum of their Group Debts with every other member in that Group. A cached projection may be used for speed, but it must be rebuildable from the Ledger and checked against it in tests.
- **Sign convention**: in the Balances interface, a positive amount means *the other person owes me*, and a negative amount means *I owe them*.
- **Settlement shape (indicative)**:
  ```
  Settlement { id, fromId, toId, amountMinor, currency, groupId?, method, note?,
               date, createdBy, version, deletedAt?,
               allocations: [{ groupId | null, amountMinor }] }
  ```
- **Settlement Allocation**:
  - A Settlement recorded **in a Group** is allocated entirely to that Group.
  - A Settlement recorded **from a Friend's page** (no Group) is allocated automatically. Within its currency, it's applied to the buckets where `fromId` owes `toId` (each Group, plus non-group), **oldest outstanding Debt first** by Expense `date`, with ties broken by creation time. Any remainder after all buckets are cleared (overpayment) goes to the non-group bucket.
  - Allocations are computed when the Settlement is recorded and stored with it, so they're auditable and don't shift later. If Expenses are edited afterwards, the stored allocations stay as they are; any difference shows up as a normal balance.
  - Editing a Settlement's amount re-runs its allocation.
  - Σ allocations = the Settlement amount. This is an invariant.
- **Leaving a Group** (Spec 01) requires a zero **Group Balance**. Because Friend-page Settlements are allocated to Groups, settling up with someone from their Friend page also clears your Group Debts with them, which counts toward unblocking.
- **Who may record a Settlement**: only its two parties (`fromId` or `toId`), not other Group Members. **Who may edit/delete it**: its creator. No acceptance step in v1; the other party is notified. (Expenses, by contrast, are editable by any Participant or Group Member.)
- **Overpayment**: allowed with a warning. The balance flips direction.
- **Debt simplification**: greedy matching of the largest creditor with the largest debtor until all are zero. It only applies within a single Group and currency, and it's advisory: it doesn't change the Ledger, it only suggests Settlements.
- **Events emitted**: `SettlementRecorded`, `SettlementUpdated`, `SettlementDeleted`, `BalanceSettledUp` (when a pair's Net Balance becomes zero).
- **API surface (indicative)**: `getNetBalance(personId)`, `getNetBalanceBreakdown(personId)`, `getOverallBalance()`, `getGroupBalances(groupId)`, `getGroupDebts(groupId, {simplified})`, `previewSettlementAllocation(input)`, `recordSettlement(input)`, `updateSettlement(id, version, input)`, `deleteSettlement(id)`.

## Testing Decisions

- Test the Balances module through its public interface with Ledger fixtures: build Expenses and Settlements via the service APIs, then assert on balances.
- Must-cover scenarios:
  - The requirement's $125 / $100 → $25 example.
  - Cross-group netting.
  - Partial settlements.
  - Overpayment flips direction.
  - A third party can't record a Settlement between two other people.
  - Deleting or restoring an Expense updates balances.
  - Multiple currencies stay separate.
  - A Friend-page Settlement is allocated oldest Debt first across Groups.
  - Overpayment remainder goes to the non-group bucket.
  - Stored allocations don't move when an Expense is edited later.
  - Settling from a Friend's page unblocks leaving a Group.
- **Invariant tests**: the Σ of all Group Balances in a Group is always 0. Σ allocations = Settlement amount. Net Balance(A,B) = −Net Balance(B,A). Any cached projection equals the full recompute.
- **Debt simplifier**: table-driven tests on the pure function. Outputs must settle every balance to zero, never create a transfer between two people who are both creditors, and use ≤ n−1 transfers.
- Prior art: Spec 02 service tests and split calculator tests.

## Out of Scope

- Moving real money or integrating payment providers.
- Settlement confirmation or dispute workflows.
- Cross-currency netting or FX conversion.
- Debt simplification across Groups or outside Groups.
- Interest or due dates on debts.

## Further Notes

- Deriving balances from the Ledger means editing an old Expense is always safe. Every number on screen can be explained by listing its Ledger entries (User Story 4).
- Nudges (Spec 02) read the Net Balance from this module. Group Nudges read the Group Balance.
