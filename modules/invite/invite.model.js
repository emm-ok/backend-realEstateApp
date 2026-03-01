import mongoose from "mongoose";
import { COMPANY_MEMBER_ROLES } from "../companyMember/companyMember.model.js";

const inviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    role: {
      type: String,
      enum: Object.keys(COMPANY_MEMBER_ROLES),
      required: true,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyMember",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "revoked"],
      default: "pending",
      index: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
    },

    createdAt: Date,
    acceptedAt: Date,
    revokedAt: Date,
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyMember",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000), // 7 days from creation
    },
  },
  { timestamps: true },
);

// Index to automatically remove expired invites (optional)
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Invite = mongoose.model("Invite", inviteSchema);
export default Invite;
