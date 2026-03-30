const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/licenses/' }); // License files yahan save hongi

// 1. Store Register: Bina license file ke allow nahi karega (Handled in controller)
router.post('/register', upload.single('license_url'), storeController.registerStore);

// 2. Admin Approval: Jab admin click karega tabhi store live hoga
router.put('/verify/:id', storeController.verifyStore); 

// Admin actions
router.patch('/verify/:id', storeController.verifyStore);
router.patch('/reject/:id', storeController.rejectStore);

module.exports = router;