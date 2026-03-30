const express = require('express');
const router = express.Router();
const invController = require('../controllers/inventoryController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/excel/' });

// Choice 1: Manual Entry
router.post('/add-manual',upload.none(), invController.addMedicineManual);

// Choice 2: Excel Bulk Upload
router.post('/upload-excel', upload.single('excelFile'), invController.uploadExcelInventory);

module.exports = router;