const express = require('express');
const router = express.Router();
const Expense = require('../model/expense');

// Middlewares Imports (Safe Imports)
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// 1. ADD EXPENSE API
router.post('/add-expense', async (req, res) => {
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

// 2. GET USER EXPENSES API
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const userExpenses = await Expense.find({ userId: userId });
        res.status(200).json(userExpenses);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// 3. PROTECTED ROUTE (If verifyToken is valid)
if (typeof verifyToken === 'function') {
    router.post('/protected-add', verifyToken, (req, res) => {
        res.json({ 
            success: true, 
            message: "Expense saved securely!", 
            userId: req.user.id 
        });
    });
}

// 4. OCR RECEIPT UPLOAD API
if (upload && typeof upload.single === 'function') {
    router.post('/ocr/scan', upload.single('receipt'), (req, res) => {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Please upload an image." });
        }
        res.json({ 
            success: true, 
            filePath: req.file.path,
            message: "Receipt uploaded successfully!" 
        });
    });
} else {
    router.post('/ocr/scan', (req, res) => {
        res.json({ success: false, message: "Upload middleware not configured properly" });
    });
}

module.exports = router;