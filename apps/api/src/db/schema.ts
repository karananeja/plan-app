import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
};

// --- better-auth tables (shapes required by better-auth) ---

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  /** Profile currency (ISO 4217), the default for new Groups and Expenses. */
  currency: text("currency"),
  ...timestamps,
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ...timestamps,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// --- domain tables ---

/**
 * A Person is anyone who can take part in Expenses: a User (status "active")
 * or an Invited Person (status "invited", no user yet). See GLOSSARY.md.
 */
export const person = sqliteTable("person", {
  id: text("id").primaryKey(),
  userId: text("user_id").unique().references(() => user.id),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  status: text("status", { enum: ["invited", "active"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

/** A Friendship is mutual: it's stored as one row in each direction. */
export const friendship = sqliteTable(
  "friendship",
  {
    personId: text("person_id").notNull().references(() => person.id),
    friendId: text("friend_id").notNull().references(() => person.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.personId, t.friendId] })],
);

/** A recorded, user-visible event (see GLOSSARY.md). Written in the same transaction as the change. */
export const activity = sqliteTable(
  "activity",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    actorId: text("actor_id").notNull().references(() => person.id),
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    groupId: text("group_id"),
    /** Event-specific details, e.g. what changed in an edit. JSON. */
    data: text("data", { mode: "json" }).$type<Record<string, unknown>>(),
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("activity_occurred_at_idx").on(t.occurredAt)],
);

/** The people an Activity involves. */
export const activityAudience = sqliteTable(
  "activity_audience",
  {
    activityId: text("activity_id").notNull().references(() => activity.id),
    personId: text("person_id").notNull().references(() => person.id),
  },
  (t) => [primaryKey({ columns: [t.activityId, t.personId] }), index("activity_audience_person_idx").on(t.personId)],
);

/** A named set of Group Members who share Expenses (see GLOSSARY.md). "group" is an SQL keyword, hence the table name. */
export const group = sqliteTable("expense_group", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["trip", "home", "couple", "other"] }).notNull(),
  emoji: text("emoji").notNull(),
  colour: text("colour").notNull(),
  /** ISO 4217. Every Expense in the Group uses it. */
  currency: text("currency").notNull(),
  createdById: text("created_by_id").notNull().references(() => person.id),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const groupMember = sqliteTable(
  "group_member",
  {
    groupId: text("group_id").notNull().references(() => group.id),
    personId: text("person_id").notNull().references(() => person.id),
    joinedAt: integer("joined_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.personId] }), index("group_member_person_idx").on(t.personId)],
);

/** A single bill paid by one Payer and divided among Participants by a Split (see GLOSSARY.md). */
export const expense = sqliteTable(
  "expense",
  {
    id: text("id").primaryKey(),
    /** Null for a non-group Expense. */
    groupId: text("group_id").references(() => group.id),
    description: text("description").notNull(),
    category: text("category").notNull(),
    /** The calendar date on the bill, YYYY-MM-DD, no time zone. */
    date: text("date").notNull(),
    currency: text("currency").notNull(),
    totalMinor: integer("total_minor").notNull(),
    payerId: text("payer_id").notNull().references(() => person.id),
    method: text("method", { enum: ["equal", "exact", "percentage", "shares"] }).notNull(),
    note: text("note"),
    createdById: text("created_by_id").notNull().references(() => person.id),
    /** Optimistic concurrency: incremented on every edit. */
    version: integer("version").notNull().default(1),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("expense_group_idx").on(t.groupId)],
);

/** A Participant's Share of an Expense. `input` is what was typed (amount, basis points or units). */
export const expenseParticipant = sqliteTable(
  "expense_participant",
  {
    expenseId: text("expense_id").notNull().references(() => expense.id),
    personId: text("person_id").notNull().references(() => person.id),
    position: integer("position").notNull(),
    input: integer("input"),
    shareMinor: integer("share_minor").notNull(),
  },
  (t) => [primaryKey({ columns: [t.expenseId, t.personId] }), index("expense_participant_person_idx").on(t.personId)],
);
