import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";
import { agentRateLimit } from "../../middlewares/rateLimit.middleware.js";


import {
  ensureNoActiveApplication,
  ensureDraftStatus,
  ownershipCheck,
  validateDocumentType,
} from "../../middlewares/agentApplication.middleware.js";

import {
  createAgentApplication,
  getMyAgentApplication,
  updateAgentApplicationDraft,
  uploadAgentDocument,
  deleteAgentDocument,
  submitAgentApplication,
  archiveAgentApplication,
  getAgentApplicationHistory,
  approveAgentApplication,
  rejectAgentApplication,
  getAgentApplications,
  getAgentApplicationById,
} from "./agentApplication.controller.js";
import { ROLES } from "../../constants/roles.js";
import { requireSuperAdmin } from "../../middlewares/admin.middleware.js";

const agentApplicationRouter = Router();

agentApplicationRouter.post(
  "/",
  protect,
  allowRoles(ROLES.USER),
  agentRateLimit,
  ensureNoActiveApplication,
  createAgentApplication
);

agentApplicationRouter.get(
  "/me",
  protect,
  ownershipCheck,
  getMyAgentApplication
);

agentApplicationRouter.put(
  "/me",
  protect,
  ensureDraftStatus,
  ownershipCheck,
  updateAgentApplicationDraft
);

agentApplicationRouter.post(
  "/me/documents/:type",
  protect,
  ensureDraftStatus,
  ownershipCheck,
  validateDocumentType,
  upload.single("file"),
  uploadAgentDocument
);

agentApplicationRouter.delete(
  "/me/documents/:type",
  protect,
  ensureDraftStatus,
  ownershipCheck,
  validateDocumentType,
  deleteAgentDocument
);

agentApplicationRouter.post(
  "/me/submit",
  protect,
  ensureDraftStatus,
  ownershipCheck,
  submitAgentApplication
);

agentApplicationRouter.delete(
  "/me",
  protect,
  ensureDraftStatus,
  ownershipCheck,
  archiveAgentApplication
);

agentApplicationRouter.get(
  "/me/history",
  protect,
  ownershipCheck,
  getAgentApplicationHistory
);

// Admin actions
agentApplicationRouter.get("/", protect, requireSuperAdmin, getAgentApplications);
agentApplicationRouter.get("/:applicationId", protect, requireSuperAdmin, getAgentApplicationById);
agentApplicationRouter.patch("/:applicationId/approve", protect, requireSuperAdmin, approveAgentApplication);
agentApplicationRouter.patch("/:applicationId/reject", protect, requireSuperAdmin, rejectAgentApplication);



export default agentApplicationRouter;
