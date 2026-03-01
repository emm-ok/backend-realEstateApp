import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        listingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listings",
            required: true,
            index: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
        },

        comment: String,
    },
    { timestamps: true }
)

// Prevent multiple reviews per user per listing
reviewSchema.index({ listingid: 1, userId: 1}, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;