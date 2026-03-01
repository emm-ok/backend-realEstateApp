import mongoose from "mongoose";
import crypto from "crypto";

const companyApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      name: { type:String, default: "" },
      email: { type:String, default: "" },
      logo: { type:String, default: "" },
      website: { type:String, default: "" },
      address: { type:String, default: "" },
      type: { type:String, default: "" },
      registrationNumber: { type:String, default: "" },
      licenseNumber: { type:String, default: "" },
    },
    documents: {
      registrationCertificate: {
        url: String,
        publicId: String,
        verified: Boolean,
      },
      license: {
        url: String,
        publicId: String,
        verified: Boolean,
      },
      ownerIdCard: {
        url: String,
        publicId: String,
        verified: Boolean,
      },
    },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected", "archived"],
      default: "draft",
    },
    currentStep: {
      type: Number,
      default: 1,
    },
    version: {
      type: Number,
      default: 1,
    },
    verification: {
      ipHash: String,
      userAgent: String,
      riskScore: { type: Number, default: 0 },
    },
    history: [
      {
        action: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: Date,
        note: String,
      },
    ],
    rejectionReason: String,
    submittedAt: Date,
    reviewedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
  },
  { timestamps: true }
);

companyApplicationSchema.pre("save", function () {
  if (!this.verification.ipHash && this.isNew) {
    this.verification.ipHash = crypto.createHash("sha256").update(this._id.toString()).digest("hex");
  }
});

const CompanyApplication = mongoose.model("CompanyApplication", companyApplicationSchema);
export default CompanyApplication;
