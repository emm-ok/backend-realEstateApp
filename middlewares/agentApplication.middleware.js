import { AgentApplication } from "../modules/agentApplication/agentApplication.model.js";

export const ensureNoActiveApplication = async (req, res, next) => {
  const existing = await AgentApplication.findOne({
    userId: req.user._id,
    status: { $in: ["draft", "submitted", "under_review"] },
  });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: "You already have an active agent application",
    });
  }

  next();
};

export const ensureDraftStatus = async (req, res, next) => {
  const app = await AgentApplication.findOne({ userId: req.user._id, status: { $in: ["draft", "rejected"]} });

  if (!app) {
    return res.status(403).json({
      success: false,
      message: "This action is only allowed on draft and rejected applications.",
    });
  }

  req.application = app;
  next();
};

export const ownershipCheck = async (req, res, next) => {
  const app = await AgentApplication.findOne({ userId: req.user._id });

  if (!app) {
    return res.status(404).json({
      success: false,
      message: "Application not found",
    });
  }

  if (app.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  req.application = app;
  next();
};

export const validateDocumentType = async (req, res, next) => {
  const allowed = ["idCard", "realEstateLicense", "selfie"];

  if (!allowed.includes(req.params.type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid document type",
    });
  }

  next();
};
