import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { createCompanyInvite, getCompanyMembers, leaveCompany, manageCompanyUser, restoreCompany, transferOwnership, updateCompanyRole } from "./companyMember.controller.js";
import { requireCompanyMember } from "../../middlewares/companyMember.middleware.js";
import { requireCompanyRole } from "../../middlewares/companyMember.middleware.js";

const companyMemberRouter = Router();

companyMemberRouter.post(
  "/:companyId/leave", 
  protect, 
  requireCompanyMember,
  leaveCompany
);

companyMemberRouter.get(
  "/:companyId/users",
  protect,
  requireCompanyMember,
  requireCompanyRole("owner", "admin"),
  getCompanyMembers
);

companyMemberRouter.post(
  "/:companyId/invites",
  protect,
  requireCompanyMember,
  requireCompanyRole("owner", "admin"),
  createCompanyInvite
);

companyMemberRouter.delete(
  "/:companyId/users/:userId",
  protect,
  requireCompanyMember,
  requireCompanyRole("owner", "admin"),
  manageCompanyUser
);

companyMemberRouter.patch(
  "/:companyId/users/:userId",
  protect,
  requireCompanyMember,
  requireCompanyRole("owner"),
  updateCompanyRole
);

companyMemberRouter.patch(
  "/:companyId/transfer-ownership/:newOwnerId",
  protect,
  requireCompanyMember,
  requireCompanyRole("owner"),
  transferOwnership
)
companyMemberRouter.patch(
  "/:companyId/restore/",
  protect,
  requireCompanyMember,
  requireCompanyRole("owner"),
  restoreCompany
)



export default companyMemberRouter;
