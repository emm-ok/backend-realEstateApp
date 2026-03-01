import { z } from "zod";

export const changePasswordSchema = z.object({
    currentPassword: z
    .string()
    .min(8, "password must be at least 8; characters"),

    newPassword: z
    .string()
    .min(8, "password must be at least 8; characters"),
})