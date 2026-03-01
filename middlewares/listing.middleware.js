import mongoose from "mongoose";
import Listings from "../modules/listing/listing.model.js";

/**
 * Middleware to ensure the current agent owns the listing
 */
export const listingOwnerOnly = async (req, res, next) => {
  try {
    const { listingId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listing id",
      });
    }

    // Fetch listing
    const listing = await Listings.findById(listingId);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    // Check ownership using req.agent
    if (!req.agent || listing.agentId.toString() !== req.agent._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not the owner of this listing",
      });
    }

    // Attach listing to request for downstream controllers
    req.listing = listing;
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
