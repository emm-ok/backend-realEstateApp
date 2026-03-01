import CompanyMember from "../modules/companyMember/companyMember.model.js"

export const requireCompanyMember = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    const member = await CompanyMember.findOne({
      user: req.user._id,
      company: companyId,
      isDeleted: false,
      isActive: true,
      isSuspended: false,
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Not a company member",
      });
    }

    req.companyMember = member;
    next();
  } catch (error) {
    console.error("requireCompanyMember error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify company membership",
    });
  }
};

export const requireCompanyRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const member = req.companyMember;

      if (!member) {
        return res.status(403).json({
          success: false,
          message: "Company membership required before checking role",
        });
      }

      if (!allowedRoles.includes(member.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      console.error("requireCompanyRole error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to verify company role",
      });
    }
  };
};



// export const requireCompanyMember = async (req, res, next) => {
//   try {
//     const member = await CompanyMember.findOne({
//       user: req.user._id,
//       isDeleted: false,
//       isActive: true,
//       isSuspended: false,
//     });

//     if (!member) {
//       return res.status(403).json({
//         success: false,
//         message: "You do not belong to any active company",
//       });
//     }

//     req.companyMember = member;
//     req.companyId = member.company; // attach companyId for easy access

//     next();
//   } catch (error) {
//     console.error("requireCompanyMember error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to verify company membership",
//     });
//   }
// };