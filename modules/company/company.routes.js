import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";

import {
  getAllCompanies,
  getCompanyById,
  suspendCompany,
  updateCompany,
  verifyCompany,
  getCompanyAgents,
  getCompanyStats,
  getMyCompany,
} from "./company.controller.js";
import { requireCompanyMember, requireCompanyRole } from "../../middlewares/companyMember.middleware.js";
import { requireSuperAdmin } from "../../middlewares/admin.middleware.js"

const companyRouter = Router();

/* Public */
companyRouter.get("/", getAllCompanies);

/* Special */
companyRouter.get("/me", protect, requireCompanyMember, getMyCompany);

/* Nested routes FIRST */
companyRouter.get(
  "/:companyId/agents",
  protect,
  requireCompanyMember,
  requireCompanyRole("admin"),
  getCompanyAgents
);

companyRouter.get(
  "/:companyId/stats",
  protect,
  requireCompanyMember,
  getCompanyStats
);

companyRouter.patch(
  "/:companyId/suspend",
  protect,
  requireSuperAdmin,
  suspendCompany
);

companyRouter.patch(
  "/:companyId/verify",
  protect,
  requireSuperAdmin,
  verifyCompany
);

/* Single company LAST */
companyRouter.get("/:companyId", getCompanyById);

companyRouter.put(
  "/:companyId",
  protect,
  requireCompanyMember,
  requireCompanyRole("owner", "admin"),
  updateCompany
);


export default companyRouter;





// /* =====================================================
//    PUBLIC ROUTES
// ===================================================== */

// companyRouter.get("/", getAllCompanies);
// companyRouter.get("/:companyId", getCompanyById);

// /* =====================================================
//    PRIVATE - CURRENT USER COMPANY
// ===================================================== */

// companyRouter.get(
//   "/company",
//   protect,
//   requireCompanyMember,
//   getMyCompany
// );

// companyRouter.put(
//   "/company",
//   protect,
//   requireCompanyMember,
//   requireCompanyRole("owner", "admin"),
//   updateCompany
// );

// companyRouter.get(
//   "/company/agents",
//   protect,
//   requireCompanyMember,
//   requireCompanyRole("admin"),
//   getCompanyAgents
// );

// companyRouter.get(
//   "/company/stats",
//   protect,
//   requireCompanyMember,
//   getCompanyStats
// );

// /* =====================================================
//    SUPER ADMIN ROUTES
// ===================================================== */

// companyRouter.patch(
//   "/:companyId/suspend",
//   protect,
//   requireSuperAdmin,
//   suspendCompany
// );

// companyRouter.patch(
//   "/:companyId/verify",
//   protect,
//   requireSuperAdmin,
//   verifyCompany
// );