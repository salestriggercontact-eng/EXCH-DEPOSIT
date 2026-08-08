const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // e.g. "dateOfBirth", "companyName"
    },
    label: {
      type: String,
      required: true,
      trim: true,
      // e.g. "Date of Birth", "Company Name"
    },
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'select', 'textarea', 'email', 'tel'],
      required: true,
    },
    options: {
      type: [String],
      default: [],
      // used only if type === 'select'
    },
    required: {
      type: Boolean,
      default: false,
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomField', customFieldSchema);
