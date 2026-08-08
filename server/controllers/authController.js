const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generateAccountId } = require('../utils/generateId');

function signToken(user) {
  return jwt.sign({ id: user._id, type: 'user' }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

exports.signup = async (req, res) => {
  try {
    const { name, email, mobile, password, confirmPassword, referralCode } = req.body;

    if (!name || !email || !mobile || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let accountId = generateAccountId();
    // ensure uniqueness
    while (await User.findOne({ accountId })) {
      accountId = generateAccountId();
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      mobile,
      passwordHash,
      accountId,
      referralCode: referralCode || null,
    });

    // default onboarding notifications shown to every new user
    await Notification.insertMany([
      {
        userId: user._id,
        title: 'Verification pending',
        message: 'Verification pending. Complete Telegram step.',
        type: 'telegram_verification',
      },
      {
        userId: user._id,
        title: 'Deposit required',
        message: 'Deposit is required before any trading operations.',
        type: 'deposit_required',
      },
      {
        userId: user._id,
        title: 'Account ready',
        message: 'Your account UI preview is ready.',
        type: 'system',
      },
    ]);

    const token = signToken(user);
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountId: user.accountId,
        balance: user.balance,
        isUnlocked: user.isUnlocked,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user);
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountId: user.accountId,
        balance: user.balance,
        isUnlocked: user.isUnlocked,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, mobile } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { ...(name && { name }), ...(mobile && { mobile }) } },
      { new: true }
    ).select('-passwordHash');
    return res.json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.updateBankDetails = async (req, res) => {
  try {
    const { accountNumber, ifscCode, bankName } = req.body;
    if (!accountNumber || !ifscCode || !bankName) {
      return res.status(400).json({ success: false, message: 'Account number, IFSC code, and bank name are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          bankDetails: {
            accountNumber: accountNumber.trim(),
            ifscCode: ifscCode.trim().toUpperCase(),
            bankName: bankName.trim(),
            verified: false, // any edit requires admin to re-verify
            verifiedAt: null,
          },
        },
      },
      { new: true }
    ).select('-passwordHash');

    return res.json({ success: true, message: 'Bank details saved, pending admin verification', user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
