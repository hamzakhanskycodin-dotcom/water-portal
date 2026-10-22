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

// --- 1. DASHBOARD LOGS SCHEMA ---
const LogSchema = new mongoose.Schema({
    month: { type: String, required: true }, // Format: "YYYY-MM"
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

const Log = mongoose.model('MonthlyLog', LogSchema);

// --- 2. CUSTOMER MATRIX SCHEMA ---
const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    days: { type: [Number], default: () => new Array(30).fill(0) }
});
const Customer = mongoose.model('Customer', CustomerSchema);


// ==================== API ROUTES ====================

// Dashboard Routes
// ==================== API ROUTES ====================

// 1. Dashboard Routes - Logs Fetching with Month Filter (Line 41 se 46)
app.get('/api/logs', async (req, res) => {
    try {
        const { month } = req.query; // Frontend se aane wala target month (e.g., '2026-11')
        
        let filter = {};
        if (month) {
            filter.month = month; // Agar month bheja hai to sirf usi month ka data nikalein
        }

        const logs = await Log.find(filter).sort({ day: 1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Log Update/Upsert with Month Mapping (Line 49 se 70)
app.post('/api/logs/update', async (req, res) => {
    try {
        const { month, day, field, value } = req.body;

        // Dynamic update query taake jo field user ne badli hai wahi update ho
        const updateData = {};
        updateData[field] = Number(value) || 0;

        // 🔴 CRITICAL FIX: Ab database me month aur day dono check honge taake cross-talk na ho
        const updatedLog = await Log.findOneAndUpdate(
            { month: month, day: Number(day) }, 
            { $set: updateData },
            { new: true, upsert: true } // Agar is month/day ka entry nahi hai to automatic naya create hoga
        );

        res.status(200).json({ success: true, data: updatedLog });
    } catch (err) {
        console.error("Database update failed:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});



// Customer Sheet Routes (Naye Added Routes)
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json(customers);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/customers/add', async (req, res) => {
    try {
        const newCustomer = new Customer({ name: req.body.name, days: new Array(30).fill(0) });
        await newCustomer.save();
        res.json({ success: true, customer: newCustomer });
    } catch (err) { res.status(500).json({ error: err.message }); }
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
