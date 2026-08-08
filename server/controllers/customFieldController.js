const CustomField = require('../models/CustomField');

// GET /api/admin/custom-fields
exports.listCustomFields = async (req, res) => {
  try {
    const fields = await CustomField.find().sort({ createdAt: 1 });
    return res.json({ success: true, fields });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// POST /api/admin/custom-fields
exports.createCustomField = async (req, res) => {
  try {
    const { name, label, type, options, required, defaultValue, isActive } = req.body;
    if (!name || !label || !type) {
      return res.status(400).json({ success: false, message: 'Name, label, and type are required' });
    }
    const existing = await CustomField.findOne({ name });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Field name already exists' });
    }
    const field = await CustomField.create({
      name,
      label,
      type,
      options: type === 'select' ? options : [],
      required: required || false,
      defaultValue: defaultValue || null,
      isActive: isActive !== undefined ? isActive : true,
    });
    return res.status(201).json({ success: true, message: 'Custom field created', field });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PUT /api/admin/custom-fields/:id
exports.updateCustomField = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, type, options, required, defaultValue, isActive } = req.body;
    const field = await CustomField.findById(id);
    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }
    // Prevent renaming? We'll allow, but need to also update user customFields keys? That's complex, so maybe disallow renaming.
    // We'll only allow updating label, type, options, required, defaultValue, isActive.
    // We'll disallow name change to avoid key mismatches.
    if (label) field.label = label;
    if (type) field.type = type;
    if (type === 'select' && options) field.options = options;
    if (required !== undefined) field.required = required;
    if (defaultValue !== undefined) field.defaultValue = defaultValue;
    if (isActive !== undefined) field.isActive = isActive;
    await field.save();
    return res.json({ success: true, message: 'Custom field updated', field });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// DELETE /api/admin/custom-fields/:id
exports.deleteCustomField = async (req, res) => {
  try {
    const { id } = req.params;
    const field = await CustomField.findById(id);
    if (!field) {
      return res.status(404).json({ success: false, message: 'Field not found' });
    }
    // Remove field from all users' customFields
    const User = require('../models/User');
    await User.updateMany(
      {},
      { $unset: { [`customFields.${field.name}`]: '' } }
    );
    await field.deleteOne();
    return res.json({ success: true, message: 'Custom field deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
