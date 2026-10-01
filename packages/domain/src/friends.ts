import { z } from "zod";

export const addFriendInput = z.object({ email: z.string().trim().email() });
export type AddFriendInput = z.infer<typeof addFriendInput>;
