const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyUser } = require('../middleware/auth');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/profile', verifyUser, authController.getProfile);
router.put('/profile', verifyUser, authController.updateProfile);
router.put('/change-password', verifyUser, authController.changePassword);

module.exports = router;
