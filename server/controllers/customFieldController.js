const CustomField = require('../models/CustomField');
const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');

function slugifyKey(label) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .replace(/^_+$/g, '');
}

// ---------- USER ----------
exports.getActiveFields = async (req, res) => {
  try {
    const fields = await CustomField.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    return res.json({ success: true, fields });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.saveMyFieldValues = async (req, res) => {
  try {
    const { values } = req.body;
    if (!values || typeof values !== 'object') {
      return res.status(400).json({ success: false, message: 'Values object is required' });
    }

    const activeFields = await CustomField.find({ isActive: true });
    const activeKeys = new Set(activeFields.map(f => f.fieldKey));

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

// ---------- ADMIN ----------
exports.adminListFields = async (req, res) => {
  try {
    const fields = await CustomField.find().sort({ order: 1, createdAt: 1 });
    return res.json({ success: true, fields });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.adminCreateField = async (req, res) => {
  try {
    let { label, fieldType, options, required, order, isActive } = req.body;
    if (!label) {
      return res.status(400).json({ success: false, message: 'Label is required' });
    }

    let baseKey = slugifyKey(label);
    if (!baseKey) {
      return res.status(400).json({ success: false, message: 'Label must contain at least one letter or number' });
    }

    // ✅ Unique key generation – this is the fix for duplicate field error
    let fieldKey = baseKey;
    let suffix = 1;
    while (await CustomField.findOne({ fieldKey })) {
      fieldKey = `${baseKey}${suffix}`;
      suffix++;
    }

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
      details: `Created custom field "${field.label}"`,
    });

    return res.status(201).json({ success: true, message: 'Field added', field });
  } catch (err) {
    console.error('❌ CREATE ERROR:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.adminUpdateField = async (req, res) => {
  try {
    const { label, fieldType, options, required, order, isActive } = req.body;
    const field = await CustomField.findById(req.params.id);
    if (!field) return res.status(404).json({ success: false, message: 'Field not found' });

    if (label && label.trim() !== field.label) {
      let baseKey = slugifyKey(label);
      if (!baseKey) {
        return res.status(400).json({ success: false, message: 'Label must contain at least one letter or number' });
      }
      let newKey = baseKey;
      let suffix = 1;
      while (await CustomField.findOne({ fieldKey: newKey, _id: { $ne: field._id } })) {
        newKey = `${baseKey}${suffix}`;
        suffix++;
      }
      field.fieldKey = newKey;
      field.label = label.trim();
    }

    if (fieldType) field.fieldType = fieldType;
    if (options) {
      const opts = options.filter(o => o && o.trim()).map(o => o.trim());
      if (field.fieldType === 'select' && opts.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one option is required for a select field' });
      }
      field.options = opts;
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
    console.error('❌ UPDATE ERROR:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

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
    console.error('❌ DELETE ERROR:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
