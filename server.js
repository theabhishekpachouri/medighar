const express = require('express');
const app = express();
const path = require('path');

// Body Parser middleware (JSON data read karne ke liye)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes Import karna
const storeRoutes = require('./routes/storeRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');

// --- Routes add karna ---
// Jab bhi URL '/api/stores' se shuru hoga, wo storeRoutes file mein jayega
app.use('/api/stores', storeRoutes);

// Jab bhi URL '/api/inventory' se shuru hoga, wo inventoryRoutes file mein jayega
app.use('/api/inventory', inventoryRoutes);

app.use('/api/orders', orderRoutes);

// Static folder for uploads (taki hum images/licenses dekh sakein)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});