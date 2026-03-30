const db = require('../db');
const xlsx = require('xlsx');

// - MANUAL ADDITION ---
exports.addMedicineManual = async (req, res) => {
    try {
        const {medicine_name, batch_number, expiry, price, stock_quantity, store_id} = req.body;

        // Validation: Quantity check
        if (!medicine_name || stock_quantity === undefined || stock_quantity < 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Validation Error: Medicine name and positive quantity are required!" 
            });
        }

        const queryText = `INSERT INTO inventory (medicine_name, batch_number, expiry, price, stock, store_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
        const values = [medicine_name, batch_number, expiry, price, stock_quantity, store_id];
        
        await db.query(queryText, values);
        res.status(201).json({ success: true, message: "Medicine added manually successfully!" });

    } catch (err) {
        res.status(500).json({ success: false, message: "Server Error in manual upload" });
    }
};

// --- OPTION 2: EXCEL BULK UPLOAD ---

exports.uploadExcelInventory = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Please select an Excel file first!" });
        }

        // Excel file read karna
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw : false, dateNF : 'yyyy-mm-dd' } );

        // Ek empty array errors collect karne ke liye (Optional)
        for (let i = 0; i < data.length; i++) {
            const row = data[i];

    
            // Agar kisi row mein medicine ka naam ya quantity missing hai
            if (!row.medicine_name || row.stock_quantity === undefined) {
               
                //  MESSAGE FOR FRONTEND : Niche wala response frontend par 'Popup' bankar dikhega 
              
                return res.status(400).json({ 
                    success: false, 
                    message: `Upload Stopped! Error at Row ${i + 2}: Medicine name or Quantity is missing. Please fix the Excel file and re-upload.` 
                });
            }


            // database me insert krne keliye

             const queryText = `
                    INSERT INTO inventory (medicine_name, batch_number, expiry, price, stock, store_id) 
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (medicine_name) 
                    DO UPDATE SET 
                        stock = inventory.stock + EXCLUDED.stock,
                        price = EXCLUDED.price,
                        batch_number = EXCLUDED.batch_number,
                        expiry = EXCLUDED.expiry;
                    `;
            
                const values = [
                    row.medicine_name, 
                    row.batch_number, 
                    row.expiry, 
                    row.price, 
                    row.stock_quantity, 
                    row.store_id 
                ];

                await db.query(queryText, values);
        }

        res.status(200).json({ success: true, message: "All medicines from Excel uploaded successfully!" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Excel processing failed. Check file format." });
    }
};

