const Payout = require('../models/Payout');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AdminAuditLog = require('../models/AdminAuditLog');
const User = require('../models/User');

// POST /api/payouts - user submits a payout/withdrawal request
exports.createPayout = async (req, res) => {
  try {
    const { amount, paymentMethod, paymentDetails } = req.body;

    if (!amount || !paymentMethod || !paymentDetails) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.balance < Number(amount)) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const payout = await Payout.create({
      userId: req.userId,
      amount: Number(amount),
      paymentMethod,
      paymentDetails,
      status: 'pending',
    });

    return res.status(201).json({ success: true, message: 'Payout request submitted for review', payout });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/payouts/my
exports.getMyPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.json({ success: true, payouts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ---------- ADMIN ----------

exports.adminListPayouts = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const payouts = await Payout.find(filter)
      .populate('userId', 'name email accountId balance')
      .sort({ createdAt: -1 });
    return res.json({ success: true, payouts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/admin/payouts/:id/approve
exports.adminApprovePayout = async (req, res) => {
  try {
    // Atomic guard: only transition pending -> approved once
    const payout = await Payout.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { $set: { status: 'approved', adminId: req.adminId, reviewedAt: new Date() } },
      { new: true }
    );

    if (!payout) {
      return res.status(409).json({ success: false, message: 'Payout already processed or not found' });
    }

    const user = await User.findById(payout.userId);

    // re-verify sufficient balance at approval time; if insufficient, revert status and reject
    if (user.balance < payout.amount) {
      payout.status = 'rejected';
      payout.rejectionReason = 'Insufficient balance at time of approval';
      payout.reviewedAt = new Date();
      await payout.save();

      await Notification.create({
        userId: user._id,
        title: 'Payout rejected',
        message: `Your payout request of ${payout.amount} could not be processed due to insufficient balance.`,
        type: 'payout_rejected',
      });

      return res.status(400).json({ success: false, message: 'Insufficient balance - payout auto-rejected' });
    }

    const balanceBefore = user.balance;
    const balanceAfter = balanceBefore - payout.amount;
    user.balance = balanceAfter;
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: 'payout',
      amount: payout.amount,
      balanceBefore,
      balanceAfter,
      referenceId: payout._id.toString(),
      status: 'approved',
      description: `Payout of ${payout.amount} via ${payout.paymentMethod} approved`,
    });

    await Notification.create({
      userId: user._id,
      title: 'Payout approved',
      message: `Your payout request of ${payout.amount} has been approved and processed.`,
      type: 'payout_approved',
    });

    await AdminAuditLog.create({
      adminId: req.adminId,
      action: 'APPROVE_PAYOUT',
      targetType: 'Payout',
      targetId: payout._id,
      details: `Approved payout of ${payout.amount} for user ${user.email}`,
    });

    return res.json({ success: true, message: 'Payout approved', payout });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/admin/payouts/:id/reject
exports.adminRejectPayout = async (req, res) => {
  try {
    const { reason } = req.body;

    const payout = await Payout.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { $set: { status: 'rejected', adminId: req.adminId, reviewedAt: new Date(), rejectionReason: reason || 'Not specified' } },
      { new: true }
    );

    if (!payout) {
      return res.status(409).json({ success: false, message: 'Payout already processed or not found' });
    }

    await Notification.create({
      userId: payout.userId,
      title: 'Payout rejected',
      message: `Your payout request of ${payout.amount} was rejected. Reason: ${payout.rejectionReason}`,
      type: 'payout_rejected',
    });

    await AdminAuditLog.create({
      adminId: req.adminId,
      action: 'REJECT_PAYOUT',
      targetType: 'Payout',
      targetId: payout._id,
      details: `Rejected payout ${payout._id}: ${payout.rejectionReason}`,
    });

    return res.json({ success: true, message: 'Payout rejected', payout });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
