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
const logSchema = new mongoose.Schema({
  month: { type: String, required: true }, // Naya Field: Format "YYYY-MM"
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
const MonthlyLog = mongoose.model('MonthlyLog', logSchema);
// --- 2. CUSTOMER MATRIX SCHEMA ---
const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  month: { type: String, required: true, default: () => new Date().toISOString().slice(0, 7) }, // Format "YYYY-MM"
  days: { type: [Number], default: () => new Array(30).fill(0) }
});
const Customer = mongoose.model('Customer', CustomerSchema);



// ==================== API ROUTES ====================

app.get('/api/logs', async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // "2026-10"
    // Direct MonthlyLog model use karein
    const logs = await MonthlyLog.find({ month: currentMonth }).sort({ day: 1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logs/update', async (req, res) => {
  try {
    const { day, field, value } = req.body;
    const currentMonth = new Date().toISOString().slice(0, 7);

    const updateData = {};
    updateData[field] = Number(value) || 0;

    // Direct MonthlyLog variable use karein
    const updatedLog = await MonthlyLog.findOneAndUpdate(
      { month: currentMonth, day: Number(day) },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: updatedLog });
  } catch (err) {
    console.error("Database update failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});




app.get('/api/customers', async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // Auto "2026-10"
    // mongoose.model(...) ki jagah direct Customer variable use karein
    const customers = await Customer.find({ month: currentMonth }); 
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.post('/api/customers/add', async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const newCustomer = new Customer({
      name: req.body.name,
      month: currentMonth,
      days: new Array(30).fill(0)
    });
    await newCustomer.save();
    res.json({ success: true, customer: newCustomer });
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

app.get('/api/history', async (req, res) => {
  try {
    const targetMonth = req.query.month; // Frontend se select kiya hua month milega jese "2026-09"
    if (!targetMonth) {
      return res.status(400).json({ error: "Month parameter is required" });
    }

    // 1. Dashboard summary calculation targeted month ke mutabiq
    const logs = await mongoose.model('MonthlyLog').find({ month: targetMonth });
    
    let summary = {
      totalSupply: 0, counterSale: 0, hamzaSupplier: 0, arsalanBhai: 0,
      makkahPlant: 0, juttPlant: 0, fuelExpense: 0, otherPayments: 0
    };

    logs.forEach(log => {
      summary.totalSupply += log.totalSupply || 0;
      summary.counterSale += log.counterSale || 0;
      summary.hamzaSupplier += log.hamzaSupplier || 0;
      summary.arsalanBhai += log.arsalanBhai || 0;
      summary.makkahPlant += log.makkahPlant || 0;
      summary.juttPlant += log.juttPlant || 0;
      summary.fuelExpense += log.fuelExpense || 0;
      summary.otherPayments += log.otherPayments || 0;
    });

    // 2. Customers fetch targeted month ke mutabiq
    const dbCustomers = await mongoose.model('Customer').find({ month: targetMonth });

    // Frontend matrix format ke mutabiq structure map karna
    const customersFormatted = dbCustomers.map(cust => {
      let monthlyLogs = {};
      // days array ko object mapping {1: val, 2: val} me convert karna
      cust.days.forEach((val, idx) => {
        monthlyLogs[idx + 1] = { totalSupply: val };
      });

      return {
        name: cust.name,
        monthlyLogs: monthlyLogs
      };
    });

    res.json({
      summary: summary,
      customers: customersFormatted
    });

  } catch (err) {
    console.error("History database fetch error:", err);
    res.status(500).json({ error: "Internal Database Error in History Fetch" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
