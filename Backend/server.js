const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google Public DNS force karein
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Middlewares Import
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Standard Middlewares
app.use(express.json());
app.use(cors());

// ==========================================
// STATIC FILES SERVING (404 FIX HERE 🚀)
// ==========================================
// ==========================================
// STATIC FILES & FRONTEND SERVING (PERMANENT FIX 🚀)
// ==========================================
const rootPath = path.join(__dirname, '../'); // Root directory path

// 1. Uploads Folder
// ==========================================
// STATIC FILES SERVING (DIRECT ROOT PATH FIX)
// ==========================================
// Check karein ki server.js root me hai ya backend folder me
const rootDir = path.resolve(__dirname, '..'); // Agar server.js backend subfolder me hai
// const rootDir = __dirname;                 // Agar server.js main root folder me hi hai

// 1. Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. Static Folders (Absolute Resolution)
app.use(express.static(path.join(__dirname, '../'))); 
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/pages', express.static(path.join(__dirname, '../pages')));

// 3. Root Route (Direct Landing Page)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../registor.html'));
});
// ==========================================
// MONGODB CONNECTION
// ==========================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Atlas Connected Successfully!"))
  .catch((err) => console.error("Database Connection Error:", err));

// ==========================================
// ROUTES IMPORTS & MOUNTING
// ==========================================
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

// Clean Modular Routes
app.use('/api/auth', authRoutes);         // Handles /api/auth/register, /api/auth/login
app.use('/api/expenses', expenseRoutes);   // Handles /api/expenses/ add, get, delete, OCR

// ==========================================
// AI TIPS ROUTE
// ==========================================
app.post('/api/ai-tips', async (req, res) => {
    try {
        const { totalBudget, totalSpent, categorySpent } = req.body;
        
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            console.error("❌ ERROR: OPENROUTER_API_KEY is missing in .env file!");
            return res.status(500).json({ error: "OpenRouter API Key missing in backend .env" });
        }

        const prompt = `User's monthly budget is ₹${totalBudget} and total spent is ₹${totalSpent}. Category breakdown: ${JSON.stringify(categorySpent)}. Provide 3 short, practical budget saving tips in plain text (no markdown headings).`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey.trim()}`,
                "X-Title": "SpendWise AI"
            },
            body: JSON.stringify({
                model: "openrouter/free",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ OpenRouter API Response Error:", data);
            return res.status(response.status).json({ error: data.error || "OpenRouter error" });
        }

        if (data.choices?.[0]?.message?.content) {
            return res.json({ tips: data.choices[0].message.content });
        } else {
            return res.status(500).json({ error: "Empty response from AI model" });
        }

    } catch (error) {
        console.error("❌ Internal Server Error in /api/ai-tips:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// AI CHATBOT ROUTE
// ==========================================
app.post('/api/chat', async (req, res) => {
    try {
        const { message, userEmail, totalBudget, transactions } = req.body;
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "OpenRouter API Key missing in backend .env" });
        }

        const systemPrompt = `You are an expert AI financial assistant for ${userEmail || 'User'}. Monthly budget: ₹${totalBudget || 50000}. Transactions: ${JSON.stringify(transactions || [])}. Answer concisely.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey.trim()}`,
                "X-Title": "SpendWise AI Chatbot"
            },
            body: JSON.stringify({
                model: "openrouter/free",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();

        if (response.ok && data.choices?.[0]?.message?.content) {
            return res.json({ reply: data.choices[0].message.content });
        } else {
            return res.status(500).json({ error: data.error?.message || "AI service failed" });
        }

    } catch (err) {
        console.error("❌ Chat Server Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// ERROR HANDLER
// ==========================================
app.use(errorHandler);

// ==========================================
// SERVER START
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("Checking API Key:", process.env.OPENROUTER_API_KEY ? "EXISTS ✅" : "NOT FOUND ❌");
    console.log(`🚀 Server running on port ${PORT}`);
});