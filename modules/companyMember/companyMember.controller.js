import Invite from "../invite/invite.model.js";
import User from "../user/user.model.js";
import CompanyMember from "./companyMember.model.js";
import Company from "../company/company.model.js"

export const leaveCompany = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find membership
    const membership = await CompanyMember.findOne({
      user: userId,
      company: req.params.companyId,
      isDeleted: false,
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "You are not a member of this company",
      });
    }

    // Prevent owner from leaving
    if (membership.role === "OWNER") {
      return res.status(403).json({
        success: false,
        message: "Company owner cannot leave. Transfer ownership first",
      });
    }

    // 🚨 Optional: prevent last ADMIN from leaving
    if (membership.role === "ADMIN") {
      const adminCount = await CompanyMember.countDocuments({
        company: membership.company,
        role: "ADMIN",
        isDeleted: false,
      });

      if (adminCount <= 1) {
        return res.status(403).json({
          success: false,
          message:
            "You are the last company admin. Transfer ownership before leaving.",
        });
      }
    }

    // Soft-delete membership
    membership.isDeleted = true;
    membership.deletedAt = new Date();
    await membership.save();

    // Update user's company reference
    await User.findByIdAndUpdate(userId, { company: null });

    return res.status(200).json({
      success: true,
      message: "You have left the company successfully",
      company: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to leave company",
    });
  }
};

export const getCompanyMembers = async (req, res) => {
  try {
    const companyId = req.params.id;

    const users = await User.find({ company: companyId, isDeleted: false }).populate("user", "-password");

    if(!users){
      return res.status(400).json({
        success: false,
        message: "Unable to fetch users"
      })
    }
    return res.status(200).json({
      success: true,
      message: "Company users fetched successfully",
      users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch company users",
    });
  }
};

export const createCompanyInvite = async (req, res) => {
  try {
    const companyId = req.params.id;
    const { email, role } = req.body;

    const invite = new Invite({
      email,
      company: companyId,
      role,
      invitedBy: req.companyMember.user,
      status: "pending",
    });

    await invite.save();

    // TODO: optionally send email here

    return res.status(201).json({
      success: true,
      message: "Invite created successfully",
      invite,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create invite",
    });
  }
};

export const manageCompanyUser = async (req, res) => {
  try {
    const { companyId, userId } = req.params;
    const { suspend, remove } = req.body; // remove = true => delete user from company

    const member = await CompanyMember.findOne({ user: userId, company: companyId });
    if (!member) {
      return res.status(404).json({ success: false, message: "User not found in company" });
    }

    // Prevent removing owner
    if (member.role === "OWNER") {
      return res.status(403).json({
        success: false,
        message: "Cannot remove the company owner",
      });
    }

    // Remove user from company
    if (remove) {
      await CompanyMember.deleteOne({ _id: member._id });
      await User.findByIdAndUpdate(userId, { company: null });

      return res.status(200).json({
        success: true,
        message: "User removed from company successfully",
      });
    }

    // Suspend/reactivate user
    if (typeof suspend === "boolean") {
      member.isSuspended = suspend;
      await member.save();

      return res.status(200).json({
        success: true,
        message: `User ${suspend ? "suspended" : "reactivated"} successfully`,
      });
    }

    return res.status(400).json({
      success: false,
      message: "No valid action provided. Use `suspend` or `remove` in body.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to manage company user",
    });
  }
};

export const updateCompanyRole = async (req, res) => {
  try {
    const { companyId, userId } = req.params;
    const { role } = req.body; // Expected: "ADMIN" or "MEMBER"

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Only 'ADMIN' or 'MEMBER' allowed",
      });
    }

    const member = await CompanyMember.findOne({ user: userId, company: companyId });
    if (!member) {
      return res.status(404).json({ success: false, message: "User not found in company" });
    }

    // Prevent changing owner role
    if (member.role === "OWNER") {
      return res.status(403).json({ success: false, message: "Cannot change owner role" });
    }

    member.role = role;
    await member.save();

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      member,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update company role",
    });
  }
};


export const transferOwnership = async (req, res) => {
  try {
    const { companyId, newOwnerId } = req.params;
    const currentUserId = req.user._id;

    const currentOwner = await CompanyMember.findOne({
      user: currentUserId,
      company: companyId,
      role: "OWNER",
    });

    if (!currentOwner) {
      return res.status(403).json({
        success: false,
        message: "Only company owner can transfer ownership",
      });
    }

    const newOwnerMembership = await CompanyMember.findOne({
      user: newOwnerId,
      company: companyId,
    });

    if (!newOwnerMembership) {
      return res.status(400).json({
        success: false,
        message: "New owner must already be a company member",
      });
    }

    // Demote current owner to ADMIN
    currentOwner.level = "ADMIN";
    await currentOwner.save();

    // Promote new owner
    newOwnerMembership.level = "OWNER";
    await newOwnerMembership.save();

    return res.status(200).json({
      success: true,
      message: "Ownership transferred successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to transfer ownership",
    });
  }
};


export const deleteMyCompany = async (req, res) => {
  try {
    const userId = req.companyMember._id;
    const { companyId } = req.params;

    // Ensure requester is OWNER
    const ownership = await CompanyMember.findOne({
      user: userId,
      company: companyId,
      role: "OWNER",
    });

    if (!ownership) {
      return res.status(403).json({
        success: false,
        message: "Only company owner can delete this company",
      });
    }

    const company = await Company.findById(companyId);

    if(!company || company.isDeleted){
      return res.status(404).json({
        success: false,
        message: "Company not found",
      })
    }

    company.isDeleted = true;
    company.isActive = false;
    company.deletedAt = new Date();
    company.deletedBy = userId;

    await company.save();

    return res.status(200).json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete company",
    });
  }
};


export const restoreCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);

    if (!company || !company.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Company not found or not deleted",
      });
    }

    company.isDeleted = false;
    company.isActive = true;
    company.deletedAt = null;
    company.deletedBy = null;

    await company.save();

    return res.status(200).json({
      success: true,
      message: "Company restored successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to restore company",
    });
  }
};