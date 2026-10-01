import { desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { Db, Tx } from "../db/client.ts";
import { activity, activityAudience } from "../db/schema.ts";

export type ActivityType = "FriendAdded" | "PersonInvited" | "InviteClaimed";

export type NewActivity = {
  type: ActivityType;
  actorId: string;
  subject: { type: "person"; id: string };
  audience: string[];
  groupId?: string;
  data?: Record<string, unknown>;
};

/**
 * Records an Activity. Always call it inside the same transaction as the change it describes,
 * so a change and its Activity are saved together or not at all.
 */
export function recordActivity(tx: Tx, a: NewActivity) {
  const id = randomUUID();
  tx.insert(activity)
    .values({
      id,
      type: a.type,
      actorId: a.actorId,
      subjectType: a.subject.type,
      subjectId: a.subject.id,
      groupId: a.groupId ?? null,
      data: a.data ?? null,
      occurredAt: new Date(),
    })
    .run();
  tx.insert(activityAudience)
    .values([...new Set(a.audience)].map((personId) => ({ activityId: id, personId })))
    .run();
}

/** Activity involving a person, newest first. */
export function activityFor(db: Db, personId: string) {
  return db
    .select({
      id: activity.id,
      type: activity.type,
      actorId: activity.actorId,
      subjectType: activity.subjectType,
      subjectId: activity.subjectId,
      groupId: activity.groupId,
      data: activity.data,
      occurredAt: activity.occurredAt,
    })
    .from(activityAudience)
    .innerJoin(activity, eq(activity.id, activityAudience.activityId))
    .where(eq(activityAudience.personId, personId))
    .orderBy(desc(activity.occurredAt))
    .all()
    .map(({ subjectType, subjectId, ...rest }) => ({ ...rest, subject: { type: subjectType, id: subjectId } }));
}
