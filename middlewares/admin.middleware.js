import { ROLES } from "../constants/roles.js";

export const requireSuperAdmin = (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Platform admin only",
      });
    }

    req.admin = user;
    next();

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify admin",
    });
  }
};
