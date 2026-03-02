import {Router} from "express"
import { protect } from "../../middlewares/auth.middleware.js";
import { 
    changePassword,
    confirmEmailToken,
    confirmPasswordResetToken,
    deleteCurrentUser, 
    getBookmarks, 
    getCurrentUser, 
    getMyMessages, 
    getMyReviews, 
    requestEmailVerification, 
    requestPasswordReset, 
    toggleBookmarks, 
    updateCurrentUser, 
} from "./user.controller.js";
import { requireSuperAdmin } from "../../middlewares/admin.middleware.js";
import { getAllUsers, getUserById, suspendUserById, updateUserById } from "../user/user.controller.js";

const userRouter = Router();
// Profile
userRouter.get("/me", protect, getCurrentUser);
userRouter.patch("/me", protect, updateCurrentUser);
userRouter.delete("/me", protect, deleteCurrentUser);

// Security
userRouter.put("/me/change-password", protect, changePassword);
userRouter.post("/password/forgot", requestPasswordReset);
userRouter.post("/password/reset", confirmPasswordResetToken);

userRouter.post("/me/email/verify", protect, requestEmailVerification);
userRouter.post("/me/email/confirm", protect, confirmEmailToken);

// User Data
userRouter.get("/me/bookmarks", protect, getBookmarks);
userRouter.post("/me/bookmarks/:propertyId", protect, toggleBookmarks);
userRouter.get("/me/messages", protect, getMyMessages);
userRouter.get("/me/reviews", protect, getMyReviews);

// Admin
userRouter.get("/", protect, requireSuperAdmin, getAllUsers);
userRouter.get("/:id", protect, requireSuperAdmin, getUserById);
userRouter.put("/:id", protect, requireSuperAdmin, updateUserById);
userRouter.patch("/:id/suspend", protect, requireSuperAdmin, suspendUserById);


export default userRouter;