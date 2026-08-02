const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Models Import
const User = require('./model/user');
const Expense = require('./model/expense');

// Middlewares Import (Relative Path corrected)
// Middlewares Import
const verifyToken = require('./middleware/authMiddleware');
const upload = require('./middleware/uploadMiddleware');
const errorHandler = require('./middleware/errorMiddleware'); // 'M' capital karein

const app = express();

// Standard Middlewares
app.use(express.json());
app.use(cors());

// Static folder for uploaded receipts access
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// MONGODB CONNECTION
// ==========================================
mongoose.connect('mongodb://127.0.0.1:27017/Spendwise')
    .then(() => console.log('✅ Spendwise Database Successfully Connected!'))
    .catch(err => console.log('❌ Connection Error:', err));


// ==========================================
// ROUTES & APIS
// ==========================================

// 1. REGISTER API
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        const newUser = new User({ email, password });
        await newUser.save();
        
        res.status(201).json({ success: true, message: "Data successfully saved !" });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ success: false, error: "Error occurred while registering user." });
    }
});

// 2. LOGIN API
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const foundUser = await User.findOne({ email });
        if (!foundUser) {
            return res.status(404).json({ error: "This email is not registered. Please create an account first." });
        }

        if (foundUser.password !== password) {
            return res.status(401).json({ error: "Invalid password. Please try again." });
        }

        res.status(200).json({ 
            success: true,
            message: "Login successful!",
            userId: foundUser._id 
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Error occurred while logging in." });
    }
});

// 3. ADD EXPENSE API
app.post('/api/add-expense', async (req, res) => {
    try {
        console.log("Received expense data:", req.body);
        const expenseData = req.body;
        const newRecord = new Expense(expenseData);
        await newRecord.save();

        res.status(201).json({ success: true, message: "Expense added successfully!" });
    } catch (error) {
        console.error("Error occurred while adding expense:", error);
        res.status(500).json({ message: "Error occurred while adding expense." });
    }
});

// 4. GET USER EXPENSES API
app.get('/api/expenses/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const userExpenses = await Expense.find({ userId: userId });
        res.status(200).json(userExpenses);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// 5. PROTECTED ROUTE (Token Protected Example)
app.post('/api/expenses/protected-add', verifyToken, (req, res) => {
    res.json({ 
        success: true, 
        message: "Expense saved securely!", 
        userId: req.user.id 
    });
});

// 6. OCR RECEIPT UPLOAD API
app.post('/api/ocr/scan', upload.single('receipt'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "Please upload an image." });
    }
    res.json({ 
        success: true, 
        filePath: req.file.path,
        message: "Receipt uploaded successfully!" 
    });
});


// ==========================================
// ERROR HANDLER (Hamesha saare routes ke baad aayega)
// ==========================================
app.use(errorHandler);


// ==========================================
// SERVER START
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});