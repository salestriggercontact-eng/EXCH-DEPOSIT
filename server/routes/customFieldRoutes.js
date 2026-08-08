// server/routes/customFieldRoutes.js
const express = require('express');
const router = express.Router();
const customFieldController = require('../controllers/customFieldController');
const { verifyUser, verifyAdmin } = require('../middleware/auth');

// user
router.get('/', verifyUser, customFieldController.getActiveFields);
router.put('/my', verifyUser, customFieldController.saveMyFieldValues);

// admin
router.get('/admin/all', verifyAdmin, customFieldController.adminListFields);
router.get('/admin/users-values', verifyAdmin, customFieldController.adminListUsersValues); // <-- नया
router.post('/admin', verifyAdmin, customFieldController.adminCreateField);
router.patch('/admin/:id', verifyAdmin, customFieldController.adminUpdateField);
router.delete('/admin/:id', verifyAdmin, customFieldController.adminDeleteField);

module.exports = router;
