const express = require('express');
const router = express.Router();
const customFieldController = require('../controllers/customFieldController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/', verifyAdmin, customFieldController.listCustomFields);
router.post('/', verifyAdmin, customFieldController.createCustomField);
router.put('/:id', verifyAdmin, customFieldController.updateCustomField);
router.delete('/:id', verifyAdmin, customFieldController.deleteCustomField);

module.exports = router;
