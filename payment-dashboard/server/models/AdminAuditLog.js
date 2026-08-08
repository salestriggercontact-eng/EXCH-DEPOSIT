const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    action: { type: String, required: true }, // e.g. 'APPROVE_DEPOSIT', 'REJECT_PAYOUT'
    targetType: { type: String, required: true }, // 'Deposit' | 'Payout' | 'User'
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    details: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
