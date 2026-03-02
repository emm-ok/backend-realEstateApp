import User from "./user.model.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Listings from "../listing/listing.model.js";
import { env } from "../../config/env.js";
import { sendEmail } from "../../utils/sendEmail.js";
import { changePasswordSchema } from "./changepassword.schema.js";
import { logAdminAction } from "../../utils/logAdminAction.js";
import crypto from "crypto";

// User
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch user from DB to ensure up-to-date data
    const user = await User.findById(userId).select(
        "name email phone company location bio image role bookmarks isActive emailVerified createdAt",
      )
      .populate("bookmarks", "title price location");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};
export const updateCurrentUser = async (req, res) => {
  try {
    const userId = req.user._id;

    // Prevent email updates
    if (req.body.email) {
      delete req.body.email;
    }
    const forbiddenFields = ["role", "password", "isAdmin"];
    forbiddenFields.forEach((f) => {
      delete req.body[f];
    });

    const allowedUpdates = ["name", "phone", "location", "bio", "image"];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile successfully updated",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};
export const deleteCurrentUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Delete user failed",
      error: err.message,
    });
  }
};

// User Actions
// Security
export const changePassword = async (req, res) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error.format());
    }

    const { currentPassword, newPassword } = parsed.data;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const userId = req.user._id;
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);

    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from old password",
      });
    }

    // const salt = await bcrypt.genSalt(12);

    // user.password = await bcrypt.hash(newPassword, salt);
    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully, Please login again",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update Password",
    });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const normalizedEmail = email && email.trim().toLowerCase();
    const user = await User.findOne({ normalizedEmail });

    // Prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: "Account does not exist.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

    await sendEmail({
      to: "okoosiemmanuel@gmail.com",
      subject: "Reset Your Password",
      html: `
        <h2>Password Reset</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" 
           style="padding:10px 20px;background:black;color:white;text-decoration:none;">
           Reset Password
        </a>
        <p>This link expires in 10 minutes.</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Reset email sent",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to send reset email",
    });
  }
};

export const confirmPasswordResetToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token invalid or expired",
      });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};

export const requestEmailVerification = async (req, res) => {
  try {
    if (req.user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    const { rawToken, hashedToken } = generateEmailToken();

    req.emailVerificationToken = hashedToken;
    req.emailVerificationExpires = Date.now() + 15 * 60 * 1000;
    await req.user.save({ validateBeforeSave: false });

    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${rawToken}`;

    await sendEmail({
      to: req.user.email,
      subject: "Verify your email",
      html: `
        <p>Click to verify</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
        <p>Expires in 15 minutes.</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Verification email sent",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send verification email",
    });
  }
};

export const confirmEmailToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token required",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      _id: req.user._id,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Email verification failed",
    });
  }
};

// User Data
export const getBookmarks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    await req.user.populate({
      path: "bookmarks",
      options: {
        skip,
        limit,
        sort: { createdAt: -1 },
      },
    });

    const total = req.user.bookmarks.length;

    return res.status(200).json({
      success: true,
      message: "Fetched bookmarks successfully",
      page,
      total,
      bookmarks: req.user.bookmarks,
    });
  } catch (error) {
    console.error("getBookmarks error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookmarks",
    });
  }
};

export const toggleBookmarks = async (req, res) => {
  try {
    const { listingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const listingExists = await Listings.exists({ _id: listingId });
    if (!listingExists) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    if (!req.user.bookmarks) {
      req.user.bookmarks = [];
    }

    const index = req.user.bookmarks.findIndex(
      (id) => id.toString() === listingId,
    );

    let action;

    if (index === -1) {
      req.user.bookmarks.push(listingId);
      action = "added";
    } else {
      req.user.bookmarks.splice(index, 1);
      action = "removed";
    }

    await req.user.save();

    return res.status(200).json({
      success: true,
      message: `Bookmark ${action}`,
      action,
      bookmarks: req.user.bookmarks.length,
    });
  } catch (error) {
    console.error("toggleBookmarks error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle bookmark",
    });
  }
};

export const getMyMessages = async (req, res) => {};
export const getMyReviews = async (req, res) => {};

// Admin actions
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    if (!users) {
      return res.status(404).json({
        success: true,
        message: "Users not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "fetched users successfully",
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to fetch users",
    });
  }
};
export const getUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Fetched user by id successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user by id",
    });
  }
};
export const updateUserById = async (req, res) => {
  try {
    const admin = req.admin;
    const userId = req.params.id;

    const forbiddenFields = ["password", "role", "isAdmin"];

    const updates = {};
    Object.keys(req.body).forEach((field) => {
      if (!forbiddenFields.includes(field)) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await logAdminAction({
      req,
      targetUser: userId,
      action: "UPDATE_USER",
      notes: "User updated",
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};
export const suspendUserById = async (req, res) => {
  try {
    const admin = req.admin;
    const userId = req.params.id;
    const { suspend } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isSuspended = suspend;
    await user.save();

    await logAdminAction({
      req,
      targetUser: userId,
      action: "SUSPEND_USER",
      notes: "User suspended",
    });

    return res.status(200).json({
      success: true,
      message: `${suspend ? "Suspended" : "Reactivated"} user ${user._id}`,
      user,
    });
  } catch (error) {
    console.error("suspendUserById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to suspend/reactivate user",
    });
  }
};
