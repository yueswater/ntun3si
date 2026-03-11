import { ZodError } from "zod";

/**
 * Creates an Express middleware that validates req against a Zod schema.
 * The schema should define keys for the parts it validates (body, params, query).
 */
export function validate(schema) {
    return (req, res, next) => {
        try {
            schema.parse({
                body: req.body,
                params: req.params,
                query: req.query,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const messages = error.issues.map((e) => ({
                    field: e.path.join("."),
                    message: e.message,
                }));
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Input validation failed",
                        details: messages,
                    },
                });
            }
            next(error);
        }
    };
}
