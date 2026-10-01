# Bill Splitting

An app where people record shared expenses, split them among friends, see who owes whom, and nudge each other to settle up without chasing anyone manually.

## People

**User**:
A person with an account in the app.
_Avoid_: Account, member (when meaning a person in general)

**Friend**:
A User (or Invited Person) with whom a User has a mutual connection, allowing expenses to be shared between them outside any Group.
_Avoid_: Contact, connection

**Invited Person**:
Someone added by email who has not yet signed up; they can take part in Expenses and become a User on sign-up, keeping their history.
_Avoid_: Ghost user, placeholder, pending user

**Group**:
A named set of Group Members who share Expenses together (e.g. "Goa Trip", "Flat 4B").
_Avoid_: Circle, team, party

**Group Member**:
A User or Invited Person who belongs to a Group.

## Money

**Expense**:
A single bill paid by one Payer and divided among Participants by a Split.
_Avoid_: Bill (in code/UI labels), charge

**Payer**:
The person who paid the full amount of an Expense up front.

**Participant**:
A person who consumed part of an Expense and so takes on a Share of it. The Payer may or may not be a Participant.

**Split**:
The rule dividing an Expense among its Participants: Equal, Exact Amounts, Percentage, or Shares.
_Avoid_: Division, breakdown

**Share**:
The amount of an Expense a single Participant is responsible for, after the Split is applied.
_Avoid_: Portion, cut

**Share Units**:
The relative weights used by the Shares split method (e.g. 2 units vs 1 unit).
_Avoid_: Weights, ratio

**Settlement**:
A record that one person paid another to reduce what they owe. The app records it; it does not move money.
_Avoid_: Payment (ambiguous with paying an Expense), repayment, transfer

**Settlement Allocation**:
The part of one Settlement applied to a particular Group, or to non-group Debts, between the same two people.

**Transaction**:
A single entry in the Ledger: either an Expense or a Settlement.
_Avoid_: Entry, record, ledger entry

**Ledger**:
The full, append-only history of Transactions from which every balance is derived.

**Spend**:
What a person consumed: the sum of their Shares over a period.
_Avoid_: Spending (when meaning money handed over), cost

**Paid Out**:
Money that left a person's pocket: the full amount of Expenses they paid, plus Settlements they paid.
_Avoid_: Spend, outflow, cash out

## Balances

**Debt**:
The amount one person owes another arising from a single Expense (a Participant's Share, owed to the Payer).

**Net Balance**:
What two people owe each other after all Debts and Settlements between them are offset against each other, across every Group and outside any Group.
_Avoid_: Total owed, outstanding

**Group Balance**:
A Group Member's net position against the Group as a whole: what they are owed by, or owe to, all other members combined.
_Avoid_: Group total

**Group Debt**:
What one Group Member owes another within a single Group, after offsetting their Debts and Settlement Allocations in that Group.

**Overall Balance**:
The sum of a User's Net Balances with all other people: positive means they are owed, negative means they owe.

**Settled Up**:
The state in which a Net Balance (or Group Balance) is exactly zero.

## Engagement

**Nudge**:
A reminder a creditor sends to a debtor asking them to settle a Net Balance.
_Avoid_: Reminder (for the user-initiated action), poke, ping

**Activity**:
A recorded, user-visible event in the app (expense added, settlement recorded, member joined, etc.).
_Avoid_: Log, history entry

**Notification**:
An Activity as seen by one person it involves, other than the person who caused it.
