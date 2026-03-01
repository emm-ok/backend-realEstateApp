import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}.local` })

export const env = {
    PORT: process.env.PORT || 5500,
    NODE_ENV: process.env.NODE_ENV || "development",

    DATABASE_URL: process.env.DATABASE_URL,
    MONGO_URI: process.env.MONGO_URI,

    CLIENT_URL: process.env.CLIENT_URL,

    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,

    APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
    APPLE_CLIENT_SECRET: process.env.APPLE_CLIENT_SECRET,

    SUPER_ADMIN_NAME: process.env.SUPER_ADMIN_NAME,
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
    
    // EMAIL_USER: process.env.EMAIL_USER,
    // EMAIL_PASS: process.env.EMAIL_PASS,
    // EMAIL_HOST: process.env.EMAIL_HOST,
    // EMAIL_PORT: process.env.EMAIL_PORT,
    
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,


    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
}

Object.entries(env).forEach(([key, value]) => {
    if(!value) {
        console.log(`Missing environment variable: ${key}`)
    }
})