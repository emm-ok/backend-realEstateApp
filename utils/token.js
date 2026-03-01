import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import crypto from "crypto";

export const generateAccessToken = (payload) => {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: "30m",
    })
}

export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: "7d",
    })
}



export const generateEmailToken = () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

    return { rawToken, hashedToken };
}