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
    
    isSuspended: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: false,
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
