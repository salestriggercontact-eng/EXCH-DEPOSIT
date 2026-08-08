const mongoose = require('mongoose');

// Admin-managed deposit addresses shown to users on the Paying page.
// No blockchain integration - address is display-only, deposits stay manual.
const depositAddressSchema = new mongoose.Schema(
  {
    coin: { type: String, required: true }, // e.g. TRON, BTC
    coinSymbol: { type: String, required: true }, // e.g. TRX, BTC
    network: { type: String, required: true }, // e.g. TRON (TRX)
    address: { type: String, required: true },
    minimumDeposit: { type: Number, required: true },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

depositAddressSchema.index({ coinSymbol: 1, network: 1 }, { unique: true });

module.exports = mongoose.model('DepositAddress', depositAddressSchema);
