import mongoose from "mongoose";
import { env } from "./env.js"

export const connectToDatabase = async () => {
    try{
        await mongoose.connect(env.MONGO_URI)
        console.log(`Connected to database in ${env.NODE_ENV} mode`);
    } catch(error){
        console.error("Error connecting to the database:", error)
        process.exit(1);
    }
}