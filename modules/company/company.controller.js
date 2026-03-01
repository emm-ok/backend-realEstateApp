import Agent from "../agent/agent.model.js";
import Listings from "../listing/listing.model.js";
import Company from "./company.model.js";
import { logAdminAction } from "../../utils/logAdminAction.js";
import CompanyMember from "../companyMember/companyMember.model.js";

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ verified: true });

    return res.status(200).json({
      success: true,
      count: companies.length,
      companies,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch companies",
    });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Company fetched successfully",
      company,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch company" });
  }
};

// Company
export const getMyCompany = async (req, res) => {
  try {
    if (!req.companyMember) {
      return res.status(404).json({
        success: false,
        message: "User does not belong to any company",
      });
    }

    const company = await Company.findById(req.companyMember);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User company fetched successfully",
      company,
    });
  } catch (error) {
    console.error("getMyCompany error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user company",
    });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const allowedUpdates = ["name", "logo", "website"];
    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.companyMember.company.toString() !== companyId) {
      return res.status(403).json({
        success: false,
        message: "You cannot update another company",
      });
    }

    const company = await Company.findByIdAndUpdate(companyId, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Company updated successfully",
      company,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update company" });
  }
};

export const suspendCompany = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const company = await Company.findById(companyId);

    if (!company) return res.status(404).json({ message: "Company not found" });

    company.isSuspended = !company.isSuspended; // toggle suspend status
    await company.save();

    await logAdminAction({
      req,
      targetCompany: companyId,
      action: `${company.isSuspended ? "SUSPEND_COMPANY" : "REACTIVATE_COMPANY"}`,
      notes: `Company ${company.isSuspended ? "Suspended" : "Reactivated"}`,
    });

    return res.status(200).json({
      success: true,
      message: company.isSuspended
        ? "Company suspended"
        : "Company reactivated",
      company,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to suspend/reactivate company" });
  }
};

export const verifyCompany = async (req, res) => {
  try {
    const admin = req.admin;
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    if (company.verified) {
      return res.status(400).json({
        success: false,
        message: "Company already verified",
      });
    }

    company.verified = true;
    await company.save();

    await logAdminAction({
      req,
      targetCompany: companyId,
      action: "VERIFY_COMPANY",
      notes: "Company verified",
    });

    return res.status(200).json({
      success: true,
      message: "Company verified successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify company",
    });
  }
};

export const getCompanyAgents = async (req, res) => {
  try {
    const { companyId } = req.params;

    const agents = await CompanyMember.find({
      company: companyId,
      role: "agent",
      isActive: true,
    }).populate("user");

    return res.status(200).json({
      success: true,
      count: agents.length,
      agents,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch agents" });
  }
};

export const getCompanyStats = async (req, res) => {
  try {
    const { companyId } = req.params;

    const totalAgents = await Agent.countDocuments({ companyId });
    const totalProperties = await Listings.countDocuments({ companyId });

    const totalSales = await Listings.countDocuments({
      companyId,
      status: "for_sale",
    });

    res.status(200).json({
      success: true,
      stats: {
        totalAgents,
        totalProperties,
        totalSales,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};




// import mongoose from "mongoose";
// import Agent from "../agent/agent.model.js";
// import Listings from "../listing/listing.model.js";
// import Company from "./company.model.js";
// import { logAdminAction } from "../../utils/logAdminAction.js";
// import CompanyMember from "../companyMember/companyMember.model.js";

// export const getAllCompanies = async (req, res) => {
//   try {
//     const companies = await Company.find({
//       verified: true,
//       isSuspended: false,
//     });

//     return res.status(200).json({
//       success: true,
//       count: companies.length,
//       companies,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch companies",
//     });
//   }
// };


// export const getCompanyById = async (req, res) => {
//   try {
//     const { companyId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(companyId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid company ID",
//       });
//     }

//     const company = await Company.findOne({
//       _id: companyId,
//       verified: true,
//       isSuspended: false,
//     });

//     if (!company) {
//       return res.status(404).json({
//         success: false,
//         message: "Company not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       company,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch company",
//     });
//   }
// };

// // Company
// export const getMyCompany = async (req, res) => {
//   try {
//     const company = await Company.findById(req.companyId);

//     if (!company) {
//       return res.status(404).json({
//         success: false,
//         message: "Company not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       company,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch company",
//     });
//   }
// };

// export const updateCompany = async (req, res) => {
//   try {
//     const allowedUpdates = ["name", "logo", "website"];
//     const updates = {};

//     allowedUpdates.forEach((field) => {
//       if (req.body[field] !== undefined) {
//         updates[field] = req.body[field];
//       }
//     });

//     const company = await Company.findByIdAndUpdate(
//       req.companyId,
//       updates,
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Company updated successfully",
//       company,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update company",
//     });
//   }
// };

// export const getCompanyAgents = async (req, res) => {
//   try {
//     const agents = await CompanyMember.find({
//       company: req.companyId,
//       role: "agent",
//       isActive: true,
//       isSuspended: false,
//       isDeleted: false,
//     }).populate("user");

//     return res.status(200).json({
//       success: true,
//       count: agents.length,
//       agents,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch agents",
//     });
//   }
// };

// export const getCompanyStats = async (req, res) => {
//   try {
//     const totalAgents = await CompanyMember.countDocuments({
//       company: req.companyId,
//       role: "agent",
//       isActive: true,
//     });

//     const totalProperties = await Listings.countDocuments({
//       companyId: req.companyId,
//     });

//     const totalSales = await Listings.countDocuments({
//       companyId: req.companyId,
//       status: "for_sale",
//     });

//     return res.status(200).json({
//       success: true,
//       stats: {
//         totalAgents,
//         totalProperties,
//         totalSales,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch stats",
//     });
//   }
// };

// export const suspendCompany = async (req, res) => {
//   try {
//     const { companyId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(companyId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid company ID",
//       });
//     }

//     const company = await Company.findById(companyId);

//     if (!company) {
//       return res.status(404).json({
//         success: false,
//         message: "Company not found",
//       });
//     }

//     company.isSuspended = !company.isSuspended;
//     await company.save();

//     await logAdminAction({
//       req,
//       targetCompany: companyId,
//       action: company.isSuspended
//         ? "SUSPEND_COMPANY"
//         : "REACTIVATE_COMPANY",
//       notes: company.isSuspended
//         ? "Company suspended"
//         : "Company reactivated",
//     });

//     return res.status(200).json({
//       success: true,
//       message: company.isSuspended
//         ? "Company suspended"
//         : "Company reactivated",
//       company,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update suspension status",
//     });
//   }
// };

// export const verifyCompany = async (req, res) => {
//   try {
//     const { companyId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(companyId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid company ID",
//       });
//     }

//     const company = await Company.findById(companyId);

//     if (!company) {
//       return res.status(404).json({
//         success: false,
//         message: "Company not found",
//       });
//     }

//     if (company.verified) {
//       return res.status(400).json({
//         success: false,
//         message: "Company already verified",
//       });
//     }

//     company.verified = true;
//     await company.save();

//     await logAdminAction({
//       req,
//       targetCompany: companyId,
//       action: "VERIFY_COMPANY",
//       notes: "Company verified",
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Company verified successfully",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to verify company",
//     });
//   }
// };

