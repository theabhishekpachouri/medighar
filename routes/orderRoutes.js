const express = require('express');
const router = express.Router();
const orderCtrl = require('../controllers/orderController');


router.post('/create', orderCtrl.createOrder); // Naya order banane ke liye
router.put('/update', orderCtrl.updateOrderStatus); // Status change aur stock deduct ke liye


router.get('/all-orders', orderCtrl.getAllOrders);
router.get('/all', orderCtrl.getAllOrders);

router.put('/cancel/:order_id', orderCtrl.cancelOrder);

router.get('/bill/:order_id', orderCtrl.generateBill);

module.exports = router;