import { z } from "zod";

// ─── User / Auth schemas ───────────────────────────────────

export const registerSchema = z.object({
    body: z.object({
        username: z
            .string({ required_error: "Username is required" })
            .min(2, "Username must be at least 2 characters")
            .max(30, "Username must be at most 30 characters")
            .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
        name: z
            .string({ required_error: "Name is required" })
            .min(1, "Name is required")
            .max(50, "Name must be at most 50 characters"),
        email: z
            .string({ required_error: "Email is required" })
            .email("Invalid email format"),
        password: z
            .string({ required_error: "Password is required" })
            .min(6, "Password must be at least 6 characters")
            .max(128, "Password must be at most 128 characters"),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: "Email or username is required" })
            .min(1, "Email or username is required"),
        password: z
            .string({ required_error: "Password is required" })
            .min(1, "Password is required"),
    }),
});

export const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(50).optional(),
        email: z.string().email("Invalid email format").optional(),
        phone: z.string().max(20).optional(),
        avatar: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
    }),
});
