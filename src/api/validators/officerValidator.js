import { z } from "zod";

export const createOfficerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .min(1, "Name is required")
      .max(100, "Name must be at most 100 characters"),
    title: z
      .string({ required_error: "Title is required" })
      .min(1, "Title is required")
      .max(100, "Title must be at most 100 characters"),
    image: z.string().optional().default(""),
    bio: z.string().max(1000).optional().default(""),
  }),
});

export const updateOfficerSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    title: z.string().min(1).max(100).optional(),
    image: z.string().optional(),
    bio: z.string().max(1000).optional(),
  }),
});
