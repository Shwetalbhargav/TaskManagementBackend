import AuditLog from "../models/AuditLogs.js";
import auditLogSchema from "../models/AuditLogs.js";

export async function logAction(userId, action, targettype, targetId) {
    await AuditLog.create({
        user: userId,
        action,
        targettype,
        targetId
    });
    
}