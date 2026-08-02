// ==========================================
// AI INSIGHTS PAGE LOGIC WITH OPENROUTER AI MODEL// ==========================================
// AI INSIGHTS PAGE LOGIC (Smooth & Without Alerts)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem("currentUserId");
    if (!userId) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    // Initial load when page opens
    loadAndAnalyzeInsights(userId);

    // "Generate Insights" button click handler (No alerts, smooth transition)
    const generateBtn = document.querySelector(".generate-btn");
    if (generateBtn) {
        generateBtn.addEventListener("click", async () => {
            const originalText = generateBtn.innerText;
            generateBtn.innerText = "Analyzing Data...";
            generateBtn.style.opacity = "0.7";
            generateBtn.style.pointerEvents = "none";
            
            // Refresh insights smoothly
            await loadAndAnalyzeInsights(userId);
            
            generateBtn.innerText = originalText;
            generateBtn.style.opacity = "1";
            generateBtn.style.pointerEvents = "auto";
        });
    }
});
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem("currentUserId");
    if (!userId) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    // Load user expenses, calculate stats, and get AI insights
    loadAndAnalyzeInsights(userId);

    const generateBtn = document.querySelector(".generate-btn");
    if (generateBtn) {
        generateBtn.addEventListener("click", () => {
            loadAndAnalyzeInsights(userId);
            alert("Generating fresh AI insights...");
        });
    }
});

async function loadAndAnalyzeInsights(userId) {
    try {
        // 1. Fetch transactions from MongoDB backend
        const response = await fetch(`http://localhost:5000/api/expenses/${userId}`);
        const transactions = await response.json();

        if (!response.ok || !Array.isArray(transactions)) {
            console.error("Failed to fetch transactions");
            return;
        }

        // 2. Perform Calculations
        let totalExpense = 0;
        const categoryMap = {};

        transactions.forEach(tx => {
            const amount = Number(tx.amount) || 0;
            const category = tx.category || "General";
            
            totalExpense += amount;
            categoryMap[category] = (categoryMap[category] || 0) + amount;
        });

        let highestCategory = "N/A";
        let highestAmount = 0;
        for (const [cat, amt] of Object.entries(categoryMap)) {
            if (amt > highestAmount) {
                highestAmount = amt;
                highestCategory = cat;
            }
        }

        const monthlyBudget = Number(localStorage.getItem("spendwise_monthly_budget")) || 40000;
        const estimatedSavings = Math.max(0, monthlyBudget - totalExpense);
        const savingsPercentage = Math.round((estimatedSavings / monthlyBudget) * 100);

        // 3. Update DOM Elements
        updateAIVerdict(totalExpense, monthlyBudget, highestCategory);
        updateSummaryCards(estimatedSavings, highestCategory, highestAmount, totalExpense, monthlyBudget, savingsPercentage);
        updateCategoriesTable(categoryMap, totalExpense);
        updateStrengthsAndImprovements(categoryMap, totalExpense, monthlyBudget);

        // 4. Call OpenRouter AI Model for smart text recommendation & prediction
        await fetchAIModelInsights(categoryMap, totalExpense, monthlyBudget);

    } catch (error) {
        console.error("Error loading AI insights data:", error);
    }
}

// AI Model Call Function
async function fetchAIModelInsights(categoryMap, totalExpense, budget) {
    const recommendationEl = document.querySelector(".ai-recommendation p");
    const apiKey = localStorage.getItem("openrouter_api_key");

    if (!apiKey) {
        if (recommendationEl) recommendationEl.innerText = "Please set your OpenRouter API key in localStorage to get live AI recommendations.";
        return;
    }

    if (recommendationEl) recommendationEl.innerText = "Generating AI recommendations based on your spending...";

    try {
        const prompt = `Based on these expenses: ${JSON.stringify(categoryMap)}, total expense is ₹${totalExpense} out of budget ₹${budget}. Give a short, sharp 2-line financial recommendation in English.`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "SpendWise AI"
            },
            body: JSON.stringify({
                model: "openrouter/free", // Using the safe openrouter free router
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
            if (recommendationEl) {
                recommendationEl.innerText = data.choices[0].message.content;
            }
        }
    } catch (err) {
        console.error("AI Model Error:", err);
        if (recommendationEl) recommendationEl.innerText = "Could not fetch AI recommendation at the moment.";
    }
}

// Helper: Update AI Verdict Banner
function updateAIVerdict(totalExpense, budget, highestCategory) {
    const verdictEl = document.getElementById("ai-verdict-text");
    if (!verdictEl) return;

    if (totalExpense > budget) {
        verdictEl.innerHTML = `⚠️ <strong>Alert:</strong> You have crossed your monthly budget! Highest spending is in <strong>${highestCategory}</strong>.`;
    } else if (totalExpense > budget * 0.75) {
        verdictEl.innerHTML = `⚡ <strong>Moderate Risk:</strong> You are close to your budget limit. Watch out for your <strong>${highestCategory}</strong> expenses.`;
    } else {
        verdictEl.innerHTML = `✨ <strong>Great Job!</strong> Your spending is balanced. You are safely on track to save this month!`;
    }
}

// Helper: Update Summary Cards
function updateSummaryCards(savings, highestCat, highestAmt, totalExpense, budget, savingsPercentage) {
    const savingsEl = document.querySelector(".insight-summary .insight-card:nth-child(1) h2");
    if (savingsEl) savingsEl.innerText = `₹${savings.toLocaleString('en-IN')}`;

    const highestCatEl = document.querySelector(".insight-summary .insight-card:nth-child(2) h2");
    const highestAmtEl = document.querySelector(".insight-summary .insight-card:nth-child(2) span");
    if (highestCatEl) highestCatEl.innerText = highestCat;
    if (highestAmtEl) highestAmtEl.innerText = `₹${highestAmt.toLocaleString('en-IN')}`;

    const healthEl = document.querySelector(".insight-summary .insight-card:nth-child(3) h2");
    const healthScoreEl = document.querySelector(".insight-summary .insight-card:nth-child(3) span");
    let healthStatus = "Excellent";
    let score = 92;
    
    if (totalExpense > budget) {
        healthStatus = "Critical";
        score = 45;
    } else if (totalExpense > budget * 0.75) {
        healthStatus = "Moderate";
        score = 72;
    }

    if (healthEl) healthEl.innerText = healthStatus;
    if (healthScoreEl) healthScoreEl.innerText = `${score} / 100`;

    const aiScoreEl = document.querySelector(".insight-summary .insight-card:nth-child(4) h2");
    if (aiScoreEl) aiScoreEl.innerText = `${Math.max(40, savingsPercentage)}%`;
}

// Helper: Populate Top Categories Table
function updateCategoriesTable(categoryMap, totalExpense) {
    const tableBody = document.querySelector(".top-categories table tbody");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

    sortedCategories.forEach(([category, amount]) => {
        const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
        let suggestion = percentage > 30 ? "Reduce Unspending" : "Within Safe Limit";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${category}</td>
            <td>₹${amount.toLocaleString('en-IN')}</td>
            <td>${percentage}%</td>
            <td>${suggestion}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Helper: Update Strengths & Improvements
function updateStrengthsAndImprovements(categoryMap, totalExpense, budget) {
    const improvementList = document.querySelector(".improvement-card ul");
    if (!improvementList) return;

    improvementList.innerHTML = "";
    let issues = 0;

    if (totalExpense > budget * 0.75) {
        improvementList.innerHTML += `<li>⚠ Expenses crossed 75% of total budget.</li>`;
        issues++;
    }

    for (const [cat, amt] of Object.entries(categoryMap)) {
        const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
        if (pct > 30) {
            improvementList.innerHTML += `<li>⚠ High spending in <strong>${cat}</strong> (${Math.round(pct)}%).</li>`;
            issues++;
        }
    }

    if (issues === 0) {
        improvementList.innerHTML += `<li>✔ Great job! No major risk areas found.</li>`;
    }
}