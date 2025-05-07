import mongoose, { Types } from "mongoose";

const auditLogSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    action: {type: String, enum:['CREATE', 'UPDATE', 'DELETE', 'ASSIGN']},
    targettype: {type:String},
    targetId: {type: mongoose.Schema.Types.ObjectId},
    timestamp: {type:Date, default: Date.now }
});

export default mongoose.model('AuditLog', auditLogSchema);