import { z } from "zod";

export const createArticleSchema = z.object({
    body: z.object({
        title: z
            .string({ required_error: "Title is required" })
            .min(1, "Title is required")
            .max(200, "Title must be at most 200 characters"),
        slug: z
            .string({ required_error: "Slug is required" })
            .min(1, "Slug is required")
            .max(200, "Slug must be at most 200 characters")
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
        content_md: z
            .string()
            .default(""),
        previewImg: z.string().optional().default(""),
        hashtags: z
            .array(z.string().max(30))
            .max(5, "Maximum 5 hashtags allowed")
            .optional()
            .default([]),
    }),
});

export const updateArticleSchema = z.object({
    body: z.object({
        title: z.string().min(1).max(200).optional(),
        slug: z
            .string()
            .max(200)
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
            .optional(),
        content_md: z.string().optional(),
        previewImg: z.string().optional(),
        hashtags: z
            .array(z.string().max(30))
            .max(5, "Maximum 5 hashtags allowed")
            .optional(),
    }),
});
