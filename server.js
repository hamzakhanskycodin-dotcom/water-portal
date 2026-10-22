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
    day: { type: Number, required: true, unique: true },
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
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await Log.find().sort({ day: 1 });
        res.json(logs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Apne app.post('/api/logs/update') ke andar is tarah complete update logic likhein:
app.post('/api/logs/update', async (req, res) => {
    try {
        const { day, field, value } = req.body;

        // Dynamic query taake koi bhi field (samet totalSupply) force update ho jaye
        const updateData = {};
        updateData[field] = Number(value) || 0;

        // upsert: true se agar field ya document nahi bana hoga toh khud ban jayega
        const updatedLog = await Log.findOneAndUpdate(
            { day: Number(day) },
            { $set: updateData },
            { new: true, upsert: true }
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
