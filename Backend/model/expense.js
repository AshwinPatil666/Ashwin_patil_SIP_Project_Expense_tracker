const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: ['income', 'expense'],
        default: 'expense'
    },

    title: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    category: {
        type: String
    },

    payment: {
        type: String
    },

    status: {
        type: String,
        default: 'Paid'
    },

    date: {
        type: String
    },

    time: {
        type: String
    }
});

module.exports = mongoose.model(
    'Expense',
    expenseSchema,
    'expenses'
);