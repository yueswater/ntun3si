import { z } from "zod";

export const submitRegistrationSchema = z.object({
    body: z.object({
        name: z
            .string({ required_error: "Name is required" })
            .min(1, "Name is required")
            .max(100, "Name must be at most 100 characters"),
        email: z
            .string({ required_error: "Email is required" })
            .email("Invalid email format"),
        phone: z.string().max(20).optional().default(""),
        nationality: z.string().max(50).optional().default("中華民國"),
        affiliationType: z.enum(["school", "organization"]).optional().default("school"),
        affiliation: z.string().max(100).optional().default(""),
        customResponses: z.array(z.object({
            label: z.string(),
            value: z.union([z.string(), z.array(z.string())]),
        })).optional().default([]),
    }),
    params: z.object({
        eventUid: z.string().min(1, "Event UID is required"),
    }),
});

export const updateRegistrationStatusSchema = z.object({
    body: z.object({
        status: z.enum(["pending", "confirmed", "cancelled"], {
            required_error: "Status is required",
            invalid_type_error: "Status must be one of: pending, confirmed, cancelled",
        }),
    }),
});
