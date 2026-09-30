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
export const userCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  password: z.string().min(6).optional(),
});
