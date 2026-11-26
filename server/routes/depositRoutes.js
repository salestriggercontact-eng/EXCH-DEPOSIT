const express = require('express');
const router = express.Router();
const depositController = require('../controllers/depositController');
const { verifyUser, verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// 🔥 HELLOPAY AUTOMATED ROUTES
router.post('/create-payment', verifyUser, depositController.createHelloPayPayment);
router.post('/hellopay-webhook', depositController.helloPayWebhook); 

// MANUAL / CRYPTO ROUTES
router.get('/addresses', verifyUser, depositController.getDepositAddresses);
router.post('/', verifyUser, upload.single('paymentProof'), depositController.createDeposit);
router.get('/my', verifyUser, depositController.getMyDeposits);

router.get('/unlock/addresses', verifyUser, depositController.getUnlockAddresses);
router.post('/unlock/init', verifyUser, depositController.initUnlockDeposit);
router.patch('/unlock/:id/sent', verifyUser, depositController.confirmUnlockSent);
router.patch('/unlock/:id/cancel', verifyUser, depositController.cancelUnlockDeposit);

// ADMIN ROUTES
router.get('/admin/all', verifyAdmin, depositController.adminListDeposits);
router.patch('/admin/:id/approve', verifyAdmin, depositController.adminApproveDeposit);
router.patch('/admin/:id/reject', verifyAdmin, depositController.adminRejectDeposit);
router.get('/admin/addresses', verifyAdmin, depositController.adminListAddresses);
router.post('/admin/addresses', verifyAdmin, depositController.adminUpsertAddress);
router.delete('/admin/addresses/:id', verifyAdmin, depositController.adminDeleteAddress);

module.exports = router;
