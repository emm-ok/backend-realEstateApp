import { ROLES } from "../../constants/roles.js";
import Company from "../company/company.model.js";
import User from "../user/user.model.js";
import CompanyApplication from "./companyApplication.model.js";
import crypto from "crypto";
import { logAdminAction } from "../../utils/logAdminAction.js";
import CompanyMember, {
  COMPANY_MEMBER_ROLES,
} from "../companyMember/companyMember.model.js";

/* Create a new company application */
export const createCompanyApplication = async (req, res) => {
  try {
    const userId = req.user._id;

    const existing = await CompanyApplication.findOne({
      userId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already have an active company application",
      });
    }

    const application = await CompanyApplication.create({
      userId,
      status: "draft",
      currentStep: 1,
      version: 1,
      verification: {
        ipHash: crypto.createHash("sha256").update(req.ip).digest("hex"),
        userAgent: req.headers["user-agent"],
        riskScore: 0,
      },
      history: [
        {
          action: "created",
          by: userId,
          at: new Date(),
          note: "Company application started",
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Company application created successfully",
      application,
    });
  } catch (error) {
    console.log("Error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create company application",
    });
  }
};

/* Get my company application */
export const getMyCompanyApplication = async (req, res) => {
  try {
    const userId = req.user._id;

    const application = await CompanyApplication.findOne({
      userId,
    }).lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "No company application found. You can start a new one.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Company application retrieved successfully",
      application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your company application",
    });
  }
};

/* Update draft */
export const updateCompanyApplicationDraft = async (req, res) => {
  try {
    const userId = req.user._id;
    const { company, documents, currentStep } = req.body;

    const application = await CompanyApplication.findOne({
      userId,
      status: { $in: ["draft", "rejected"] },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "No draft application found to update.",
      });
    }

    if (company) {
      // Ensure existing company is always an object
      let existingCompany = {};

      if (
        typeof application.company === "object" &&
        application.company !== null
      ) {
        existingCompany = application.company;
      } else if (typeof application.company === "string") {
        try {
          existingCompany = JSON.parse(application.company);
        } catch {
          existingCompany = {};
        }
      }

      // Merge safely
      application.company = { ...existingCompany, ...company };
    }

    if (documents) {
      for (const docKey of Object.keys(documents)) {
        application.documents[docKey] = {
          ...application.documents[docKey],
          ...documents[docKey],
        };
      }
    }
    if (currentStep) application.currentStep = currentStep;

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
      message: "Company application draft updated successfully",
      application,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update company application draft",
    });
  }
};

/* Submit company application */
export const submitCompanyApplication = async (req, res) => {
  try {
    const userId = req.user._id;

    const application = await CompanyApplication.findOne({
      userId,
      status: { $in: ["draft", "rejected"] },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "No draft application found to submit",
      });
    }

    // Simple validation: ensure required fields
    if (
      !application.company ||
      !application.company.name ||
      !application.company.email
      // !application.company.logo
    ) {
      return res.status(400).json({
        success: false,
        message: "Company name, email, and logo are required before submission",
      });
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
      message: "Company application submitted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to submit company application",
    });
  }
};

/* Upload document */
export const uploadCompanyDocument = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.params;

    const allowedTypes = ["registrationCertificate", "license", "ownerIdCard"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid document type" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const application = await CompanyApplication.findOne({
      userId,
      status: { $in: ["draft", "rejected"] },
    });

    if (!application)
      return res.status(404).json({ message: "No draft application found" });

    application.documents[type] = {
      url: req.file.path,
      publicId: req.file.filename,
      verified: false,
    };

    application.history.push({
      action: "document_uploaded",
      by: userId,
      at: new Date(),
      note: `Uploaded ${type} document`,
    });

    await application.save();

    res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      document: application.documents[type],
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to upload document" });
  }
};

/* Archive draft */
export const archiveCompanyApplication = async (req, res) => {
  try {
    const userId = req.user._id;

    const application = await CompanyApplication.findOne({
      userId,
      status: "draft",
    });

    if (!application)
      return res.status(404).json({ message: "No draft found" });

    application.status = "archived";
    application.history.push({
      action: "archived",
      by: userId,
      at: new Date(),
      note: "User archived draft",
    });

    await application.save();
    res.json({ success: true, message: "Application archived" });
  } catch {
    res.status(500).json({ message: "Failed to archive" });
  }
};

export const getCompanyApplications = async (req, res) => {
  try {
    const applications = await CompanyApplication.find({
      status: { $ne: "draft" },
    }).populate("userId");

    if (!applications) {
      return res.status(404).json({
        success: false,
        message: "No company applications found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Applications retrieved successfully",
      applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve company applications",
    });
  }
};

export const getCompanyApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application =
      await CompanyApplication.findById(applicationId).populate("userId");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application retrieved successfully",
      application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch application",
    });
  }
};

/* Approve a company application */
export const approveCompanyApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const adminId = req.admin._id;

    const application = await CompanyApplication.findOne({
      _id: applicationId,
      status: "pending",
    });

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Pending Application not found" });
    }

    if (
      !application.userId ||
      !application.company?.name ||
      !application.company?.email
    ) {
      return res.status(400).json({
        success: false,
        message: "Application data is incomplete",
      });
    }

    // 1️⃣ Create actual company
    const newCompany = await Company.create({
      userId: application.userId,
      name: application.company.name,
      email: application.company.email,
      logo: application.company.logo,
      website: application.company.website,
      verified: true,
      isSuspended: false,
      agents: [],
      users: [],
    });
    
    const member = await CompanyMember.create({
      user: application.userId,
      company: newCompany._id,
      role: COMPANY_MEMBER_ROLES.ADMIN,
    });

    newCompany.users.push(member._id);
    newCompany.verified = true;
    await newCompany.save();

    // 2️⃣ Update application status
    application.status = "approved";
    application.approvedAt = new Date();


    const user = await User.findById(application.userId);
    user.company = newCompany._id;
    await user.save();

    application.history.push({
      action: "approved",
      by: adminId,
      at: new Date(),
      note: "Application approved by admin",
    });
    await application.save();

    await logAdminAction({
      req,
      targetCompany: newCompany._id,
      action: "APPROVE_COMPANY_APPLICATION",
      notes: "Company application approved",
    });

    return res.status(200).json({
      success: true,
      message: "Company application approved and company created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to approve company application",
    });
  }
};

/* Reject a company application */
export const rejectCompanyApplication = async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    const adminId = req.user._id;
    const { reason } = req.body;

    const application = await CompanyApplication.findById(applicationId, {
      status: "pending",
    });

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    if (application.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only submitted applications can be rejected",
      });
    }

    application.status = "rejected";
    application.rejectedAt = new Date();
    application.rejectionReason = reason;

    application.history.push({
      action: "rejected",
      by: adminId,
      at: new Date(),
      note: `Application rejected with reason: ${reason}`,
    });
    await application.save();

    const admin = await User.findById(adminId);

    await logAdminAction({
      req,
      targetCompany: application.company,
      action: "REJECT_COMPANY_APPLICATION",
      notes: "Company application rejected",
    });

    res.status(200).json({
      success: true,
      message: "Company application rejected",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to reject company application",
    });
  }
};
