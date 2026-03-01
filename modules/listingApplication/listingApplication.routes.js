import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { agentOnly } from "../../middlewares/agent.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";

import {
  createListingApplication,
  getMyListingApplications,
  updateListingApplicationDraft,
  submitListingApplication,
  uploadListingMedia,
  deleteListingMedia,
  deleteListingApplication,
  approveListing,
  rejectListing,
  getAllListingApplications,
  getListingApplicationById,
  getSingleListingApplication,
} from "./listingApplication.controller.js";
import { requireSuperAdmin } from "../../middlewares/admin.middleware.js";

// Router instance
const listingsApplicationRouter = Router();


// Create a new listing (draft mode)
listingsApplicationRouter.post("/", protect, agentOnly, createListingApplication);

// Get all listingsApplication of the logged-in agent
listingsApplicationRouter.get("/me", protect, agentOnly, getMyListingApplications);
listingsApplicationRouter.get("/me/:listingId", protect, agentOnly, getSingleListingApplication);

// Update a draft listing
listingsApplicationRouter.put("/me/:listingId", protect, agentOnly, updateListingApplicationDraft);

// Submit a listing for admin approval
listingsApplicationRouter.post("/me/:listingId/submit", protect, agentOnly, submitListingApplication);

// Upload media (images/videos) for a listing
listingsApplicationRouter.post(
  "/me/:listingId/media/:type",
  protect,
  agentOnly,
  upload.array("files", 10),
  uploadListingMedia
);

listingsApplicationRouter.delete(
  "/me/:listingId/media/:type/:mediaId",
  protect,
  agentOnly,
  deleteListingMedia
);

//delete or delete a listing
listingsApplicationRouter.delete("/me/:listingId", protect, agentOnly, deleteListingApplication);

/* ---------------- Admin Routes ---------------- */

// Get all listingsApplication (admin access)
listingsApplicationRouter.get("/", protect, requireSuperAdmin, getAllListingApplications);

// Get a single listing by ID (admin)
listingsApplicationRouter.get("/:listingId", protect, requireSuperAdmin, getListingApplicationById);

// Approve a listing
listingsApplicationRouter.patch("/:listingId/approve", protect, requireSuperAdmin, approveListing);

// Reject a listing
listingsApplicationRouter.patch("/:listingId/reject", protect, requireSuperAdmin, rejectListing);


export default listingsApplicationRouter;