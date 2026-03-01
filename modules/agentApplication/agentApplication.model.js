import { Schema, model, Types } from "mongoose";

const AgentApplicationSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: [
        "draft",
        "pending",
        "approved",
        "archived",
        "rejected",
        "suspended",
      ],
      default: "draft",
    },

    submittedAt: Date,
    reviewedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    suspendedAt: Date,

    currentStep: Number,
    professional: {
      licenseNumber: {
        type: String,
      },
      licenseCountry: {
        type: String,
      },

      yearsExperience: {
        type: Number,
        min: 0,
        max: 60,
      },

      specialization: {
        type: [String],
        enum: [
          "residential",
          "commercial",
          "luxury",
          "student",
          "shortlet",
          "land",
        ],
      },

      companyName: String,

      website: String,
    },

    documents: {
      idCard: {
        url: String,
        publicId: String,
        verified: { type: Boolean, default: false },
      },

      realEstateLicense: {
        url: String,
        publicId: String,
        verified: { type: Boolean, default: false },
      },

      selfie: {
        url: String,
        publicId: String,
        verified: { type: Boolean, default: false },
      },
    },

    adminReview: {
      reviewerId: {
        type: Types.ObjectId,
        ref: "Admin",
      },
      rejectionReason: String,
      notes: String,
    },

    verification: {
      ipHash: String,
      userAgent: String,
      riskScore: {
        type: Number,
        default: 0,
      },
      // captchaPassed: Boolean,
    },

    history: [
      {
        action: {
          type: String,
          enum: [
            "created",
            "updated",
            "submitted",
            "approved",
            "rejected",
            "suspended",
          ]
        },
        by: {
          type: Types.ObjectId,
          ref: "User",
        },
        at: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
    isArchived: Boolean,

    version: {
      type: Number,
      default: 1,
    }
  },
  { timestamps: true }
);

AgentApplicationSchema.index({ userId: 1 });
AgentApplicationSchema.index({ status: 1 });
AgentApplicationSchema.index({ submittedAt: -1 });

export const AgentApplication = model(
  "AgentApplication",
  AgentApplicationSchema
);
