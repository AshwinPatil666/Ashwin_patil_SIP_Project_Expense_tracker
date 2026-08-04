const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const authMiddleware = require('../middleware/auth'); // Aapka JWT Auth Middleware

// ==========================================
// 1. GET USER BUDGET (Fetch Monthly & Category Budgets)
// Route: GET /api/budget
// ==========================================
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        // User ka budget dhoondo, agar nahi hai toh default create kar do
        let budget = await Budget.findOne({ userId });

        if (!budget) {
            budget = await Budget.create({ userId });
        }

        res.status(200).json({
            success: true,
            monthlyLimit: budget.monthlyLimit,
            categoryBudgets: budget.categoryBudgets
        });
    } catch (error) {
        console.error("GET Budget Error:", error);
        res.status(500).json({ success: false, message: "Server error fetching budget" });
    }
});

// ==========================================
// 2. UPDATE MONTHLY BUDGET LIMIT
// Route: POST /api/budget/monthly
// Body: { "monthlyLimit": 15000 }
// ==========================================
router.post('/monthly', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { monthlyLimit } = req.body;

        if (monthlyLimit === undefined || Number(monthlyLimit) <= 0) {
            return res.status(400).json({ success: false, message: "Valid monthly limit enter karein." });
        }

        // Upsert: true (Agar user entry nahi hai toh create karega, varna update)
        const budget = await Budget.findOneAndUpdate(
            { userId },
            { $set: { monthlyLimit: Number(monthlyLimit) } },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: "Monthly budget updated successfully! 🎯",
            monthlyLimit: budget.monthlyLimit
        });
    } catch (error) {
        console.error("POST Monthly Budget Error:", error);
        res.status(500).json({ success: false, message: "Failed to update monthly budget" });
    }
});

// ==========================================
// 3. UPDATE INDIVIDUAL CATEGORY BUDGET
// Route: POST /api/budget/category
// Body: { "category": "Food", "amount": 8000 }
// ==========================================
router.post('/category', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { category, amount } = req.body;

        if (!category || amount === undefined || Number(amount) < 0) {
            return res.status(400).json({ success: false, message: "Category aur valid amount required hain." });
        }

        // Dynamic key for nested object update
        const updateField = {};
        updateField[`categoryBudgets.${category}`] = Number(amount);

        const budget = await Budget.findOneAndUpdate(
            { userId },
            { $set: updateField },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: `${category} budget updated successfully! 🎯`,
            categoryBudgets: budget.categoryBudgets
        });
    } catch (error) {
        console.error("POST Category Budget Error:", error);
        res.status(500).json({ success: false, message: "Failed to update category budget" });
    }
});

module.exports = router;