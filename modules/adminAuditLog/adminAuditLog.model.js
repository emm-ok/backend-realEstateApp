import mongoose from "mongoose";
import crypto from "crypto";

const adminAuditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    targetCompany: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    action: { type: String, required: true },
    notes: { type: String },
    ipHash: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

adminAuditLogSchema.pre("save", function () {
  if (!this.ipHash && this.isNew) {
    this.ipHash = crypto.createHash("sha256").update(this._id.toString()).digest("hex");
  }
});

const AdminAuditLog = mongoose.model("AdminAuditLog", adminAuditLogSchema);
export default AdminAuditLog;
