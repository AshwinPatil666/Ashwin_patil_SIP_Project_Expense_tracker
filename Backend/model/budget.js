// models/Budget.js
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    monthlyLimit: {
        type: Number,
        default: 10000
    },
    categoryBudgets: {
        Food: { type: Number, default: 10000 },
        Transport: { type: Number, default: 6000 },
        Shopping: { type: Number, default: 8000 },
        Entertainment: { type: Number, default: 5000 },
        Bills: { type: Number, default: 7000 }
    }
}, { timestamps: true });

module.exports = mongoose.model('Budget', budgetSchema);