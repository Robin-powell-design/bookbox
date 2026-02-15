import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  orgSlug: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createOrgSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
});

export const classTemplateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6).nullable(),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM format"),
  duration: z.number().min(15).max(480),
  capacity: z.number().min(1).max(100),
  price: z.number().min(0),
  isRecurring: z.boolean(),
  categoryIds: z.array(z.string()).optional(),
});

export const packageSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(0),
  classCount: z.number().min(1).nullable(),
  durationDays: z.number().min(1).nullable(),
  type: z.enum(["BUNDLE", "MONTHLY"]),
});

export const messageSchema = z.object({
  receiverId: z.string(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message body is required"),
});
