import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    public_id: {
      type: String,
      required: true,
    },
  },
  { _id: true }
);

const ListingSchema = new mongoose.Schema(
  {
    // BASIC INFO
    title: {
      type: String,
      required: true,
      trim: true,
      index: "text",
    },

    description: {
      type: String,
      index: "text",
    },

    slug: {
      type: String,
      // required: true,
      unique: true,
      index: true,
    },

    // PRICING
    price: {
      type: Number,
      required: true,
      index: true,
    },

    currency: {
      type: String,
      default: "USD",
    },

    rentalFrequency: {
      type: String,
      enum: ["monthly", "yearly"],
    },

    type: {
      type: String,
      enum: ["apartment", "land", "commercial", "house", "villa", "townhouse"],
      required: true,
      index: true,
    },

    listingType: {
      type: String,
      enum: ["for_sale", "for_rent"],
      required: true,
      index: true,
    },

    condition: String,
    bedrooms: Number,
    bathrooms: Number,
    parkingSpaces: Number,
    areaSize: Number,
    areaUnit: String,
    lotSize: Number,
    yearBuilt: Number,
    furnishing: String,

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
          index: "2dsphere",
        },
      },
    },

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

    // MEDIA
    amenities: [String],
    images: [mediaSchema],
    videos: [mediaSchema],

    isActive: {
      type: Boolean,
      default: false,
    },
    // FLAGS
    isFeatured: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,

    // ANALYTICS
    views: {
      type: Number,
      default: 0,
    },

    bookmarkCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    expiresAt: Date,
  },
  { timestamps: true }
);

ListingSchema.index({ title: "text", description: "text" });

const Listings = mongoose.model("Listings", ListingSchema);

export default Listings;