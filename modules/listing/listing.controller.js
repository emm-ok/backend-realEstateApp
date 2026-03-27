import Listings from "./listing.model.js";

export const getAllApprovedListings = async (req, res) => {
  try {
    const {
      type,
      listingType,
      city,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {
      isActive: true,
      isDeleted: false,
    };

    if (type) filter.type = type;
    if (listingType) filter.listingType = listingType;
    if (city) filter["location.city"] = city;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const listings = await Listings.find(filter)
      .select("title location bathrooms bedrooms currency images price video bookmarkCount")
      .populate({
        path: "agentId",
        populate: {
          path: "userId",
          select: "name email", // fields from User
        },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Listings.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Listings fetched successfully",
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit),
      listings,
    });
  } catch (error) {
    console.error("Error fetching listings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch listings",
    });
  }
};

export const getListingById = async (req, res) => {
  try {
    const { listingId } = req.params;

    const listing = await Listings.findOne({
      _id: listingId,
      isDeleted: false,
    }).populate({
      path: "agentId",
      populate: {
        path: "userId",
        select: "name email", // fields from User
      },
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    listing.views += 1;
    await listing.save();

    return res.status(200).json({
      success: true,
      listing,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch listing",
    });
  }
};

export const searchListings = async (req, res) => {
  try {
    const { q, lng, lat, distance = 5000 } = req.query;

    const filter = {
      status: "approved",
      isDeleted: false,
    };

    if (q) {
      filter.$text = { $search: q };
    }

    if (lng && lat) {
      filter["location.coordinates"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: Number(distance),
        },
      };
    }

    const listings = await Listings.find(filter).limit(50);

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
};

export const updateListing = async (req, res) => {
  try {
    const listing = req.listing;

    Object.assign(listing, req.body);

    listing.status = "pending"; // resubmit for approval after update

    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Listing updated & resubmitted",
      listing,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to update listing",
    });
  }
};

export const deleteListing = async (req, res) => {
  try {
    const listing = req.listing;

    listing.isDeleted = true;
    listing.deletedAt = new Date();

    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Listing deleted successfully",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to delete listing",
    });
  }
};

export const getMyListings = async (req, res) => {
  try {
    const listings = await Listings.find({
      agentId: req.agent._id,
      isDeleted: false,
    })
      .populate({
        path: "agentId",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      listings,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your listings",
    });
  }
};

export const featureListing = async (req, res) => {
  try {
    const listing = await Listings.findById(req.params.listingId);

    listing.isFeatured = !listing.isFeatured;

    await listing.save();

    return res.status(200).json({
      success: true,
      message: `Listing ${listing.isFeatured ? "featured" : "unfeatured"} successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update listing feature status",
    });
  }
};
