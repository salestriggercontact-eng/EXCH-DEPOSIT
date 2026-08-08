const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Deposit = require('../models/Deposit');
const Payout = require('../models/Payout');
const Notification = require('../models/Notification');

// GET /api/dashboard/home
exports.getHomeSummary = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('-passwordHash');

    const [totalEarningsAgg, totalDepositsAgg, totalPayoutsAgg, pendingDeposits, pendingPayouts, recentTransactions, recentNotifications] =
      await Promise.all([
        Transaction.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'earning', status: 'approved' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Transaction.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'deposit', status: 'approved' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Transaction.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'payout', status: 'approved' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Deposit.countDocuments({ userId, status: 'pending' }),
        Payout.countDocuments({ userId, status: 'pending' }),
        Transaction.find({ userId }).sort({ createdAt: -1 }).limit(5),
        Notification.find({ userId }).sort({ createdAt: -1 }).limit(3),
      ]);

    return res.json({
      success: true,
      summary: {
        availableBalance: user.balance,
        totalEarnings: totalEarningsAgg[0]?.total || 0,
        totalPayments: totalDepositsAgg[0]?.total || 0,
        totalPayouts: totalPayoutsAgg[0]?.total || 0,
        pendingTransactions: pendingDeposits + pendingPayouts,
        isUnlocked: user.isUnlocked,
        telegramVerified: user.telegramVerified,
      },
      recentTransactions,
      recentActivity: recentNotifications,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
