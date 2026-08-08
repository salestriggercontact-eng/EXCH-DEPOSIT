const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    fieldKey: { type: String, required: true, unique: true, trim: true }, // stable key used to store the answer
    fieldType: {
      type: String,
      enum: ['text', 'number', 'textarea', 'select', 'date', 'checkbox'],
      default: 'text',
    },
    options: { type: [String], default: [] }, // used only when fieldType === 'select'
    required: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CustomField', customFieldSchema);
