const express = require('express');
const router = express.Router();
const earningController = require('../controllers/earningController');
const { verifyUser } = require('../middleware/auth');

router.get('/summary', verifyUser, earningController.getEarningsSummary);
router.get('/history', verifyUser, earningController.getEarningsHistory);

module.exports = router;
