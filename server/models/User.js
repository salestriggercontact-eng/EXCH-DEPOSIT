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
    isUnlocked: { type: Boolean, default: false }, // true once minimum initial deposit is approved
    telegramVerified: { type: Boolean, default: false },
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} }, // { [fieldKey]: value } for admin-defined fields
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
