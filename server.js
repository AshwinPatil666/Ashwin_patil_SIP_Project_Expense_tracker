const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./model/user'); // Model import kiya

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB se Connection (Local database ke liye)
// Pehle ye tha: 
// mongoose.connect('mongodb://127.0.0.1:27017/myDatabase')

// Ab isko aisa kar dein:
mongoose.connect('mongodb://127.0.0.1:27017/Spendwise')
    .then(() => console.log('spendwise Database Successfully Connected!'))
    .catch(err => console.log('Connection Error:', err));

// Form ka data save karne ki API Route
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Naya user database me save karein
        const newUser = new User({
            email,
            password
        });

        await newUser.save();
        res.status(201).json({ message: "Data successfully saved !" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error occurred while registering user." });
    }
});
// --- LOGIN API ---
// --- LOGIN API ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const foundUser = await User.findOne({ email: email });
        
        if (!foundUser) {
            return res.status(404).json({ error: "This email is not registered. Please create an account first." });
        }

        if (foundUser.password !== password) {
            return res.status(401).json({ error: "Invalid password. Please try again." });
        }

        // 👉 NAYA: Login successful hone par message ke sath user ki _id bhi bhejein
        res.status(200).json({ 
            message: "Login successful!",
            userId: foundUser._id // MongoDB wali asli unique ID
        });

    } catch (error) {
        console.error("Login me error:", error);
        res.status(500).json({ error: "Error occurred while logging in." });
    }
});
// File ke shuru me apne naye model ko import karein (agar nahi kiya hai toh)
const Expense = require('./model/expense');

// ==========================================
// ADD EXPENSE API
// ==========================================
app.post('/api/add-expense', async (req, res) => {
    try {
        console.log("Received expense data:", req.body); // 👉 Ye line yahan hai ya nahi?

        const expenseData = req.body;
        const newRecord = new Expense(expenseData);
        await newRecord.save();

        res.status(201).json({ message: "Expense added successfully!" });
        console.log("Your expense data has been saved:", newRecord); // 👉 Ye line yahan hai ya nahi?

    } catch (error) {
        console.error("Error occurred while adding expense:", error); // 👉 Agar yahan error aa rahi hai toh kya print ho raha hai?
        res.status(500).json({ message: "Error occurred while adding expense." });
    }
});
// ==========================================
// GET USER EXPENSES API (Database se data laane ke liye)
// ==========================================
app.get('/api/expenses/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // MongoDB se sirf usi user ke kharche dhoondhna
        const userExpenses = await Expense.find({ userId: userId });
        
        res.status(200).json(userExpenses);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ error: "Server error" });
    }
});
// Server ko port 5000 par start karein
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});