const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    accountId: { type: String, required: true, unique: true },
    referralCode: { type: String, default: null },
    balance: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    isUnlocked: { type: Boolean, default: false },
    telegramVerified: { type: Boolean, default: false },

    // Base account details
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankAccountNumber: { type: String, default: '' },
    upiId: { type: String, default: '' },

    // Dynamic custom fields (key-value store for admin-defined fields)
    customFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
