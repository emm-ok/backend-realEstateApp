import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    public_id: {
      type: String,
      required: true,
    },
  },
  { _id: true },
);

const ListingApplicationSchema = new mongoose.Schema(
  {
    // RELATIONSHIPS
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },

    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listings",
    },

    // BASIC INFO
    title: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
    },

    // PRICING
    price: {
      type: Number,
    },

    currency: {
      type: String,
      default: "USD",
    },

    rentalFrequency: {
      type: String,
      enum: ["monthly", "yearly"],
    },

    // CLASSIFICATION
    type: {
      type: String,
      enum: ["apartment", "land", "commercial", "house", "villa", "townhouse"],
      default: null,
    },

    listingType: {
      type: String,
      enum: ["for_sale", "for_rent"],
      default: null,
    },

    condition: {
      type: String,
      enum: ["new", "used", "renovated"],
    },

    bedrooms: Number,
    bathrooms: Number,
    parkingSpaces: Number,
    areaSize: Number,
    areaUnit: {
      type: String,
      enum: ["sqm", "sqft"],
      default: "sqm",
    },
    lotSize: Number,
    yearBuilt: Number,

    furnishing: {
      type: String,
      enum: ["furnished", "semi_furnished", "unfurnished"],
    },

    // LOCATION
    location: {
      address: String,
      city: { type: String, index: true },
      state: String,
      country: String,
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
        },
      },
    },

    // MEDIA
    amenities: [String],
    images: [mediaSchema],
    videos: [mediaSchema],

    // MODERATION
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
      index: true,
    },

    currentStep: {
      type: Number,
      default: 1,
    },

    version: {
      type: Number,
      default: 1,
    },

    rejectionReason: String,
    submittedAt: Date,
    reviewedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,

    history: [
      {
        action: String,
        by: mongoose.Schema.Types.ObjectId,
        at: Date,
        note: String,
      },
    ],
    expiresAt: Date,
  },
  { timestamps: true },
);

const ListingApplication = mongoose.model(
  "ListingApplication",
  ListingApplicationSchema,
);

export default ListingApplication;
