const express = require('express');
const router = express.Router();
const Expense = require('../model/expense');

// Middlewares Imports (Safe Imports)
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/add-expense', async (req, res) => {
    try {
        console.log("Received expense data:", req.body);

        const {
            userId,
            type,
            amount,
            category,
            paymentMode,
            date,
            description
        } = req.body;

        const newRecord = new Expense({
            userId: userId,
            type: type,
            title: description || category || "Expense",
            amount: Number(amount),
            category: category,
            payment: paymentMode,
            date: date || new Date().toISOString().split('T')[0]
        });

        const savedExpense = await newRecord.save();

        console.log("✅ Expense saved:", savedExpense);

        res.status(201).json({
            success: true,
            message: "Expense added successfully!",
            expense: savedExpense
        });

    } catch (error) {
        console.error("🔥 ACTUAL ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message,
            name: error.name,
            errors: error.errors
        });
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

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedExpense = await Expense.findByIdAndDelete(id);

        if (!deletedExpense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Expense deleted successfully"
        });

    } catch (error) {
        console.error("Delete Expense Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
module.exports = router;