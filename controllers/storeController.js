const db = require('../db'); // Database connection import

exports.registerStore = async (req, res) => {
    try {
        const { store_name, location } = req.body;
        const license_file = req.file; // Multer se file aayegi

        // --- CONDITION 1: License check ---
        if (!license_file) {
            return res.status(400).json({ 
                success: false, 
                message: "Registration Failed: Please upload your license file first!" 
            });
        }

        const license_url = license_file.path;

        // --- CONDITION 2: Database entry with 'Pending' status ---
        const queryText = `
            INSERT INTO stores (store_name, location, license_url, status) 
            VALUES ($1, $2, $3, 'Pending') 
            RETURNING *`;
        
        const values = [store_name, location, license_url];
        const result = await db.query(queryText, values);

        // --- CONDITION 3: Success Message for Frontend Popup ---
        res.status(201).json({ 
            success: true, 
            message: "Registration successful! Admin will verify your license soon.",
            data: result.rows[0] 
        });

    } catch (err) {
        console.error("Error in registerStore:", err.message);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error. Please try again later." 
        });
    }
};

// Admin verify karne ke liye alag function
exports.verifyStore = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE stores SET status = 'Active' WHERE id = $1", [id]);
        res.status(200).json({ success: true, message: "Store is now Active!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Approval failed." });
    }
};