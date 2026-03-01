import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later",
})

export const sensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: "Too many requests, please try again later",
    }
})

export const agentRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many requests, Try again later",
});