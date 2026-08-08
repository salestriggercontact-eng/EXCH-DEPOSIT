const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfWeek() {
  const d = startOfToday();
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}
function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function sumEarnings(userId, from) {
  const match = { userId: new mongoose.Types.ObjectId(userId), type: 'earning', status: 'approved' };
  if (from) match.createdAt = { $gte: from };
  const agg = await Transaction.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  return agg[0]?.total || 0;
}

// GET /api/earnings/summary
exports.getEarningsSummary = async (req, res) => {
  try {
    const userId = req.userId;
    const [today, week, month, pendingAgg, totalAgg, txCount] = await Promise.all([
      sumEarnings(userId, startOfToday()),
      sumEarnings(userId, startOfWeek()),
      sumEarnings(userId, startOfMonth()),
      Transaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'earning', status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'earning', status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.countDocuments({ userId, type: 'earning' }),
    ]);

    const total = totalAgg[0]?.total || 0;
    const successCount = await Transaction.countDocuments({ userId, type: 'earning', status: 'approved' });
    const successRate = txCount > 0 ? Math.round((successCount / txCount) * 100) : 0;

    return res.json({
      success: true,
      summary: {
        today,
        week,
        month,
        pending: pendingAgg[0]?.total || 0,
        total,
        transactions: txCount,
        successRate,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/earnings/history
exports.getEarningsHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [history, total] = await Promise.all([
      Transaction.find({ userId: req.userId, type: 'earning' }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Transaction.countDocuments({ userId: req.userId, type: 'earning' }),
    ]);
    return res.json({ success: true, history, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
