const CustomField = require('../models/CustomField');
const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');

function slugifyKey(label) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// ---------- USER ----------

// GET /api/custom-fields - active fields, in order, for the Account page
exports.getActiveFields = async (req, res) => {
  try {
    const fields = await CustomField.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    return res.json({ success: true, fields });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PUT /api/custom-fields/my - user saves answers { values: { [fieldKey]: value } }
exports.saveMyFieldValues = async (req, res) => {
  try {
    const { values } = req.body;
    if (!values || typeof values !== 'object') {
      return res.status(400).json({ success: false, message: 'Values object is required' });
    }

    const activeFields = await CustomField.find({ isActive: true });
    const activeKeys = new Set(activeFields.map((f) => f.fieldKey));

    for (const field of activeFields) {
      if (field.required) {
        const v = values[field.fieldKey];
        if (v === undefined || v === null || v === '') {
          return res.status(400).json({ success: false, message: `${field.label} is required` });
        }
      }
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const merged = { ...(user.customFields || {}) };
    for (const key of Object.keys(values)) {
      if (activeKeys.has(key)) merged[key] = values[key];
    }
    user.customFields = merged;
    await user.save();

    return res.json({ success: true, message: 'Details saved', customFields: user.customFields });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ---------- ADMIN ----------

// GET /api/custom-fields/admin/all
exports.adminListFields = async (req, res) => {
  try {
    const fields = await CustomField.find().sort({ order: 1, createdAt: 1 });
    return res.json({ success: true, fields });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// POST /api/custom-fields/admin
exports.adminCreateField = async (req, res) => {
  try {
    let { label, fieldType, options, required, order, isActive } = req.body;
    if (!label) {
      return res.status(400).json({ success: false, message: 'Label is required' });
    }
    if (fieldType === 'select' && (!Array.isArray(options) || options.filter((o) => o && o.trim()).length === 0)) {
      return res.status(400).json({ success: false, message: 'At least one option is required for a select field' });
    }

    const fieldKey = slugifyKey(label);
    if (!fieldKey) {
      return res.status(400).json({ success: false, message: 'Label must contain at least one letter or number' });
    }

    const existing = await CustomField.findOne({ fieldKey });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A field with a matching key already exists' });
    }

    const field = await CustomField.create({
      label: label.trim(),
      fieldKey,
      fieldType: fieldType || 'text',
      options: fieldType === 'select' ? options.filter((o) => o && o.trim()).map((o) => o.trim()) : [],
      required: !!required,
      order: order != null ? Number(order) : 0,
      isActive: isActive !== false,
    });

    await AdminAuditLog.create({
      adminId: req.adminId,
      action: 'CREATE_CUSTOM_FIELD',
      targetType: 'CustomField',
      targetId: field._id,
      details: `Created custom field "${field.label}" on Account page`,
    });

    return res.status(201).json({ success: true, message: 'Field added', field });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/custom-fields/admin/:id
exports.adminUpdateField = async (req, res) => {
  try {
    const { label, fieldType, options, required, order, isActive } = req.body;

    const field = await CustomField.findById(req.params.id);
    if (!field) return res.status(404).json({ success: false, message: 'Field not found' });

    if (label) field.label = label.trim();
    if (fieldType) field.fieldType = fieldType;
    if (options) field.options = options.filter((o) => o && o.trim()).map((o) => o.trim());
    if (required !== undefined) field.required = !!required;
    if (order !== undefined) field.order = Number(order);
    if (isActive !== undefined) field.isActive = !!isActive;

    if (field.fieldType === 'select' && field.options.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one option is required for a select field' });
    }

    await field.save();

    await AdminAuditLog.create({
      adminId: req.adminId,
      action: 'UPDATE_CUSTOM_FIELD',
      targetType: 'CustomField',
      targetId: field._id,
      details: `Updated custom field "${field.label}"`,
    });

    return res.json({ success: true, message: 'Field updated', field });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// DELETE /api/custom-fields/admin/:id
exports.adminDeleteField = async (req, res) => {
  try {
    const field = await CustomField.findByIdAndDelete(req.params.id);
    if (!field) return res.status(404).json({ success: false, message: 'Field not found' });

    await AdminAuditLog.create({
      adminId: req.adminId,
      action: 'DELETE_CUSTOM_FIELD',
      targetType: 'CustomField',
      targetId: field._id,
      details: `Deleted custom field "${field.label}"`,
    });

    return res.json({ success: true, message: 'Field removed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
