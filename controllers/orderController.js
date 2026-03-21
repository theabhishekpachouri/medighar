const db = require('../db');

exports.updateOrderStatus = async (req, res) => {
    try {
        const { order_id, status, medicine_id, quantity_ordered } = req.body;

        if (status === 'Delivered') {
            // 1. Stock Deduct karna
            const result = await db.query(
                "UPDATE inventory SET stock = stock - $1 WHERE id = $2 RETURNING stock",
                [quantity_ordered, medicine_id]
            );

            const updatedStock = result.rows[0].stock;

            // 2. Threshold Check (Alert Logic)
            /* COMMENT: Agar stock 10 se kam hai toh alert generate hoga */
            if (updatedStock < 10) {
                console.log(`LOW STOCK ALERT: Medicine ID ${medicine_id} is running low (${updatedStock} left).`);
                // Aap yahan se ek alag "alert" flag bhi bhej sakte hain frontend ko
            }
        }

        res.status(200).json({ message: "Order processed and stock updated." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};