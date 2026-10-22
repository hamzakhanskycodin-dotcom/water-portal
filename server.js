const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Line 10 par is naye user (hamza:water12345) wala link paste karein:
const mongoURI = "mongodb+srv://hamza:water12345@cluster0.qdf49ev.mongodb.net/?appName=Cluster0&compressors=zlib";

mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB Connected Successfully!"))
    .catch(err => console.error("Database connection error:", err));

// 🔽 Apne server.js ke Schema wale hisse ko badal kar yeh likhein:
const LogSchema = new mongoose.Schema({
    month: { type: String, required: true }, // 👈 Yeh line lagana zaroori hai (Format: "YYYY-MM")
    day: { type: Number, required: true },
    counterSale: { type: Number, default: 0 },
    hamzaSupplier: { type: Number, default: 0 },
    arsalanBhai: { type: Number, default: 0 },
    makkahPlant: { type: Number, default: 0 },
    juttPlant: { type: Number, default: 0 },
    totalSupply: { type: Number, default: 0 },
    borrowBottles: { type: Number, default: 0 },
    fuelExpense: { type: Number, default: 0 },
    otherPayments: { type: Number, default: 0 }
});

// Model registeration line (agar pehle se bani hai to wahi rehne dein)
const Log = mongoose.models.Log || mongoose.model('Log', LogSchema);

// --- 2. CUSTOMER MATRIX SCHEMA ---
const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    days: { type: [Number], default: () => new Array(30).fill(0) }
});
const Customer = mongoose.model('Customer', CustomerSchema);


// ==================== API ROUTES ====================

// ==================== FOOLPROOF API ROUTES ====================

// 1. Logs Fetching Route (Safe Filter)
app.get('/api/logs', async (req, res) => {
    try {
        const { month } = req.query; // Frontend filter string (e.g., '2026-09')
        
        let filter = {};
        if (month && month !== "undefined" && month !== "null") {
            filter.month = month; // Sirf tab filter lagayein jab month available ho
        }

        // Database query execution
        const logs = await Log.find(filter).sort({ day: 1 });
        res.status(200).json(logs);
    } catch (err) {
        console.error("GET /api/logs crash log:", err);
        res.status(500).json([]); // Frontend crash se bachane ke liye khali array bhejein
    }
});

// 2. Logs Upsert Route (Safe Auto-Creation)
app.post('/api/logs/update', async (req, res) => {
    try {
        const { month, day, field, value } = req.body;

        // Validation check taake servers invalid fields par crash na hon
        if (!month || !day || !field) {
            return res.status(400).json({ success: false, error: "Missing parameters" });
        }

        const updateData = {};
        updateData[field] = Number(value) || 0;

        // Find and update or insert if doesn't exist
        const updatedLog = await Log.findOneAndUpdate(
            { month: month, day: Number(day) }, 
            { $set: updateData },
            { new: true, upsert: true, runValidators: false } // runValidators false rakhne se strict validation crash nahi karegi
        );

        res.status(200).json({ success: true, data: updatedLog });
    } catch (err) {
        console.error("POST /api/logs/update crash log:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});




// Customer Sheet Routes (Naye Added Routes)
// 🔽 server.js me customers data fetch route ko badal kar yeh likhein:
app.get('/api/customers', async (req, res) => {
    try {
        const { month } = req.query; // Frontend se aane wala query month (e.g., '2026-09')
        
        let query = {};
        if (month) {
            query.month = month; // Sirf target month ka data filter karein
        }

        // Database se filter kiya hua data nikalna
        const customers = await Customer.find(query); 
        res.status(200).json(customers);
    } catch (err) {
        console.error("Error fetching filtered customers:", err);
        res.status(500).json([]);
    }
});


app.post('/api/customers/add', async (req, res) => {
    try {
        const { name, month } = req.body; // Month parameter receive karna

        const newCustomer = new Customer({
            name,
            month: month || new Date().toLocaleDateString('default', { month: 'long', year: 'numeric' }), 
            days: {} // Blank 30 days grid array object
        });

        await newCustomer.save();
        res.status(201).json(newCustomer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/customers/update', async (req, res) => {
    const { id, dayIdx, value } = req.body;
    try {
        let customer = await Customer.findById(id);
        if (!customer) return res.status(404).json({ error: "Customer not found" });
        customer.days[dayIdx] = Number(value) || 0;
        customer.markModified('days'); // Mongoose arrays ko live identify karne ke liye
        await customer.save();
        res.json({ success: true, customer });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/customers/delete/:id', async (req, res) => {
    try {
        await Customer.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// Example Node.js/Express Backend Route
app.get('/api/history', (req, res) => {
    const { month } = req.query; // Yeh '2026-09' receive karega
    // Database se us mahine ka data fetch karne ka code...
});
