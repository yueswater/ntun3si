import { z } from "zod";

export const createFormSchema = z.object({
    body: z.object({
        eventUid: z
            .string({ required_error: "Event UID is required" })
            .min(1, "Event UID is required"),
        customFields: z.array(z.object({
            label: z.string(),
            type: z.string(),
            required: z.boolean().optional(),
            options: z.array(z.string()).optional(),
        })).optional().default([]),
        maxRegistrations: z.number().int().positive().optional().nullable(),
        registrationDeadline: z.string().optional().nullable(),
        confirmationMessage: z.string().optional().default(""),
    }),
});

export const updateFormSchema = z.object({
    body: z.object({
        customFields: z.array(z.object({
            label: z.string(),
            type: z.string(),
            required: z.boolean().optional(),
            options: z.array(z.string()).optional(),
        })).optional(),
        maxRegistrations: z.number().int().positive().optional().nullable(),
        registrationDeadline: z.string().optional().nullable(),
        confirmationMessage: z.string().optional(),
        isActive: z.boolean().optional(),
    }),
});
