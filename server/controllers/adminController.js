const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Payout = require('../models/Payout');
const AdminAuditLog = require('../models/AdminAuditLog');

// GET /api/admin/dashboard
exports.getAdminDashboard = async (req, res) => {
  try {
    const [totalUsers, pendingDeposits, pendingPayouts, approvedDeposits, approvedPayouts, depositVolumeAgg, payoutVolumeAgg] =
      await Promise.all([
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

// GET /api/admin/users
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
    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    return res.json({ success: true, users, pagination: { total, page: Number(page), limit: Number(limit) } });
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

// PATCH /api/admin/users/:id/bank-verify
exports.verifyBankDetails = async (req, res) => {
  try {
    const { verified } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.bankDetails?.accountNumber) {
      return res.status(400).json({ success: false, message: 'User has not submitted bank details yet' });
    }

    user.bankDetails.verified = !!verified;
    user.bankDetails.verifiedAt = verified ? new Date() : null;
    await user.save();

    await AdminAuditLog.create({
      adminId: req.adminId,
      action: verified ? 'VERIFY_BANK_DETAILS' : 'UNVERIFY_BANK_DETAILS',
      targetType: 'User',
      targetId: user._id,
      details: `${verified ? 'Verified' : 'Unverified'} bank details for user ${user.email}`,
    });

    return res.json({ success: true, message: `Bank details ${verified ? 'verified' : 'unverified'}`, user: await User.findById(user._id).select('-passwordHash') });
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
      Transaction.find(filter).populate('userId', 'name email accountId').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
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
      AdminAuditLog.find().populate('adminId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AdminAuditLog.countDocuments(),
    ]);
    return res.json({ success: true, logs, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
