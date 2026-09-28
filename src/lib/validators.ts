import { z } from "zod";

export const conversationUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

export const settingsUpdateSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
  ])
);
