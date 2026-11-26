const crypto = require('crypto');
const axios = require('axios');
const Deposit = require('../models/Deposit');
const DepositAddress = require('../models/DepositAddress');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AdminAuditLog = require('../models/AdminAuditLog');
const User = require('../models/User');
const { generateReferenceId } = require('../utils/generateId');

const MINIMUM_UNLOCK_DEPOSIT = 2000; 

// ==========================================
// 🔥 HELLOPAY AUTOMATED INTEGRATION
// ==========================================

// Helper: AES Encrypt
const encryptHelloPayData = (dataObj) => {
  const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(process.env.HELLO_AES_KEY), null);
  let encrypted = cipher.update(JSON.stringify(dataObj), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};

// Helper: AES Decrypt
const decryptHelloPayData = (encryptedBase64) => {
  const decipher = crypto.createDecipheriv('aes-128-ecb', Buffer.from(process.env.HELLO_AES_KEY), null);
  let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};

// Helper: Generate Signature (MD5)
const generateHelloPaySign = (data, merchantCode, timestamp, salt) => {
  const stringToSign = `data=${data}&merchant_code=${merchantCode}&timestamp=${timestamp}${salt}`;
  return crypto.createHash('md5').update(stringToSign).digest('hex');
};

// 1. Create Payment Link (Frontend se call hoga)
exports.createHelloPayPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum amount is 100' });
    }

    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const timestamp = Date.now().toString();

    // Business Data for HelloPay
    const businessData = {
      merchant_order_id: orderId,
      amount: String(amount),
      currency: 'INR',
      notify_url: `${process.env.BACKEND_URL}/api/deposits/hellopay-webhook`, 
    };

    const encryptedData = encryptHelloPayData(businessData);
    const sign = generateHelloPaySign(encryptedData, process.env.HELLO_MERCHANT_CODE, timestamp, process.env.HELLO_SIGN_SALT);

    const payload = {
      merchant_code: process.env.HELLO_MERCHANT_CODE,
      timestamp: timestamp,
      data: encryptedData,
      sign: sign,
    };

    // API Request to HelloPay
    const response = await axios.post(`${process.env.HELLO_GATEWAY_URL}/gw/payment/unifiedOrder`, payload);
    const responseData = response.data;

    // Decrypt Response Data
    const decryptedResponse = decryptHelloPayData(responseData.data);
    
    // Save Pending Deposit in Database
    await Deposit.create({
      userId: req.userId,
      amount: Number(amount),
      coin: 'INR',
      network: 'UPI',
      depositAddress: 'HelloPay_Auto', // Dummy value for required field
      referenceId: orderId,
      status: 'pending',
    });

    return res.json({ 
      success: true, 
      paymentUrl: decryptedResponse.pay_url || decryptedResponse.payment_url || decryptedResponse.url 
    });

  } catch (err) {
    console.error('HelloPay Error:', err?.response?.data || err.message);
    return res.status(500).json({ success: false, message: 'Payment initiation failed', error: err.message });
  }
};

// 2. Webhook Receiver (HelloPay server se call hoga)
exports.helloPayWebhook = async (req, res) => {
  try {
    const { merchant_code, timestamp, data, sign } = req.body;

    if (!sign || !data) return res.status(400).send('Missing data');

    // Verify Signature
    const expectedSign = generateHelloPaySign(data, process.env.HELLO_MERCHANT_CODE, timestamp, process.env.HELLO_SIGN_SALT);
    if (sign.toLowerCase() !== expectedSign.toLowerCase()) {
      console.log('Invalid HelloPay Webhook Signature');
      return res.status(400).send('Invalid Signature');
    }

    // Decrypt Data
    const webhookData = decryptHelloPayData(data);

    // Check Status
    if (webhookData.status === 'SUCCESS' || webhookData.status === 'PAID') {
      const orderId = webhookData.merchant_order_id;
      const amount = Number(webhookData.amount);

      // Atomic guard: Prevent double crediting
      const deposit = await Deposit.findOneAndUpdate(
        { referenceId: orderId, status: 'pending' },
        { $set: { status: 'approved', reviewedAt: new Date() } },
        { new: true }
      );

      if (!deposit) return res.status(200).send('OK'); // Already processed

      // Update User Balance
      const user = await User.findById(deposit.userId);
      if (user) {
        const balanceBefore = user.balance;
        const balanceAfter = balanceBefore + amount;
        
        user.balance = balanceAfter;
        if (!user.isUnlocked && balanceAfter >= MINIMUM_UNLOCK_DEPOSIT) {
          user.isUnlocked = true;
        }
        await user.save();

        await Transaction.create({
          userId: user._id,
          type: 'deposit',
          amount: amount,
          balanceBefore,
          balanceAfter,
          referenceId: orderId,
          status: 'approved',
          description: `HelloPay UPI Deposit of ₹${amount} successful`,
        });

        await Notification.create({
          userId: user._id,
          title: 'Deposit Successful',
          message: `₹${amount} has been credited to your account via UPI.`,
          type: 'deposit_approved',
        });
      }
    }
    return res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(500).send('Error');
  }
};

// ==========================================
// MANUAL CRYPTO METHODS (Unchanged)
// ==========================================

exports.getDepositAddresses = async (req, res) => {
  try {
    const addresses = await DepositAddress.find({ isActive: true }).sort({ isPopular: -1, coin: 1 });
    return res.json({ success: true, addresses, minimumUnlockDeposit: MINIMUM_UNLOCK_DEPOSIT });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

const UNLOCK_WINDOW_MINUTES = 60;

exports.getUnlockAddresses = async (req, res) => {
  try {
    const addresses = await DepositAddress.find({ isActive: true, coinSymbol: 'USDT', network: { $in: ['TRC20', 'BEP20'] } });
    return res.json({ success: true, addresses, minimumUnlockDeposit: MINIMUM_UNLOCK_DEPOSIT });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.initUnlockDeposit = async (req, res) => {
  try {
    const { amount, network } = req.body;
    if (!amount || !network) return res.status(400).json({ success: false, message: 'Amount and network are required' });
    if (!['TRC20', 'BEP20'].includes(network)) return res.status(400).json({ success: false, message: 'Invalid network' });
    if (Number(amount) < MINIMUM_UNLOCK_DEPOSIT) return res.status(400).json({ success: false, message: `Minimum unlock deposit is ${MINIMUM_UNLOCK_DEPOSIT} USDT` });

    const addressConfig = await DepositAddress.findOne({ coinSymbol: 'USDT', network, isActive: true });
    if (!addressConfig) return res.status(400).json({ success: false, message: 'This network is not currently available for deposits' });

    const expiresAt = new Date(Date.now() + UNLOCK_WINDOW_MINUTES * 60 * 1000);
    const deposit = await Deposit.create({
      userId: req.userId, amount: Number(amount), coin: 'USDT', network,
      depositAddress: addressConfig.address, referenceId: generateReferenceId('UNLOCK'),
      status: 'initiated', isUnlockDeposit: true, expiresAt,
    });
    return res.status(201).json({ success: true, deposit });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.confirmUnlockSent = async (req, res) => {
  try {
    const deposit = await Deposit.findOne({ _id: req.params.id, userId: req.userId, isUnlockDeposit: true });
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit request not found' });
    if (deposit.status !== 'initiated') return res.status(409).json({ success: false, message: 'This request can no longer be confirmed' });
    if (deposit.expiresAt && deposit.expiresAt < new Date()) {
      deposit.status = 'cancelled'; deposit.rejectionReason = 'Expired before funds were confirmed sent'; await deposit.save();
      return res.status(410).json({ success: false, message: 'This deposit request has expired' });
    }
    deposit.status = 'pending'; await deposit.save();
    return res.json({ success: true, message: 'Deposit submitted for admin review', deposit });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.cancelUnlockDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, isUnlockDeposit: true, status: 'initiated' },
      { $set: { status: 'cancelled' } }, { new: true }
    );
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit request not found or already processed' });
    return res.json({ success: true, message: 'Deposit cancelled', deposit });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.createDeposit = async (req, res) => {
  try {
    const { amount, coin, network, depositAddress, referenceId } = req.body;
    if (!amount || !coin || !network || !depositAddress || !referenceId) return res.status(400).json({ success: false, message: 'All fields are required' });
    if (Number(amount) <= 0) return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });

    const deposit = await Deposit.create({
      userId: req.userId, amount: Number(amount), coin, network, depositAddress, referenceId,
      paymentProof: req.file ? `/uploads/payment-proofs/${req.file.filename}` : null, status: 'pending',
    });
    return res.status(201).json({ success: true, message: 'Deposit request submitted for review', deposit });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.getMyDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.json({ success: true, deposits });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ---------- ADMIN (Manual Deposit Approvals) ----------
exports.adminListDeposits = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const deposits = await Deposit.find(filter).populate('userId', 'name email accountId').sort({ createdAt: -1 });
    return res.json({ success: true, deposits });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.adminApproveDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findOneAndUpdate({ _id: req.params.id, status: 'pending' }, { $set: { status: 'approved', adminId: req.adminId, reviewedAt: new Date() } }, { new: true });
    if (!deposit) return res.status(409).json({ success: false, message: 'Deposit already processed or not found' });

    const user = await User.findById(deposit.userId);
    const balanceBefore = user.balance;
    const balanceAfter = balanceBefore + deposit.amount;
    user.balance = balanceAfter;
    if (!user.isUnlocked && balanceAfter >= MINIMUM_UNLOCK_DEPOSIT) user.isUnlocked = true;
    await user.save();

    await Transaction.create({ userId: user._id, type: 'deposit', amount: deposit.amount, balanceBefore, balanceAfter, referenceId: deposit.referenceId, status: 'approved', description: `Deposit of ${deposit.amount} ${deposit.coin} approved` });
    await Notification.create({ userId: user._id, title: 'Deposit approved', message: `Your deposit of ${deposit.amount} ${deposit.coin} has been approved.`, type: 'deposit_approved' });
    await AdminAuditLog.create({ adminId: req.adminId, action: 'APPROVE_DEPOSIT', targetType: 'Deposit', targetId: deposit._id, details: `Approved deposit of ${deposit.amount} ${deposit.coin} for user ${user.email}` });

    return res.json({ success: true, message: 'Deposit approved', deposit });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.adminRejectDeposit = async (req, res) => {
  try {
    const { reason } = req.body;
    const deposit = await Deposit.findOneAndUpdate({ _id: req.params.id, status: 'pending' }, { $set: { status: 'rejected', adminId: req.adminId, reviewedAt: new Date(), rejectionReason: reason || 'Not specified' } }, { new: true });
    if (!deposit) return res.status(409).json({ success: false, message: 'Deposit already processed or not found' });

    await Notification.create({ userId: deposit.userId, title: 'Deposit rejected', message: `Your deposit request of ${deposit.amount} ${deposit.coin} was rejected. Reason: ${deposit.rejectionReason}`, type: 'deposit_rejected' });
    await AdminAuditLog.create({ adminId: req.adminId, action: 'REJECT_DEPOSIT', targetType: 'Deposit', targetId: deposit._id, details: `Rejected deposit ${deposit._id}: ${deposit.rejectionReason}` });

    return res.json({ success: true, message: 'Deposit rejected', deposit });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.adminListAddresses = async (req, res) => {
  try {
    const addresses = await DepositAddress.find().sort({ coin: 1 });
    return res.json({ success: true, addresses });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.adminUpsertAddress = async (req, res) => {
  try {
    let { coin, coinSymbol, network, address, minimumDeposit, isPopular, isActive } = req.body;
    if (!coin || !coinSymbol || !network || !address || minimumDeposit == null) return res.status(400).json({ success: false, message: 'All fields are required' });

    coin = coin.trim(); coinSymbol = coinSymbol.trim().toUpperCase(); network = network.trim().toUpperCase(); address = address.trim();
    const updated = await DepositAddress.findOneAndUpdate({ coinSymbol, network }, { coin, coinSymbol, network, address, minimumDeposit, isPopular: !!isPopular, isActive: isActive !== false }, { new: true, upsert: true });
    await AdminAuditLog.create({ adminId: req.adminId, action: 'UPSERT_DEPOSIT_ADDRESS', targetType: 'DepositAddress', targetId: updated._id, details: `Set deposit address for ${coinSymbol} on ${network}` });

    return res.json({ success: true, message: 'Deposit address saved', address: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.adminDeleteAddress = async (req, res) => {
  try {
    await DepositAddress.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Deposit address removed' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
