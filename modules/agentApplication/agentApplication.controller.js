import { ROLES } from "../../constants/roles.js";
import { AgentApplication } from "./agentApplication.model.js";
import crypto from "crypto";
import Agent from "../agent/agent.model.js";
import User from "../user/user.model.js";
import { logAdminAction } from "../../utils/logAdminAction.js";

export const createAgentApplication = async (req, res) => {
  try {
    const userId = req.user._id;

    const existing = await AgentApplication.findOne({
      userId,
      status: { $in: "draft" },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already have an active agent application",
      });
    }

    const application = await AgentApplication.create({
      userId,
      status: "draft",
      currentStep: 1,
      version: 1,
      verification: {
        ipHash: crypto.createHash("sha256").update(req.ip).digest("hex"),
        userAgent: req.headers["user-agent"],
        // captchaPassed: true,
        riskScore: 0,
      },
      history: [
        {
          action: "created",
          by: userId,
          at: new Date(),
          note: "Agent application started",
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Agent application created successfully",
      application,
    });
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "Failed to create agent application",
    });
  }
};
export const getMyAgentApplication = async (req, res) => {
  try {
    const userId = req.user._id;

    const application = await AgentApplication.findOne({
      userId,
      status: { $ne: "approved" },
    }).lean(); // return plain js object (not Mongoose document);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "No agent application found. You can start a new one.",
      });
    }

    const safeApplication = {
      _id: application._id,
      status: application.status,
      createdAt: application.createdAt,
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt,
      approvedAt: application.approvedAt,
      rejectedAt: application.rejectedAt,
      suspendedAt: application.suspendedAt,
      version: application.version,
      professional: application.professional,
      documents: application.documents,
      history: application.history,
      adminReview: application.adminReview,
      currentStep: application.currentStep,
    };

    return res.status(200).json({
      success: true,
      message: "Agent application retrieved successfully",
      application: safeApplication,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your agent application",
    });
  }
};
export const updateAgentApplicationDraft = async (req, res) => {
  try {
    const userId = req.user._id;
    const { professional, currentStep, documents, history, ...otherFields } =
      req.body;

    const application = await AgentApplication.findOne({
      userId,
      status: { $in: ["draft", "rejected"]},
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "No draft application found to update.",
      });
    }

    if (professional) {
      application.professional = {
        ...application.professional.toObject(),
        ...professional,
      };
    }
    if (currentStep) {
      application.currentStep = currentStep;
    }

    if (documents) {
      for (const key of ["idCard", "realEstateLicense", "selfie"]) {
        if (documents[key]) {
          application.documents[key] = {
            ...application.documents[key].toObject(),
            ...documents[key],
          };
        }
      }
    }

    application.version += 1;

    application.history.push({
      action: "updated",
      by: userId,
      at: new Date(),
      note: "Draft updated",
    });

    await application.save();

    return res.status(200).json({
      success: true,
      message: "Agent application draft updated successfully",
      application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update agent application draft",
    });
  }
};
export const uploadAgentDocument = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.params;

    const allowedTypes = ["idCard", "realEstateLicense", "selfie"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        message: "invalid document type",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const application = await AgentApplication.findOne({
      userId,
      status: "draft",
    });

    if (!application) {
      return res.status(404).json({
        message: "No draft application found",
      });
    }

    application.documents[type] = {
      url: req.file.path,
      publicId: req.file.filename,
      verified: false,
    };

    application.history.push({
      action: "updated",
      by: userId,
      at: new Date(),
      note: `Uploaded ${type} document`,
    });

    await application.save();

    res.status(200).json({
      message: "Document uploaded successfully.",
      document: application.documents[type],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to upload document",
    });
  }
};
export const deleteAgentDocument = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.params;

    const application = await AgentApplication.findOne({
      userId,
      status: "draft",
    });

    if (!application) {
      return res.status(404).json({ message: "No draft found" });
    }

    application.documents[type] = {
      url: null,
      publicId: null,
      verified: false,
    };

    application.history.push({
      action: "updated",
      by: userId,
      at: new Date(),
      note: `Deleted ${type} document`,
    });

    await application.save();

    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to delete document" });
  }
};

export const submitAgentApplication = async (req, res) => {
  try {
    const userId = req.user._id;

    const application = await AgentApplication.findOne({
      userId,
      status: { $in: ["draft", "rejected"]},
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "No draft application found to submit",
      });
    }

    const { professional, documents } = application;

    if (!professional?.licenseNumber) {
      return res.status(400).json({ message: "License number is required" });
    }
    if (!professional?.licenseCountry) {
      return res.status(400).json({ message: "License country is required" });
    }
    if (!professional?.yearsExperience) {
      return res
        .status(400)
        .json({ message: "Years of experience is required" });
    }
    if (!professional?.specialization?.length) {
      return res
        .status(400)
        .json({ message: "At least one specialization is required" });
    }
    if (!documents?.idCard?.url) {
      return res.status(400).json({ message: "ID card document is required" });
    }
    if (!documents?.realEstateLicense?.url) {
      return res
        .status(400)
        .json({ message: "Real estate license is required" });
    }
    if (!documents?.selfie?.url) {
      return res
        .status(400)
        .json({ message: "Selfie verification is required" });
    }

    application.status = "pending";
    application.submittedAt = new Date();

    application.history.push({
      action: "submitted",
      by: userId,
      at: new Date(),
      note: "Application submitted for review",
    });

    await application.save();

    return res.status(200).json({
      success: true,
      message:
        "Application submitted successfully. You will be notified after review",
      application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to submit application",
    });
  }
};
export const archiveAgentApplication = async (req, res) => {
  try {
    const userId = req.user._id;

    const application = await AgentApplication.findOne({
      userId,
      status: "draft",
    });

    if (!application) {
      return res.status(404).json({ message: "No draft found" });
    }

    application.status = "archived";

    application.history.push({
      action: "archived",
      by: userId,
      at: new Date(),
      note: "User archived draft",
    });

    await application.save();

    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to archive" });
  }
};

export const getAgentApplicationHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const application = await AgentApplication.findOne({ userId })
      .select(
        "history status submittedAt reviewedAt approvedAt rejectedAt suspendedAt",
      )
      .populate("history.by", "name email");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "No application found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Agent application history fectched successfully",
      status: application.status,
      timeline: {
        submittedAt: application.submittedAt,
        reviewedAt: application.reviewedAt,
        approvedAt: application.approvedAt,
        rejectedAt: application.rejectedAt,
        suspendedAt: application.suspendedAt,
      },
      history: application.history.sort(
        (a, b) => new Date(b.at) - new Date(a.at),
      ),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch application history",
    });
  }
};

// Admin Actions
export const getAgentApplications = async (req, res) => {
  try {
    const applications = await AgentApplication.find({
      status: { $ne: "draft" },
    }).populate("userId");

    if (!applications) {
      return res.status(404).json({
        success: false,
        message: "No applications found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Applications fetched successfully",
      applications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
};

export const getAgentApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application =
      await AgentApplication.findById(applicationId).populate("userId");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Application fetched successfully",
      application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch application",
    });
  }
};

export const approveAgentApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const admin = await User.findById(req.admin._id);
    if (!admin) return res.status(401).json({ success: false });

    const application = await AgentApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false });
    }

    const existingAgent = await Agent.findOne({ userId: application.userId });
    if (existingAgent) {
      console.log("existingAgent", existingAgent);
      return res
        .status(400)
        .json({ success: false, message: "Agent already exists" });
    }

    // Update application first
    application.status = "approved";
    application.approvedAt = new Date();
    application.history.push({
      action: "approved",
      by: admin.user,
      at: new Date(),
      note: "",
    });
    await application.save();

    // Admin log
    await logAdminAction({
      req,
      targetUser: application.userId,
      action: "APPROVE_AGENT_APPLICATION",
      notes: "Approved user",
    });

    // User role
    await User.findByIdAndUpdate(application.userId, {
      role: ROLES.AGENT,
    });

    // LAST step
    const agent = await Agent.create({
      userId: application.userId,
      verified: true,
      agentStatus: "approved",
    });

    return res.status(200).json({
      success: true,
      message: "Agent approved successfully",
      agent,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Approval failed",
    });
  }
};

export const rejectAgentApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { reason } = req.body;

    const admin = await User.findById(req.admin._id);
    if (!admin) return res.status(401).json({ success: false });

    const application = await AgentApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Application already rejected",
      });
    }

    application.status = "rejected";
    application.rejectedAt = new Date();
    application.adminReview = {
      reviewerId: admin.user,
      rejectionReason: reason || "Rejected by admin",
    };

    application.history.push({
      action: "rejected",
      by: admin.user,
      at: new Date(),
      note: reason || "Rejected by admin",
    });

    await application.save();

    await logAdminAction({
      req,
      targetUser: application.userId,
      action: "REJECT_AGENT_APPLICATION",
      notes: `Rejected user ${application.userId}`,
    });

    return res.status(200).json({
      success: true,
      message: "Agent application rejected",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Rejection failed",
    });
  }
};
