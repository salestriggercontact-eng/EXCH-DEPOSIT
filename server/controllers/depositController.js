const Deposit = require('../models/Deposit');
const DepositAddress = require('../models/DepositAddress');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AdminAuditLog = require('../models/AdminAuditLog');
const User = require('../models/User');
const { generateReferenceId } = require('../utils/generateId');

const MINIMUM_UNLOCK_DEPOSIT = 2000; // USDT - initial deposit required to unlock account

// GET /api/deposits/addresses - list admin-configured coin/network deposit addresses
exports.getDepositAddresses = async (req, res) => {
  try {
    const addresses = await DepositAddress.find({ isActive: true }).sort({ isPopular: -1, coin: 1 });
    return res.json({ success: true, addresses, minimumUnlockDeposit: MINIMUM_UNLOCK_DEPOSIT });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

const UNLOCK_WINDOW_MINUTES = 60;

// GET /api/deposits/unlock/addresses - USDT TRC20/BEP20 addresses for the unlock popup
exports.getUnlockAddresses = async (req, res) => {
  try {
    const addresses = await DepositAddress.find({
      isActive: true,
      coinSymbol: 'USDT',
      network: { $in: ['TRC20', 'BEP20'] },
    });
    return res.json({ success: true, addresses, minimumUnlockDeposit: MINIMUM_UNLOCK_DEPOSIT });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// POST /api/deposits/unlock/init - step 1: user picks amount + network, creates an "initiated" request
exports.initUnlockDeposit = async (req, res) => {
  try {
    const { amount, network } = req.body;

    if (!amount || !network) {
      return res.status(400).json({ success: false, message: 'Amount and network are required' });
    }
    if (!['TRC20', 'BEP20'].includes(network)) {
      return res.status(400).json({ success: false, message: 'Invalid network' });
    }
    if (Number(amount) < MINIMUM_UNLOCK_DEPOSIT) {
      return res.status(400).json({ success: false, message: `Minimum unlock deposit is ${MINIMUM_UNLOCK_DEPOSIT} USDT` });
    }

    const addressConfig = await DepositAddress.findOne({ coinSymbol: 'USDT', network, isActive: true });
    if (!addressConfig) {
      return res.status(400).json({ success: false, message: 'This network is not currently available for deposits' });
    }

    const expiresAt = new Date(Date.now() + UNLOCK_WINDOW_MINUTES * 60 * 1000);

    const deposit = await Deposit.create({
      userId: req.userId,
      amount: Number(amount),
      coin: 'USDT',
      network,
      depositAddress: addressConfig.address,
      referenceId: generateReferenceId('UNLOCK'),
      status: 'initiated',
      isUnlockDeposit: true,
      expiresAt,
    });

    return res.status(201).json({ success: true, deposit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/deposits/unlock/:id/sent - step 3: user confirms they sent funds -> moves to pending (admin review)
exports.confirmUnlockSent = async (req, res) => {
  try {
    const deposit = await Deposit.findOne({ _id: req.params.id, userId: req.userId, isUnlockDeposit: true });
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit request not found' });
    if (deposit.status !== 'initiated') {
      return res.status(409).json({ success: false, message: 'This request can no longer be confirmed' });
    }
    if (deposit.expiresAt && deposit.expiresAt < new Date()) {
      deposit.status = 'cancelled';
      deposit.rejectionReason = 'Expired before funds were confirmed sent';
      await deposit.save();
      return res.status(410).json({ success: false, message: 'This deposit request has expired' });
    }

    deposit.status = 'pending';
    await deposit.save();

    return res.json({ success: true, message: 'Deposit submitted for admin review', deposit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/deposits/unlock/:id/cancel - user cancels before sending funds
exports.cancelUnlockDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, isUnlockDeposit: true, status: 'initiated' },
      { $set: { status: 'cancelled' } },
      { new: true }
    );
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit request not found or already processed' });
    return res.json({ success: true, message: 'Deposit cancelled', deposit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// POST /api/deposits - user submits a deposit request
exports.createDeposit = async (req, res) => {
  try {
    const { amount, coin, network, depositAddress, referenceId } = req.body;

    if (!amount || !coin || !network || !depositAddress || !referenceId) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    }

    const deposit = await Deposit.create({
      userId: req.userId,
      amount: Number(amount),
      coin,
      network,
      depositAddress,
      referenceId,
      paymentProof: req.file ? `/uploads/payment-proofs/${req.file.filename}` : null,
      status: 'pending',
    });

    return res.status(201).json({ success: true, message: 'Deposit request submitted for review', deposit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/deposits/my - user's own deposit history
exports.getMyDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.json({ success: true, deposits });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ---------- ADMIN ----------

// GET /api/admin/deposits - list all deposits (with filter by status)
exports.adminListDeposits = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const deposits = await Deposit.find(filter)
      .populate('userId', 'name email accountId')
      .sort({ createdAt: -1 });
    return res.json({ success: true, deposits });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/admin/deposits/:id/approve
exports.adminApproveDeposit = async (req, res) => {
  try {
    // Atomic guard: only transition pending -> approved once, prevents double-crediting
    const deposit = await Deposit.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { $set: { status: 'approved', adminId: req.adminId, reviewedAt: new Date() } },
      { new: true }
    );

    if (!deposit) {
      return res.status(409).json({ success: false, message: 'Deposit already processed or not found' });
    }

    const user = await User.findById(deposit.userId);
    const balanceBefore = user.balance;
    const balanceAfter = balanceBefore + deposit.amount;

    user.balance = balanceAfter;
    // unlock account once user has deposited at least the minimum
    if (!user.isUnlocked && balanceAfter >= MINIMUM_UNLOCK_DEPOSIT) {
      user.isUnlocked = true;
    }
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: 'deposit',
      amount: deposit.amount,
      balanceBefore,
      balanceAfter,
      referenceId: deposit.referenceId,
      status: 'approved',
      description: `Deposit of ${deposit.amount} ${deposit.coin} approved`,
    });

    await Notification.create({
      userId: user._id,
      title: 'Deposit approved',
      message: `Your deposit of ${deposit.amount} ${deposit.coin} has been approved and credited to your balance.`,
      type: 'deposit_approved',
    });

    await AdminAuditLog.create({
      adminId: req.adminId,
      action: 'APPROVE_DEPOSIT',
      targetType: 'Deposit',
      targetId: deposit._id,
      details: `Approved deposit of ${deposit.amount} ${deposit.coin} for user ${user.email}`,
    });

    return res.json({ success: true, message: 'Deposit approved', deposit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// PATCH /api/admin/deposits/:id/reject
exports.adminRejectDeposit = async (req, res) => {
  try {
    const { reason } = req.body;

    const deposit = await Deposit.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { $set: { status: 'rejected', adminId: req.adminId, reviewedAt: new Date(), rejectionReason: reason || 'Not specified' } },
      { new: true }
    );

    if (!deposit) {
      return res.status(409).json({ success: false, message: 'Deposit already processed or not found' });
    }

    await Notification.create({
      userId: deposit.userId,
      title: 'Deposit rejected',
      message: `Your deposit request of ${deposit.amount} ${deposit.coin} was rejected. Reason: ${deposit.rejectionReason}`,
      type: 'deposit_rejected',
    });

    await AdminAuditLog.create({
      adminId: req.adminId,
      action: 'REJECT_DEPOSIT',
      targetType: 'Deposit',
      targetId: deposit._id,
      details: `Rejected deposit ${deposit._id}: ${deposit.rejectionReason}`,
    });

    return res.json({ success: true, message: 'Deposit rejected', deposit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ---------- ADMIN: deposit address config ----------

exports.adminListAddresses = async (req, res) => {
  try {
    const addresses = await DepositAddress.find().sort({ coin: 1 });
    return res.json({ success: true, addresses });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.adminUpsertAddress = async (req, res) => {
  try {
    let { coin, coinSymbol, network, address, minimumDeposit, isPopular, isActive } = req.body;
    if (!coin || !coinSymbol || !network || !address || minimumDeposit == null) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // normalize so admin-typed whitespace/casing never breaks the unlock-flow's exact match lookup
    coin = coin.trim();
    coinSymbol = coinSymbol.trim().toUpperCase();
    network = network.trim().toUpperCase();
    address = address.trim();

    const updated = await DepositAddress.findOneAndUpdate(
      { coinSymbol, network },
      { coin, coinSymbol, network, address, minimumDeposit, isPopular: !!isPopular, isActive: isActive !== false },
      { new: true, upsert: true }
    );

    await AdminAuditLog.create({
      adminId: req.adminId,
      action: 'UPSERT_DEPOSIT_ADDRESS',
      targetType: 'DepositAddress',
      targetId: updated._id,
      details: `Set deposit address for ${coinSymbol} on ${network}`,
    });

    return res.json({ success: true, message: 'Deposit address saved', address: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.adminDeleteAddress = async (req, res) => {
  try {
    await DepositAddress.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Deposit address removed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
