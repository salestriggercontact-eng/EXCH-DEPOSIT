// server/controllers/customFieldController.js

const CustomField = require('../models/CustomField');
const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');

// Improved slugify: removes special chars, makes lowercase, and handles uniqueness
function slugifyKey(label) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .replace(/^_+$/g, '');
}

// ----- USER -----

// GET /api/custom-fields - active fields for user account page
exports.getActiveFields = async (req, res) => {
  try {
    const fields = await CustomField.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    return res.json({ success: true, fields });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PUT /api/custom-fields/my - user saves their values
exports.saveMyFieldValues = async (req, res) => {
  try {
    const { values } = req.body;
    if (!values || typeof values !== 'object') {
      return res.status(400).json({ success: false, message: 'Values object is required' });
    }

    const activeFields = await CustomField.find({ isActive: true });
    const activeKeys = new Set(activeFields.map(f => f.fieldKey));

    // Validate required fields
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

    // Merge only active keys
    const merged = { ...(user.customFields || {}) };
    for (const key of Object.keys(values)) {
      if (activeKeys.has(key)) {
        merged[key] = values[key];
      }
    }
    user.customFields = merged;
    await user.save();

    return res.json({ success: true, message: 'Details saved', customFields: user.customFields });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ----- ADMIN -----

// GET /api/custom-fields/admin/all - list all fields (with optional user values)
exports.adminListFields = async (req, res) => {
  try {
    const fields = await CustomField.find().sort({ order: 1, createdAt: 1 });
    return res.json({ success: true, fields });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// NEW: GET /api/custom-fields/admin/users-values - see all users' custom field answers
exports.adminListUsersValues = async (req, res) => {
  try {
    // Get all active fields to know the keys
    const activeFields = await CustomField.find({ isActive: true });
    const fieldKeys = activeFields.map(f => f.fieldKey);

    // Get all users (or paginated) and select only customFields + name/email
    const users = await User.find({}, 'name email accountId customFields').sort({ createdAt: -1 });

    // Format response: each user with their field values
    const result = users.map(user => {
      const values = {};
      fieldKeys.forEach(key => {
        values[key] = user.customFields && user.customFields[key] !== undefined ? user.customFields[key] : null;
      });
      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        accountId: user.accountId,
        values
      };
    });

    return res.json({ success: true, users: result, fields: activeFields });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// POST /api/custom-fields/admin - create new field with unique slug
exports.adminCreateField = async (req, res) => {
  try {
    let { label, fieldType, options, required, order, isActive } = req.body;
    if (!label) {
      return res.status(400).json({ success: false, message: 'Label is required' });
    }

    // Generate base slug
    let baseKey = slugifyKey(label);
    if (!baseKey) {
      return res.status(400).json({ success: false, message: 'Label must contain at least one letter or number' });
    }

    // Ensure uniqueness by appending number if needed
    let fieldKey = baseKey;
    let suffix = 1;
    while (await CustomField.findOne({ fieldKey })) {
      fieldKey = `${baseKey}${suffix}`;
      suffix++;
    }

    // Validate select options
    if (fieldType === 'select') {
      if (!Array.isArray(options) || options.filter(o => o && o.trim()).length === 0) {
        return res.status(400).json({ success: false, message: 'At least one option is required for a select field' });
      }
      options = options.filter(o => o && o.trim()).map(o => o.trim());
    } else {
      options = [];
    }

    const field = await CustomField.create({
      label: label.trim(),
      fieldKey,
      fieldType: fieldType || 'text',
      options,
      required: !!required,
      order: order !== undefined ? Number(order) : 0,
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

// PATCH /api/custom-fields/admin/:id - update field
exports.adminUpdateField = async (req, res) => {
  try {
    const { label, fieldType, options, required, order, isActive } = req.body;
    const field = await CustomField.findById(req.params.id);
    if (!field) return res.status(404).json({ success: false, message: 'Field not found' });

    if (label) {
      field.label = label.trim();
      // Optionally, you could regenerate slug, but better to keep old key to preserve data
    }
    if (fieldType) field.fieldType = fieldType;
    if (fieldType === 'select') {
      if (!Array.isArray(options) || options.filter(o => o && o.trim()).length === 0) {
        return res.status(400).json({ success: false, message: 'At least one option is required for a select field' });
      }
      field.options = options.filter(o => o && o.trim()).map(o => o.trim());
    } else {
      field.options = [];
    }
    if (required !== undefined) field.required = !!required;
    if (order !== undefined) field.order = Number(order);
    if (isActive !== undefined) field.isActive = !!isActive;

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

// server/routes/customFieldRoutes.js
const express = require('express');
const router = express.Router();
const customFieldController = require('../controllers/customFieldController');
const { verifyUser, verifyAdmin } = require('../middleware/auth');

// user
router.get('/', verifyUser, customFieldController.getActiveFields);
router.put('/my', verifyUser, customFieldController.saveMyFieldValues);

// admin
router.get('/admin/all', verifyAdmin, customFieldController.adminListFields);
router.get('/admin/users-values', verifyAdmin, customFieldController.adminListUsersValues); // <-- नया
router.post('/admin', verifyAdmin, customFieldController.adminCreateField);
router.patch('/admin/:id', verifyAdmin, customFieldController.adminUpdateField);
router.delete('/admin/:id', verifyAdmin, customFieldController.adminDeleteField);

module.exports = router;
