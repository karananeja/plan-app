# 01 — Friends & Groups

- Spec: [docs/specs/01-friends-and-groups.md](../../docs/specs/01-friends-and-groups.md)
- Conversation log: [docs/conversation-logs/01-friends-and-groups.md](../../docs/conversation-logs/01-friends-and-groups.md)
- Tickets: [issues/](./issues/)

## Ticket graph

```
01 scaffold
└─ 02 email+password sign-in & profile
   ├─ 03 Google sign-in
   └─ 04 add Friend & Friends list
      ├─ 05 claim invite on verified email
      ├─ 06 create & list Groups
      │  ├─ 07 add Group members
      │  ├─ 08 edit / archive / delete Group
      │  ├─ 09 leave Group & remove member
      │  └─ 10 remove Friend  (also blocked by 04)
```

## Notes

- Balance checks go through a **Balances interface** that reports zero until Spec 03 provides the real one (there are no Transactions yet). Spec 03 tickets add the "blocked when non-zero" tests.
- Criteria that need Expenses moved to Spec 02. See "Carried over from Spec 01" in that spec.
