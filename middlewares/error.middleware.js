import { env } from "../config/env.js";

export const errorMiddleware = (err, req, res, next) => {
    let error = {...err };

    error.message = err.message;

    console.error(err);

    // Mogoose Bad ObjectId
    if(err.name === "CastError") {
        const message = "Resource not found";
        error = new Error(message);
        error.statusCode = 404;
    }

    if(err.code === 11000) {
        const message = "Duplicate field values entered";
        error = new Error(message);
        error.statusCode = 404;
    }

    if(err.name === "ValidationError") {
        const message = Object.values(err.errors).map(val => val.message);
        error = new Error(message.join(', '));
        error.statusCode = 404;
    }

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: env.NODE_ENV === "production" ? undefined : err.stack,
    })
}