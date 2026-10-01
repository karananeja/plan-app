# Spec 05 — Notifications

> Requirement 5: Users must be notified of any event change in the app.
> Log: [conversation-logs/05-notifications.md](../conversation-logs/05-notifications.md)
> Revised in grilling round 5: v1 is **in-app only, delivered by polling**. Push, email notifications, preferences and mute are deferred.

## Problem Statement

Shared money only works if everyone knows what changed. Otherwise a friend adds an Expense to the trip Group, or edits the amount, or records that I paid them, and I find out weeks later or never. Nudges (Spec 02) are useless unless they reach the person.

## Solution

Every Activity (Spec 04) that involves me, other than my own actions, is a Notification for me. Notifications live in an in-app notification centre with an unread badge. While the app is open, it polls for new ones. Nothing is sent outside the app in v1. The only emails the app sends are sign-in codes and invites (Spec 01).

## User Stories

1. As a User, I want to be notified when someone adds an Expense that involves me, so that I know I owe or am owed money.
2. As a User, I want to be notified when an Expense involving me is edited, including what changed, so that I can check the new amount.
3. As a User, I want to be notified when an Expense involving me is deleted or restored, so that balance changes don't surprise me.
4. As a User, I want to be notified when someone records a Settlement with me, so that I can confirm I paid or received it.
5. As a User, I want to be notified when someone Nudges me, so that I'm reminded to pay.
6. As a User, I want to be notified when I'm added to or removed from a Group, so that I know which Groups I'm in.
7. As a Group Member, I want to be notified when someone joins, leaves, or is removed from my Group, or when the Group is renamed or archived, so that I'm aware of changes.
8. As a User, I want to be notified when someone adds me as a Friend, so that I know who can split with me.
9. As a User, I want to be notified when a balance with someone becomes Settled Up, so that I know we're even.
10. As a User, I want to never be notified about my own actions, so that I'm not spammed.
11. As a User, I want an in-app notification centre with an unread badge, so that I can catch up whenever I open the app.
12. As a User, I want tapping a notification to open the relevant Expense, Settlement, Group or settle-up screen, so that I can act straight away.
13. As a User, I want to mark one or all notifications as read, so that I can clear my inbox.
14. _(Deferred from v1.)_ As a User, I want to choose per event category whether I get push and/or email, so that I control the noise.
15. _(Deferred from v1.)_ As a User, I want to mute a specific Group, so that a busy Group doesn't overwhelm me while I still get Nudges.
16. As a User, I want new notifications to appear within about 30 seconds while the app is open, and immediately when I come back to the tab, so that time-sensitive things like Nudges are seen.
17. _(Deferred from v1.)_ As a User, I want an optional weekly email summary of my balances and recent Activity, so that I stay informed without constant pings.
18. _(Deferred from v1.)_ As a User, I want rapid edits to the same Expense within a short window collapsed into one push, so that I'm not pinged five times for one fix.
19. _(Deferred from v1.)_ As an Invited Person, I want an email when I'm added to an Expense or Group or Nudged, with a link to join, so that I can see what I owe. (v1 sends only the initial invite email, Spec 01.)
20. _(Deferred from v1.)_ As an Invited Person, I want to be able to unsubscribe from these messages, so that I'm not spammed by an app I haven't joined.
21. _(Deferred from v1.)_ As a User, I want push notifications to stop on a device when I log out of it, so that others using that device don't see my data.
22. _(Deferred from v1.)_ As a User, I want notifications that fail to send to be retried, so that I don't miss important events.

## Implementation Decisions

- **Notifications are a view over Activity** ([ADR 0004](../adr/0004-notifications-are-a-view-over-activity.md)). There is no Notification table and no dispatcher. A person's Notifications are the Activity rows where they're in `audience` and aren't the `actorId`, filtered by Spec 01 visibility.
- **Every event type in Specs 01–03 produces a Notification** for its audience, other than the actor. There's no category or preference filtering in v1.
- **Read state**:
  - `ActivityRead { personId, lastReadAt }` handles mark-all-read.
  - `ActivityReadItem { personId, activityId }` handles marking a single item read.
  - An item is unread if `occurredAt > lastReadAt` and there's no read-item row for it.
- **Polling (client)**: the web app calls `getUnreadCount()` every **30 seconds while the tab is visible**, and once immediately on window focus or visibility change. Polling pauses while the tab is hidden. The list is fetched when the notification centre is opened. React Query's `refetchInterval` and `refetchOnWindowFocus` cover this.
- **Deep links**: each Activity type maps to a client route (Expense, Settlement, Group, a Friend's settle-up screen). The mapping lives in the web app.
- **Nudges** are ordinary Activities (`NudgeSent`) with a highlighted style in the notification centre. Nudging an Invited Person is disabled in v1 (Spec 02).
- **API surface (indicative)**: `GET /notifications?cursor=`, `GET /notifications/unread-count`, `POST /notifications/:activityId/read`, `POST /notifications/read-all`.

## Testing Decisions

- Test through the service seam with in-memory SQLite: perform actions via the Spec 01–03 services as different people, then assert on `listNotifications` / `getUnreadCount` for each person.
- Must-cover:
  - The actor is never notified.
  - Every event type reaches exactly its audience.
  - Visibility rules hide items the person can't see.
  - Mark one read and mark all read, including items arriving after a mark-all.
  - Unread count matches the list.
- Client: one component test showing the badge updates when the polled count changes (fake timers).
- Prior art: Spec 04 Activity tests.

## Out of Scope (v1)

- Push notifications (Web Push), email notifications, and SMS.
- Notification preferences, Group mute, coalescing, delivery retries.
- Real-time transport (WebSockets / SSE). Polling is enough at local scale.
- Weekly digest, quiet hours, rich push actions.
- Real-time chat or comments on Expenses.

## Further Notes

- Adding push or email later means adding a dispatcher that reads Activity, as originally designed in [ADR 0003](../adr/0003-activity-is-the-outbox.md). Feature modules won't need to change, because they already write Activity in the same transaction.
