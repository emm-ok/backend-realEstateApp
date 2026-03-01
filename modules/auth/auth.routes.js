import Router from "express"
import { env } from "../../config/env.js"
import { fetchMe, googleAuth, googleCallback, login, logout, register } from "./auth.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import passport from "passport"

const authRouter = Router()

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
// authRouter.get("/refresh-token", refreshToken);

authRouter.get("/me",  protect, fetchMe)

authRouter.get(
    "/google", 
    googleAuth,
    passport.authenticate(
        "google", 
        { scope: ["profile", "email"] 
    })
)

authRouter.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: `${env.CLIENT_URL}/login`
    }),
    googleCallback
)


export default authRouter