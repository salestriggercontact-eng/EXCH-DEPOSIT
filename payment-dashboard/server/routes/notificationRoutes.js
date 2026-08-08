const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyUser } = require('../middleware/auth');

router.get('/', verifyUser, notificationController.getNotifications);
router.patch('/:id/read', verifyUser, notificationController.markAsRead);
router.patch('/read-all', verifyUser, notificationController.markAllAsRead);

module.exports = router;
