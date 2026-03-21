const express = require('express');
const router = express.Router();
const orderCtrl = require('../controllers/orderController');

router.put('/update', orderCtrl.updateOrderStatus);

module.exports = router;