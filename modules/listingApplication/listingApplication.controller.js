import ListingApplication from "./listingApplication.model.js";
import Listings from "../listing/listing.model.js";
import cloudinary from "../../config/cloudinary.js";
import { logAdminAction } from "../../utils/logAdminAction.js";
import slugify from "slugify";

export const createListingApplication = async (req, res) => {
  try {
    const agentId = req.agent._id;
    const companyId = req.agent.companyId;

    const existingDraft = await ListingApplication.findOne({
      agentId,
      status: "draft",
    });

    if (existingDraft) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a draft listing application. Please edit or submit it.",
      });
    }

    const newListingApplication = await ListingApplication.create({
      agentId,
      companyId,
      status: "draft",
      title: "",
      description: "",
      price: 0,
      images: [],
      videos: [],
      amenities: [],
      location: {},
      views: 0,
      favourites: 0,
      currentStep: 1,
      version: 1,
      history: [
        {
          action: "created",
          by: agentId,
          at: new Date(),
          note: "Listing application started",
        },
      ],
      expiresAt: null,
    });

    return res.status(201).json({
      success: true,
      message: "Listing application created in draft mode",
      newListingApplication,
    });
  } catch (error) {
    console.error("Create listing application error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create listing draft",
    });
  }
};

export const getMyListingApplications = async (req, res) => {
  try {
    const agentId = req.agent._id;

    const listings = await ListingApplication.find({
      agentId,
    })
      .sort({ createdAt: -1 })
      .select("-history") // lighter payload for dashboard
      .lean();

    return res.status(200).json({
      success: true,
      message: "Listing applications retrieved successfully",
      listings: listings || [],
    });
  } catch (error) {
    console.error("Fetch listings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch listing applications",
    });
  }
};
export const getSingleListingApplication = async (req, res) => {
  try {
    const agentId = req.agent._id;
    const { listingId } = req.params;

    const listing = await ListingApplication.findOne({
      _id: listingId,
      agentId,
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Listing application retrieved successfully",
      listing,
    });
  } catch (error) {
    console.error("Fetch single listing error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch listing application",
    });
  }
};
export const updateListingApplicationDraft = async (req, res) => {
  try {
    const agentId = req.agent._id;
    const listingId = req.params.listingId;
    const { listing = {}, currentStep } = req.body;

    // ❗ Remove fields that should NEVER be updated directly
    const {
      history,
      version,
      __v,
      createdAt,
      updatedAt,
      agent,
      ...safeListingData
    } = listing;

    const updatedDraft = await ListingApplication.findOneAndUpdate(
      {
        _id: listingId,
        agentId,
      },
      {
        $set: {
          ...safeListingData,
          ...(currentStep !== undefined && { currentStep }),
        },
        $push: {
          history: {
            action: "updated",
            by: agentId,
            at: new Date(),
            note: "Draft updated",
          },
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedDraft) {
      return res.status(404).json({
        success: false,
        message: "Draft listing application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Draft updated successfully",
      listing: updatedDraft,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update listing draft",
    });
  }
};

export const submitListingApplication = async (req, res) => {
  try {
    const agentId = req.agent._id;
    const { listingId } = req.params;

    const listing = await ListingApplication.findOne({
      _id: listingId,
      agentId,
      status: "draft",
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Draft listing not found",
      });
    }

    const errors = [];

    // Basic Info
    if (!listing.title?.trim()) errors.push("Title required");
    if (!listing.description?.trim()) errors.push("Description required");

    // Pricing
    if (!listing.price || listing.price <= 0)
      errors.push("Valid price required");
    if (!listing.type) errors.push("Listing type required");
    if (!listing.listingType) errors.push("Listing type required");

    if (listing.listingType === "for_rent" && !listing.rentalFrequency) {
      errors.push("Rental frequency required for rental listings");
    }

    // Location
    if (!listing.location?.address) errors.push("Address required");
    if (!listing.location?.city) errors.push("City required");

    // Media
    if (!listing.images || listing.images.length === 0) {
      errors.push("At least one image is required");
    }

    if (errors.length > 0) {
      console.error(errors);
      return res.status(400).json({
        success: false,
        message: "Please fix the following errors",
        errors,
      });
    }

    listing.status = "pending";
    listing.submittedAt = new Date();
    listing.version += 1;

    listing.history.push({
      action: "submitted",
      by: agentId,
      at: new Date(),
      note: "Listing submitted for approval",
    });

    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Listing submitted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit listing",
    });
  }
};

export const uploadListingMedia = async (req, res) => {
  try {
    const agentId = req.agent._id;
    const { listingId, type } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    if (!["image", "video"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid media type. Must be 'image' or 'video'",
      });
    }

    // 2️⃣ Find draft listing
    const listing = await ListingApplication.findOne({
      _id: listingId,
      agentId,
      status: "draft",
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Draft listing not found",
      });
    }

    // 3️⃣ Enforce media limits
    if (type === "image" && listing.images.length >= 20) {
      return res.status(400).json({
        success: false,
        message: "Maximum 20 images allowed",
      });
    }

    if (type === "video" && listing.videos.length >= 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 videos allowed",
      });
    }

    const uploaded = [];

    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "listing-applications",
        resource_type: type === "video" ? "video" : "image",
      });

      uploaded.push({
        public_id: result.public_id,
      });
    }

    listing[type === "image" ? "images" : "videos"].push(...uploaded);

    // 5️⃣ History log
    listing.history.push({
      action: "media_uploaded",
      by: agentId,
      at: new Date(),
      note: `${type} uploaded`,
    });

    await listing.save();

    return res.status(200).json({
      success: true,
      message: `${type} uploaded successfully`,
      media: uploaded,
    });
  } catch (error) {
    console.error("Upload media error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload media",
    });
  }
};

export const deleteListingMedia = async (req, res) => {
  try {
    const agentId = req.agent._id;
    const { listingId, mediaId, type } = req.params;

    if (!["image", "video"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid media type",
      });
    }

    const listing = await ListingApplication.findOne({
      _id: listingId,
      agentId,
      status: "draft",
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Draft listing not found",
      });
    }

    const mediaArray = type === "image" ? listing.images : listing.videos;

    const media = mediaArray.id(mediaId);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    // 1️⃣ Delete from Cloudinary
    await cloudinary.uploader.destroy(media.public_id, {
      resource_type: type === "video" ? "video" : "image",
    });

    // 2️⃣ Remove from MongoDB
    media.deleteOne();

    listing.history.push({
      action: "media_deleted",
      by: agentId,
      at: new Date(),
      note: `${type} deleted`,
    });

    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error) {
    console.error("Delete media error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete media",
    });
  }
};

export const getAllListingApplications = async (req, res) => {
  try {
    const listings = await ListingApplication.find({ status: { $ne: "draft" } })
      .sort({ createdAt: -1 })
      .populate({
        path: "agentId",
        populate: {
          path: "userId",
          select: "name email",
        }
      })
      .lean();

    if (!listings || listings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No listing applications found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Listing applications retrieved successfully",
      listings,
    });
  } catch (error) {
    console.error("Fetch all listings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch listing applications",
    });
  }
};

export const getListingApplicationById = async (req, res) => {
  try {
    const listing = await ListingApplication.findById(req.params.listingId)
      .populate({
        path: "agentId",
        populate: {
          path: "userId",
          select: "name email",
        }
      })
      .lean();

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Listing retrieved successfully",
      listing,
    });
  } catch (error) {
    console.error("Fetch listing by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch listing",
    });
  }
};

export const approveListing = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const listingApp = await ListingApplication.findById(req.params.listingId);

    if (!listingApp) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    if (listingApp.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending listings can be approved",
      });
    }

    const baseSlug = slugify(listingApp.title, {
      lower: true,
      strict: true,
    });

    const slug = `${baseSlug}-${listingApp._id.toString().slice(-6)}`;

    // ✅ 1. Create live listing from application
    const newLiveListing = await Listings.create({
      agentId: listingApp.agentId,
      companyId: listingApp.companyId,
      title: listingApp.title,
      description: listingApp.description,
      price: listingApp.price,
      type: listingApp.type,
      listingType: listingApp.listingType,
      amenities: listingApp.amenities,
      location: listingApp.location,
      images: listingApp.images, // stores only public_id
      videos: listingApp.videos,
      bedrooms: listingApp.bedrooms,
      bathrooms: listingApp.bathrooms,
      parkingSpaces: listingApp.parkingSpaces,
      areaSize: listingApp.areaSize,
      areaUnit: listingApp.areaUnit,
      views: 0,
      favourites: 0,
      isActive: true,
      approvedAt: new Date(),
      slug,
    });

    // ✅ 2. Update application status
    listingApp.status = "approved";
    listingApp.approvedAt = new Date();
    listingApp.liveListingId = newLiveListing._id;

    listingApp.history.push({
      action: "approved",
      by: adminId,
      at: new Date(),
      note: "Listing approved and published",
    });

    await listingApp.save();

    // ✅ 3. Admin audit log
    await logAdminAction({
      req,
      targetUser: listingApp.agentId,
      action: "APPROVE_LISTING_APPLICATION",
      notes: "Listing application approved",
    });

    return res.status(200).json({
      success: true,
      message: "Listing approved and published",
    });
  } catch (error) {
    console.error("Approve listing error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve listing",
    });
  }
};

export const rejectListing = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { reason } = req.body;

    const listing = await ListingApplication.findById(req.params.listingId);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    if (listing.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending listings can be rejected",
      });
    }

    listing.status = "rejected";
    listing.rejectedAt = new Date();
    listing.rejectionReason = reason;

    listing.history.push({
      action: "rejected",
      by: adminId,
      at: new Date(),
      note: `Listing rejected with reason: ${reason}`,
    });

    await listing.save();

    await logAdminAction({
      req,
      targetUser: listing.agentId,
      action: "REJECT_LISTING_APPLICATION",
      notes: "Listing application rejected",
    });

    return res.status(200).json({
      success: true,
      message: "Listing rejected",
    });
  } catch (error) {
    console.error("Reject listing error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject listing",
    });
  }
};

export const deleteListingApplication = async (req, res) => {
  try {
    const agentId = req.agent._id;
    const listingId = req.params.listingId;

    const listing = await ListingApplication.findOne({
      _id: listingId,
      agentId,
      status: "draft",
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Draft not found",
      });
    }
    await listing.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Listing draft deleted",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete listing draft",
    });
  }
};
