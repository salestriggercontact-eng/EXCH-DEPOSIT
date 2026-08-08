const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyUser } = require('../middleware/auth');

router.get('/home', verifyUser, dashboardController.getHomeSummary);

module.exports = router;
