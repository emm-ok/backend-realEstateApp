import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video");

    return {
      folder: isVideo ? "listing-videos" : "listing-images",
      resource_type: isVideo ? "video" : "image",
      allowed_formats: isVideo
        ? ["mp4", "mov", "webm"]
        : ["jpg", "jpeg", "png", "webp"],
      transformation: isVideo
        ? [{ quality: "auto", fetch_format: "mp4" }]
        : [{ quality: "auto", fetch_format: "auto" }],
    };
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB for videos
  },
});
