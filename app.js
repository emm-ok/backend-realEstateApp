import express from "express";

import cors from "cors";
import { env } from "./config/env.js";
import morgan from "morgan";
import cookieParser from "cookie-parser"
import { errorMiddleware } from "./middlewares/error.middleware.js"
import { connectToDatabase } from "./config/db.js";
import { authLimiter } from "./middlewares/rateLimit.middleware.js";

import passport from "passport";
import "./config/passport.js";

import authRouter from "./modules/auth/auth.routes.js"
import userRouter from "./modules/user/user.routes.js"
import agentRouter from "./modules/agent/agent.routes.js"
import companyRouter from "./modules/company/company.routes.js"
import companyMemberRouter from "./modules/companyMember/companyMember.routes.js";
import agentApplicationRouter from "./modules/agentApplication/agentApplication.routes.js";
import listingsRouter from "./modules/listing/listing.routes.js";
import companyApplicationRouter from "./modules/companyApplication/companyApplication.routes.js";
import listingsApplicationRouter from "./modules/listingApplication/listingApplication.routes.js";
import bookmarkRouter from "./modules/bookmark/bookmark.routes.js";

const app = express();

app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(authLimiter);
app.use(passport.initialize());

app.use("/api/auth", authRouter);;
app.use("/api/users", userRouter);
app.use("/api/agent-applications", agentApplicationRouter);
app.use("/api/agents", agentRouter);
app.use("/api/companies", companyRouter);
app.use("/api/company-members", companyMemberRouter);
app.use("/api/company-applications", companyApplicationRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/listing-applications", listingsApplicationRouter);
app.use('/api/bookmarks', bookmarkRouter);
// app.use("/api/dashboard", dashboardRouter);

app.use(errorMiddleware);

app.get("/test-cookie", (req, res) => {
    res.cookie("testCookie", "123", {
        httpOnly: true,
        secure: false,
        sameSite: "None",
        path: "/",
    });

    res.json({ ok: true });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        timeStamp: new Date().toISOString(),
    })
});

await connectToDatabase();

app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`)
})













// app.get("/prisma-test", async(req, res) => {
//     try{
//         const result = await prisma.$queryRaw`SELECT 1`
//         res.json({
//             success: true,
//             db: "Connected",
//             result,
//         })
//     } catch(error){
//         res.status(500).json({
//             success: false,
//             db: "Not connected",
//         })
//     }
// })