import mongoose from "mongoose";
import { ALL_ROLES, ROLES } from "../../constants/roles.js";
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 2,
      maxLength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      immutable: true,
    },

    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
      select: false,
      minLength: 6,
    },
    passwordChangedAt: {
      type: Date,
    },  
    passwordResetToken: String,
    passwordResetExpires: Date,

    phone: {
      type: String,
    },

    location: {
      type: String,
    },

    bio: {
      type: String,
      maxLength: 500,
    },

    image: {
      type: String,
      default: null,
    },

    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listings",
        index: true,
        default: null,
      },
    ],
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company", 
      default: null,
      index: true,
    },

    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.USER,
      index: true,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    appleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    provider: {
      type: String,
      enum: ["local", "google", "apple"],
      default: "local",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    lastLoginAt: Date,
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if(!this.isModified("password")) return;
  if(!this.password) return;

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now();
})
const User = mongoose.model("User", userSchema);
export default User;
