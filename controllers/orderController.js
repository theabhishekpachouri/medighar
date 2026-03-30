const db = require('../db');

//  CREATE ORDER 
exports.createOrder = async (req, res) => {
    try {
        const { medicine_id, medicine_name, quantity_ordered, customer_name, store_id } = req.body;

        // Check Medicine (using medicine_id)
        const medicineData = await db.query("SELECT price, stock FROM inventory WHERE medicine_id = $1", [medicine_id]);

        if (medicineData.rows.length === 0) {
            return res.status(404).json({ error: "Medicine not found!" });
        }

        // Check Store Status (Joining on store_id)
        const storeStatus = await db.query(
            "SELECT status FROM stores WHERE store_id = $1", [store_id]);

        if (!storeStatus.rows[0] || storeStatus.rows[0].status !== 'Active' || storeStatus.rows[0].status === 'Rejected' ) {
            return res.status(403).json({ message: "This store is not verified yet!" });
        }

        const medicine = medicineData.rows[0];
        
        if (medicine.stock < quantity_ordered) {
            return res.status(400).json({ 
                success: false, 
                message: `SORRY, BUT ONLY ${medicine.stock} LEFT!` 
            });
        }

        const total_price = medicine.price * quantity_ordered;

        //  Added all columns as per your DB
        const queryText = `
            INSERT INTO orders (medicine_id, medicine_name, quantity_ordered, customer_name, price, total_price, store_id, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending') RETURNING *`;
        
        const result = await db.query(queryText, [medicine_id, medicine_name, quantity_ordered, customer_name, medicine.price, total_price, store_id]);

        res.status(201).json({ success: true, order: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Order create FAILED" });
    }
};

// GET ALL ORDERS 
exports.getAllOrders = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                order_id, 
                customer_name, 
                medicine_name, 
                quantity_ordered, 
                total_price, 
                status, 
                order_date
            FROM orders
            ORDER BY order_date DESC`;

        const result = await db.query(queryText);

        res.status(200).json({ success: true, count: result.rowCount, orders: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "History fetch nahi ho payi" });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { order_id, status, medicine_id, quantity_ordered } = req.body;

        // Valid Status sequence define karo
        const statusSequence = ['Pending', 'Ready for Pickup', 'Out for Delivery', 'Delivered'];
        
        if (!statusSequence.includes(status)) {
            return res.status(400).json({ error: "Invalid status !" });
        }

        //  Agar status 'Delivered' ho raha hai, tabhi stock kam hoga
        if (status === 'Delivered') {
            // Inventory update query
            const inventoryUpdate = await db.query(
                "UPDATE inventory SET stock = stock - $1 WHERE medicine_id = $2 AND stock >= $1 RETURNING stock",
                [quantity_ordered, medicine_id]
            );

            if (inventoryUpdate.rows.length === 0) {
                return res.status(400).json({ error: "Stock khatam ho gaya ya medicine nahi mili!" });
            }
        }

        // Order table mein status update karo
        const result = await db.query(
            "UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *",
            [status, order_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Order ID galat hai!" });
        }

        res.status(200).json({ 
            success: true, 
            message: `Order marked as ${status}`,
            current_order: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Status update fail ho gaya!" });
    }
};


//  CANCEL ORDER   
exports.cancelOrder = async (req, res) => {
    try {
        const { order_id } = req.params; 

        const orderData = await db.query("SELECT medicine_id, quantity_ordered, status FROM orders WHERE order_id = $1", [order_id]);

        if (orderData.rows.length === 0) {
            return res.status(404).json({ error: "Order nahi mila!" });
        }

        const { medicine_id, quantity_ordered, status } = orderData.rows[0];

        if (status === 'Cancelled') {
            return res.status(400).json({ message: "Order pehle hi cancel ho chuka hai." });
        }

        if (status === 'Delivered') {
            await db.query("UPDATE inventory SET stock = stock + $1 WHERE medicine_id = $2", [quantity_ordered, medicine_id]);
        }

        await db.query("UPDATE orders SET status = 'Cancelled' WHERE order_id = $1", [order_id]);

        res.status(200).json({ success: true, message: "Order Cancelled & Stock Restored!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Cancel error." });
    }
};

// GENERATE BILL 
exports.generateBill = async (req, res) => {
    try {
        const { order_id } = req.params;

        const queryText = `
            SELECT 
                o.order_id AS invoice_no,
                s.store_name, 
                s.full_address, 
                s.contact, 
                o.customer_name, 
                o.medicine_name, 
                o.price AS unit_price, 
                o.quantity_ordered, 
                o.total_price, 
                o.status, 
                o.order_date
            FROM orders o
            JOIN stores s ON o.store_id = s.store_id 
            WHERE o.order_id = $1`;

        const result = await db.query(queryText, [order_id]);

        if (result.rows.length === 0) return res.status(404).json({ error: " order Not found!" });

        const order = result.rows[0];

         // Calculation (GST  12% )
        const gstAmount = order.total_price * 0.12;
        const grandTotal = parseFloat(order.total_price) + gstAmount;
        
        //  Bill Response
        res.status(200).json({
            Platform_Name: "MediGhar",
            invoice_details: { 
                store: order.store_name, 
                custumer_name: order.customer_name, 
                bill_no: order.invoice_no,
                 date: order.order_date
            },

            items:
            [{
                 name: order.medicine_name, 
                 qty: order.quantity_ordered, 
                 price: order.unit_price, 
                 total: order.total_price
            }],

            summary:
            {
                total_before_tax: order.total_price,
                gst_12_percent: gstAmount.toFixed(2), 
                grand_total: grandTotal.toFixed(2) 
            },
            status: order.status
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Bill generate karne mein error aaya." });
    }
};