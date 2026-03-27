import { Router } from "express";
import {
  getAllApprovedListings,
  getListingById,
  updateListing,
  deleteListing,
  searchListings,
  getMyListings,
  featureListing,
} from "./listing.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { agentOnly } from "../../middlewares/agent.middleware.js";
import { listingOwnerOnly } from "../../middlewares/listing.middleware.js";
import { requireSuperAdmin } from "../../middlewares/admin.middleware.js";

const listingsRouter = Router();

// PUBLIC ROUTES
// Get all approved & published listings (paginated + filtered)
listingsRouter.get("/", getAllApprovedListings);

// Search listings (price range, beds, location, etc.)
listingsRouter.get("/search", searchListings);

// Get single listing by ID
listingsRouter.get("/:listingId", getListingById);

//  AGENT ROUTES
// Agent gets their own listings
listingsRouter.get(
  "/agent/me",
  protect,
  agentOnly,
  getMyListings
);

// Agent updates their own listing
listingsRouter.put(
  "/:listingId",
  protect,
  agentOnly,
  listingOwnerOnly,
  updateListing
);
// Agent deletes their own listing
listingsRouter.delete(
  "/:listingId",
  protect,
  agentOnly,
  listingOwnerOnly,
  deleteListing
);

// ADMIN ROUTES
// Admin feature/unfeature listing
listingsRouter.patch(
  "/:listingId/feature",
  protect,
  requireSuperAdmin,
  featureListing
);

export default listingsRouter;