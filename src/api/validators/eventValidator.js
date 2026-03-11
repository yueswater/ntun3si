import { z } from "zod";

export const createEventSchema = z.object({
    body: z.object({
        title: z
            .string({ required_error: "Title is required" })
            .min(1, "Title is required")
            .max(200, "Title must be at most 200 characters"),
        slug: z
            .string({ required_error: "Slug is required" })
            .min(1, "Slug is required")
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
        description: z.string().optional().default(""),
        date: z.string().optional(),
        endDate: z.string().optional().nullable(),
        location: z.string().max(200).optional().default(""),
        maxParticipants: z.preprocess(
            (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
            z.number().int().positive().optional().nullable()
        ),
        speaker: z.string().max(100).optional().default(""),
        speakerBio: z.string().max(500).optional().default(""),
        notes: z.string().optional().default(""),
        hashtags: z.array(z.string().max(30)).max(5).optional().default([]),
        previewImg: z.string().optional().default(""),
    }),
});

export const updateEventSchema = z.object({
    body: z.object({
        title: z.string().min(1).max(200).optional(),
        slug: z
            .string()
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
            .optional(),
        description: z.string().optional(),
        date: z.string().optional(),
        endDate: z.string().optional().nullable(),
        location: z.string().max(200).optional(),
        maxParticipants: z.preprocess(
            (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
            z.number().int().positive().optional().nullable()
        ),
        speaker: z.string().max(100).optional(),
        speakerBio: z.string().max(500).optional(),
        notes: z.string().optional(),
        hashtags: z.array(z.string().max(30)).max(5).optional(),
        previewImg: z.string().optional(),
    }),
});
