/**
 * Global error handler middleware.
 * Must be registered AFTER all routes in Express.
 */
export default function errorHandler(err, req, res, _next) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

    const statusCode = err.statusCode || 500;
    const code = err.code || "INTERNAL_ERROR";
    const message =
        process.env.NODE_ENV === "production" && statusCode === 500
            ? "An unexpected error occurred"
            : err.message;

    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
        },
    });
}
