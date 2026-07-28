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
        res.status(201).json({ message: "Data successfully MongoDB me save ho gaya!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error aa gayi hai." });
    }
});

// Server ko port 5000 par start karein
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});