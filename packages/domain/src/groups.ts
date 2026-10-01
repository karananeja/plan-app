import { z } from "zod";
import { currencyCode } from "./profile.ts";

export const GROUP_TYPES = ["trip", "home", "couple", "other"] as const;
export type GroupType = (typeof GROUP_TYPES)[number];

/** Group colours are named, so the UI can map each to light and dark theme shades. */
export const GROUP_COLOURS = ["slate", "red", "orange", "amber", "green", "teal", "blue", "violet"] as const;
export type GroupColour = (typeof GROUP_COLOURS)[number];

export const DEFAULT_GROUP_EMOJI: Record<GroupType, string> = { trip: "✈️", home: "🏠", couple: "❤️", other: "👥" };

export const createGroupInput = z.object({
  name: z.string().trim().min(1).max(60),
  type: z.enum(GROUP_TYPES).default("other"),
  emoji: z.string().trim().min(1).max(16).optional(),
  colour: z.enum(GROUP_COLOURS).default("slate"),
  /** Defaults to the creator's profile currency. */
  currency: currencyCode.optional(),
  /** Initial members besides the creator: Friends, other Users, or new emails (invited). */
  memberEmails: z.array(z.string().trim().email()).max(50).default([]),
});
export type CreateGroupInput = z.infer<typeof createGroupInput>;

export const addGroupMembersInput = z.object({
  emails: z.array(z.string().trim().email()).min(1).max(50),
});
export type AddGroupMembersInput = z.infer<typeof addGroupMembersInput>;

export const updateGroupInput = z
  .object({
    name: z.string().trim().min(1).max(60),
    emoji: z.string().trim().min(1).max(16),
    colour: z.enum(GROUP_COLOURS),
    currency: currencyCode,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to change");
export type UpdateGroupInput = z.infer<typeof updateGroupInput>;
