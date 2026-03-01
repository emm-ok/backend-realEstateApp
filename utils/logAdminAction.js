import AdminAuditLog from "../modules/adminAuditLog/adminAuditLog.model.js";
import crypto from "crypto";

export const logAdminAction = async({
    req,
    action,
    targetUser = null,
    targetCompany = null,
    notes = "",
}) => {
    const ipHash = crypto.createHash("sha256").update(req.ip).digest("hex");

    await AdminAuditLog.create({
        admin: req.admin,
        targetUser,
        targetCompany,
        action,
        notes,
        ipHash,
        userAgent: req.headers["user-agent"],
    });
};