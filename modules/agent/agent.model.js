import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },

    agentStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
      index: true,
    },

    profile: {
      phone: String,
      bio: String,
      profileImage: String,
      idDocument: [String],
      areasServed: [String],
      languages: [String],
    },

    ratings: {
      avgRatings: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },

    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Agent = mongoose.model("Agent", agentSchema);
export default Agent;
