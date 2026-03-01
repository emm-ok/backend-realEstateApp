import { Router } from "express";
import {
  getMyBookmarks,
  createBookmark,
  deleteBookmarkByListing,
} from "./bookmark.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const bookmarkRouter = Router();

bookmarkRouter.get("/", protect, getMyBookmarks);

bookmarkRouter.post("/", protect, createBookmark);

bookmarkRouter.delete(
  "/listing/:listingId",
  protect,
  deleteBookmarkByListing
);

export default bookmarkRouter;