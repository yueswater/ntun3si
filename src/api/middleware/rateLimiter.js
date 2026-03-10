import rateLimit from "express-rate-limit";

/**
 * Rate limiter for authentication endpoints (login, register)
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests, please try again later",
        },
    },
});

/**
 * Rate limiter for newsletter subscription
 */
export const newsletterLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many subscription attempts, please try again later",
        },
    },
});

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests, please try again later",
        },
    },
});
