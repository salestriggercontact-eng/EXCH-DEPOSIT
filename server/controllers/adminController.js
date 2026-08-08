const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Payout = require('../models/Payout');
const AdminAuditLog = require('../models/AdminAuditLog');
const CustomField = require('../models/CustomField');

// GET /api/admin/dashboard
exports.getAdminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      pendingDeposits,
      pendingPayouts,
      approvedDeposits,
      approvedPayouts,
      depositVolumeAgg,
      payoutVolumeAgg,
    ] = await Promise.all([
      User.countDocuments(),
      Deposit.countDocuments({ status: 'pending' }),
      Payout.countDocuments({ status: 'pending' }),
      Deposit.countDocuments({ status: 'approved' }),
      Payout.countDocuments({ status: 'approved' }),
      Deposit.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payout.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    const totalVolume = (depositVolumeAgg[0]?.total || 0) + (payoutVolumeAgg[0]?.total || 0);
    return res.json({
      success: true,
      summary: {
        totalUsers,
        pendingDeposits,
        pendingPayouts,
        approvedDeposits,
        approvedPayouts,
        totalTransactionVolume: totalVolume,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/admin/users - includes custom fields
exports.listUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { accountId: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total, fields] = await Promise.all([
      User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
      CustomField.find({ isActive: true }),
    ]);

    // Fill missing custom fields with default values
    const usersWithFields = users.map((user) => {
      const custom = user.customFields || {};
      for (const field of fields) {
        if (!(field.name in custom)) {
          custom[field.name] = field.defaultValue;
        }
      }
      return {
        ...user.toObject(),
        customFields: custom,
      };
    });

    return res.json({
      success: true,
      users: usersWithFields,
      fields, // send field definitions for dynamic columns
      pagination: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await AdminAuditLog.create({
      adminId: req.adminId,
      action: 'UPDATE_USER_STATUS',
      targetType: 'User',
      targetId: user._id,
      details: `Set status to ${status} for user ${user.email}`,
    });

    return res.json({ success: true, message: 'User status updated', user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/admin/users/:id/details - update base + custom fields
exports.updateUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Allowed base fields
    const allowedBase = [
      'name', 'email', 'mobile',
      'address', 'city', 'state', 'postalCode', 'country',
      'bankName', 'bankAccountNumber', 'upiId',
    ];
    const filtered = {};
    for (const key of allowedBase) {
      if (updates[key] !== undefined) filtered[key] = updates[key];
    }

    // Handle custom fields separately
    let customFieldsUpdate = {};
    if (updates.customFields && typeof updates.customFields === 'object') {
      const fields = await CustomField.find({ isActive: true });
      const allowedCustomNames = fields.map((f) => f.name);
      for (const [key, value] of Object.entries(updates.customFields)) {
        if (allowedCustomNames.includes(key)) {
          customFieldsUpdate[`customFields.${key}`] = value;
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { ...filtered, ...customFieldsUpdate } },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await AdminAuditLog.create({
      adminId: req.adminId,
      action: 'UPDATE_USER_DETAILS',
      targetType: 'User',
      targetId: user._id,
      details: `Updated account details for ${user.email}`,
    });

    return res.json({ success: true, message: 'User details updated', user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/admin/transactions
exports.listAllTransactions = async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const { type, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type && type !== 'all') filter.type = type;
    if (status && status !== 'all') filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('userId', 'name email accountId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Transaction.countDocuments(filter),
    ]);
    return res.json({ success: true, transactions, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/admin/audit-logs
exports.listAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AdminAuditLog.find()
        .populate('adminId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AdminAuditLog.countDocuments(),
    ]);
    return res.json({ success: true, logs, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
