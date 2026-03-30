const db = require('../db'); // Database connection import

exports.registerStore = async (req, res) => {
    try {
        const { store_name, location,gst_no,owner_name, contact, full_address } = req.body;
        const license_file = req.file; // Multer se file aayegi

        // License check ---
        if (!license_file) {
            return res.status(400).json({ 
                success: false, 
                message: "Registration Failed: Please upload your license file first!" 
            });
        }

        const license_url = license_file.path;

        //  Database entry with 'Pending' status ---
        const queryText = `
            INSERT INTO stores (store_name, location, license_url, gst_no, owner_name, contact, full_address, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *`;
        
        const values = [store_name, location, license_url, gst_no, owner_name, contact, full_address, 'Pending'];
        const result = await db.query(queryText, values);

        //  Success Message for Frontend Popup ---
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

// Admin verify karne ke liye 

//  for store approve 

exports.verifyStore = async (req, res) => {
    const { id } = req.params;
    try {
        // RETURNING * likhna zaroori hai taaki hume pata chale kuch update hua ya nahi
        const result = await db.query(
            "UPDATE stores SET status = 'Active' WHERE store_id = $1 RETURNING *", 
            [id]
        );

        // Agar result.rows khali hai, matlab wo ID database mein nahi hai
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Store nahi mila! Galat ID di hai aapne." 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Store is now Active!",
            data: result.rows[0] // Updated store ki details dikhayega
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            success: false, 
            message: "Approval failed due to server error." 
        });
    }
};
     

//  for STORE REJECT 
exports.rejectStore = async (req, res) => {
    try {
        const { id } = req.params;
        const { remark } = req.body;    //  Jaise: "License clear nahi hai"

        const queryText = `
            UPDATE stores 
            SET status = 'Rejected', admin_remark = $1 
            WHERE store_id = $2 
            RETURNING *`;

        const result = await db.query(queryText, [remark || "Invalid Details", id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Store not found !" });
        }

        res.status(200).json({
            success: true,
            message: "Store rejected.",
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: "Reject karne mein error: " + err.message });
    }
};