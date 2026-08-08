const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/dashboard', verifyAdmin, adminController.getAdminDashboard);
router.get('/users', verifyAdmin, adminController.listUsers);
router.patch('/users/:id/status', verifyAdmin, adminController.updateUserStatus);
router.patch('/users/:id/bank-verify', verifyAdmin, adminController.verifyBankDetails);
router.get('/transactions', verifyAdmin, adminController.listAllTransactions);
router.get('/audit-logs', verifyAdmin, adminController.listAuditLogs);

module.exports = router;
