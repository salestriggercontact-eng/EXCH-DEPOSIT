const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    coin: { type: String, required: true },
    network: { type: String, required: true },
    depositAddress: { type: String, required: true },
    referenceId: { type: String, required: true },
    paymentProof: { type: String, default: null }, // uploaded file path
    // 'initiated' = unlock-deposit popup created a request but user hasn't confirmed sending funds yet
    status: { type: String, enum: ['initiated', 'pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    rejectionReason: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    isUnlockDeposit: { type: Boolean, default: false }, // true if created via the first-unlock popup flow
    expiresAt: { type: Date, default: null }, // only set for isUnlockDeposit requests (60-min window)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deposit', depositSchema);
