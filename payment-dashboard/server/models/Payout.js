const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, required: true }, // e.g. UPI, Bank, Crypto
    paymentDetails: { type: String, required: true }, // account/UPI/wallet details
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    rejectionReason: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payout', payoutSchema);
