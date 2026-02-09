import { z } from "zod";
import { pointConfigSchema } from "./scoring";

export const createCompSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  categories: z.array(z.string().min(1).max(100)).min(1, "At least one category required").optional(),
  defaultPointConfig: pointConfigSchema.optional(),
  closesAt: z.coerce.date().optional().nullable(),
  coAdminEmails: z.array(z.string().email()).optional(),
});

export const updateCompSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED"]).optional(),
  defaultPointConfig: pointConfigSchema.optional(),
  closesAt: z.coerce.date().optional().nullable(),
});

export const createClimbSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  climbNumber: z.number().int().min(1, "Climb number is required"),
  sortOrder: z.number().int().min(0).optional(),
  pointConfig: pointConfigSchema,
});

export const updateClimbSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  climbNumber: z.number().int().min(1).optional(),
  sortOrder: z.number().int().min(0).optional(),
  pointConfig: pointConfigSchema.optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const registerParticipantSchema = z.object({
  displayName: z.string().min(1, "Name is required").max(100),
  deviceId: z.string().uuid(),
  categoryId: z.string().cuid("Category is required"),
});

export const logScoreSchema = z.object({
  participantId: z.string().cuid(),
  climbId: z.string().cuid(),
  attempts: z.number().int().min(1),
  topped: z.boolean(),
});

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
