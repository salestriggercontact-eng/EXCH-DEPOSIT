const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyUser } = require('../middleware/auth');

router.get('/', verifyUser, reportController.getReports);

module.exports = router;
