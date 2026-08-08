const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payoutController');
const { verifyUser, verifyAdmin } = require('../middleware/auth');

// user
router.post('/', verifyUser, payoutController.createPayout);
router.get('/my', verifyUser, payoutController.getMyPayouts);

// admin
router.get('/admin/all', verifyAdmin, payoutController.adminListPayouts);
router.patch('/admin/:id/approve', verifyAdmin, payoutController.adminApprovePayout);
router.patch('/admin/:id/reject', verifyAdmin, payoutController.adminRejectPayout);

module.exports = router;
