const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    userId: { type: String }, // Abhi ke liye mandatory nahi kiya hai
    type: { type: String, enum: ['income', 'expense'], default: 'expense' }, 
    title: { type: String, required: true }, // NAYA: Kharcha kis cheez ka hai (Pizza, Shoes)
    amount: { type: Number, required: true },
    category: { type: String },
    payment: { type: String }, // NAYA: UPI, Card, Cash
    status: { type: String, default: 'Paid' }, // NAYA: Paid ya Pending
    date: { type: String },
    time: { type: String } // Frontend se "25 Jul" aayega isliye String rakha hai
});

// Model ko export karna taaki server.js me use ho sake (Collection ka naam 'expenses' hoga)
module.exports = mongoose.model('Expense', expenseSchema, 'expenses');