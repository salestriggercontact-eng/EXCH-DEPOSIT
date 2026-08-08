const Transaction = require('../models/Transaction');

// GET /api/reports?type=&status=&from=&to=&search=&page=&limit=
exports.getReports = async (req, res) => {
  try {
    const { type, status, from, to, search, page = 1, limit = 10 } = req.query;

    const filter = { userId: req.userId };
    if (type && type !== 'all') filter.type = type;
    if (status && status !== 'all') filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    if (search) {
      filter.$or = [
        { referenceId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total, totalAmountAgg] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Transaction.countDocuments(filter),
      Transaction.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    return res.json({
      success: true,
      transactions,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
      totalAmount: totalAmountAgg[0]?.total || 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
