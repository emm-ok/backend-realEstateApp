import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";

import {
  createCompanyApplication,
  getMyCompanyApplication,
  updateCompanyApplicationDraft,
  submitCompanyApplication,
  uploadCompanyDocument,
  archiveCompanyApplication,
  approveCompanyApplication,
  rejectCompanyApplication,
  getCompanyApplications,
  getCompanyApplicationById,
} from "./companyApplication.controller.js";
import { requireSuperAdmin} from "../../middlewares/admin.middleware.js"

const companyApplicationRouter = Router();

companyApplicationRouter.post("/", protect, createCompanyApplication);
companyApplicationRouter.get("/me", protect, getMyCompanyApplication);
companyApplicationRouter.put("/me", protect, updateCompanyApplicationDraft);
companyApplicationRouter.post("/me/documents/:type", protect, upload.single("file"), uploadCompanyDocument);
companyApplicationRouter.post("/me/submit", protect, submitCompanyApplication);
companyApplicationRouter.delete("/me", protect, archiveCompanyApplication);


companyApplicationRouter.get(
  "/",
  protect,
  requireSuperAdmin,
  getCompanyApplications
);
companyApplicationRouter.get(
  "/:applicationId",
  protect,
  requireSuperAdmin,
  getCompanyApplicationById
);
companyApplicationRouter.patch(
  "/:applicationId/approve",
  protect,
  requireSuperAdmin,
  approveCompanyApplication
);

companyApplicationRouter.patch(
  "/:applicationId/reject",
  protect,
  requireSuperAdmin,
  rejectCompanyApplication
);

export default companyApplicationRouter;
