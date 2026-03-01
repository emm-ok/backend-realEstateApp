import Bookmark from "./bookmark.model.js";
import Listings from "../listing/listing.model.js";

// GET /api/bookmarks?page=&limit=
export const getMyBookmarks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      Bookmark.find({ user: req.user._id, isDeleted: false })
        .populate({
          path: "listing",
          populate: {
            path: "agentId",
            populate: {
              path: "userId",
              select: "name email", // fields from User
            },
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Bookmark.countDocuments({ user: req.user._id, isDeleted: false }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      bookmarks,
      page,
      totalPages,
      total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookmarks",
    });
  }
};

// POST /api/bookmarks
export const createBookmark = async (req, res) => {
  try {
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: "Listing ID is required",
      });
    }

    const listingExists = await Listings.findById(listingId);
    if (!listingExists) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    let bookmark = await Bookmark.findOne({
      user: req.user._id,
      listing: listingId,
    });

    if (bookmark) {
      if (bookmark.isDeleted) {
        // Restore soft-deleted bookmark
        bookmark.isDeleted = false;
        bookmark.deletedAt = null;
        await bookmark.save();

        await Listings.findByIdAndUpdate(listingId, {
          $inc: { bookmarkCount: 1 },
        });

        return res.status(200).json({
          success: true,
          message: "Bookmarked successful",
          bookmark,
        });
      }

      return res.status(400).json({
        success: false,
        message: "Listing already bookmarked",
      });
    }

    // Create new bookmark
    bookmark = await Bookmark.create({
      user: req.user._id,
      listing: listingId,
    });

    await Listings.findByIdAndUpdate(listingId, {
      $inc: { bookmarkCount: 1 },
    });

    return res.status(201).json({
      success: true,
      message: "Listing bookmarked successfully",
      bookmark,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create bookmark",
    });
  }
};

// DELETE /api/bookmarks/listing/:listingId
export const deleteBookmarkByListing = async (req, res) => {
  try {
    const { listingId } = req.params;

    const bookmark = await Bookmark.findOne({
      user: req.user._id,
      listing: listingId,
      isDeleted: false,
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: "Bookmark not found or already removed",
      });
    }

    // Soft delete
    bookmark.isDeleted = true;
    bookmark.deletedAt = new Date();
    await bookmark.save();

    // Decrement bookmark count
    await Listings.findOneAndUpdate(
      { _id: listingId, bookmarkCount: { $gt: 0 } },
      { $inc: { bookmarkCount: -1 } },
    );

    return res.status(200).json({
      success: true,
      message: "Bookmark removed successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove bookmark",
    });
  }
};
