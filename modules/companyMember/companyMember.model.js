import mongoose from "mongoose";

export const COMPANY_MEMBER_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  AGENT: "agent",
  MEMBER: "member",
};

const companyMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: Object.values(COMPANY_MEMBER_ROLES),
      default: COMPANY_MEMBER_ROLES.MEMBER,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isSuspended: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent duplicate membership
companyMemberSchema.index({ user: 1, company: 1 }, { unique: true });

const CompanyMember = mongoose.model("CompanyMember", companyMemberSchema);

export default CompanyMember;