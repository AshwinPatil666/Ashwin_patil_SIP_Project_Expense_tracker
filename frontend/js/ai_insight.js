// ==========================================
// AI INSIGHTS PAGE LOGIC (Production Optimized)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    // Fallback key lookup if currentUserId is stored under different key names
    const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");
    
    if (!userId) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    // Initial load
    await loadAndAnalyzeInsights(userId);

    // "Generate Insights" button handler
    const generateBtn = document.querySelector(".generate-btn");
    if (generateBtn) {
        generateBtn.addEventListener("click", async () => {
            const originalText = generateBtn.innerText;
            generateBtn.innerText = "Analyzing Data...";
            generateBtn.style.opacity = "0.7";
            generateBtn.style.pointerEvents = "none";
            
            await loadAndAnalyzeInsights(userId);
            
            generateBtn.innerText = originalText;
            generateBtn.style.opacity = "1";
            generateBtn.style.pointerEvents = "auto";
        });
    }
});

async function loadAndAnalyzeInsights(userId) {
    try {
        // 1. Fetch real user transactions from MongoDB backend
        const response = await fetch(`https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/expenses/${userId}`);
        const transactions = await response.json();

        if (!response.ok || !Array.isArray(transactions)) {
            console.error("Failed to fetch transactions from backend:", transactions);
            return;
        }

        // 2. Real Calculations on User Data
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
        const savingsPercentage = monthlyBudget > 0 ? Math.round((estimatedSavings / monthlyBudget) * 100) : 0;

        // 3. Render Calculated Real Data into UI Components
        updateAIVerdict(totalExpense, monthlyBudget, highestCategory);
        updateSummaryCards(estimatedSavings, highestCategory, highestAmount, totalExpense, monthlyBudget, savingsPercentage);
        updatePredictions(totalExpense, monthlyBudget);
        updateCategoriesTable(categoryMap, totalExpense);
        updateStrengthsAndImprovements(categoryMap, totalExpense, monthlyBudget);

        // 4. Secure AI Recommendation via Backend Proxy
        await fetchAIInsightsFromBackend(categoryMap, totalExpense, monthlyBudget);

    } catch (error) {
        console.error("Error loading AI insights data:", error);
    }
}

// Backend Express Proxy Call
async function fetchAIInsightsFromBackend(categoryMap, totalExpense, budget) {
    const recommendationEl = document.getElementById("ai-recommendation-text") || document.querySelector(".ai-recommendation p");
    if (recommendationEl) recommendationEl.innerText = "Generating AI recommendations based on your actual spending...";

    try {
        const response = await fetch("https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Based on my current category breakdown: ${JSON.stringify(categoryMap)}, total spent: ₹${totalExpense}, budget: ₹${budget}. Provide a 2-line direct financial recommendation.`,
                totalBudget: budget,
                transactions: categoryMap
            })
        });

        const data = await response.json();
        if (response.ok && data.reply) {
            if (recommendationEl) recommendationEl.innerText = data.reply;
        } else {
            if (recommendationEl) recommendationEl.innerText = "Spending is within manageable parameters. Keep tracking recurring expenses.";
        }
    } catch (err) {
        console.error("AI Model Fetch Error:", err);
        if (recommendationEl) recommendationEl.innerText = "Monitor highest spending categories regularly to maintain budget goals.";
    }
}

// Helper: AI Verdict Banner
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

// Helper: Summary Cards
function updateSummaryCards(savings, highestCat, highestAmt, totalExpense, budget, savingsPercentage) {
    const cards = document.querySelectorAll(".insight-summary .insight-card");
    if (!cards || cards.length < 4) return;

    // Card 1: Estimated Savings
    const savingsH2 = cards[0].querySelector("h2");
    const savingsSpan = cards[0].querySelector("span");
    if (savingsH2) savingsH2.innerText = `₹${savings.toLocaleString('en-IN')}`;
    if (savingsSpan) savingsSpan.innerText = totalExpense <= budget ? "✔ On Track" : "⚠ Over Budget";

    // Card 2: Highest Category
    const highestCatH2 = cards[1].querySelector("h2");
    const highestAmtSpan = cards[1].querySelector("span");
    if (highestCatH2) highestCatH2.innerText = highestCat;
    if (highestAmtSpan) highestAmtSpan.innerText = `₹${highestAmt.toLocaleString('en-IN')}`;

    // Card 3: Financial Health
    const healthH2 = cards[2].querySelector("h2");
    const healthScoreSpan = cards[2].querySelector("span");
    let healthStatus = "Excellent";
    let score = 92;
    
    if (totalExpense > budget) {
        healthStatus = "Critical";
        score = 45;
    } else if (totalExpense > budget * 0.75) {
        healthStatus = "Moderate";
        score = 72;
    }

    if (healthH2) healthH2.innerText = healthStatus;
    if (healthScoreSpan) healthScoreSpan.innerText = `${score} / 100`;

    // Card 4: Savings Ratio
    const aiScoreH2 = cards[3].querySelector("h2");
    if (aiScoreH2) aiScoreH2.innerText = `${Math.max(0, savingsPercentage)}%`;
}

// Helper: Dynamic Predictions
function updatePredictions(totalExpense, budget) {
    const predExpenseEl = document.getElementById("pred-expense");
    const predSavingsEl = document.getElementById("pred-savings");
    const predRiskEl = document.getElementById("pred-risk");

    // Projected estimation (10% standard variation model)
    const expectedExpense = Math.round(totalExpense * 1.05);
    const expectedSavings = Math.max(0, budget - expectedExpense);
    
    let riskLevel = "Low";
    if (expectedExpense > budget) {
        riskLevel = "High";
    } else if (expectedExpense > budget * 0.85) {
        riskLevel = "Medium";
    }

    if (predExpenseEl) predExpenseEl.innerText = `₹${expectedExpense.toLocaleString('en-IN')}`;
    if (predSavingsEl) predSavingsEl.innerText = `₹${expectedSavings.toLocaleString('en-IN')}`;
    if (predRiskEl) predRiskEl.innerText = riskLevel;
}

// Helper: Top Categories Table
function updateCategoriesTable(categoryMap, totalExpense) {
    const tableBody = document.querySelector(".top-categories table tbody");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No transactions recorded yet.</td></tr>`;
        return;
    }

    sortedCategories.forEach(([category, amount]) => {
        const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
        let suggestion = percentage > 30 ? "High Spending Area" : "Within Safe Limit";

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

// Helper: Strengths & Improvements
function updateStrengthsAndImprovements(categoryMap, totalExpense, budget) {
    const improvementList = document.querySelector(".improvement-card ul") || document.getElementById("improvements-list");
    if (!improvementList) return;

    improvementList.innerHTML = "";
    let issues = 0;

    if (totalExpense > budget * 0.75) {
        improvementList.innerHTML += `<li>⚠ Total expenses crossed 75% of your defined budget.</li>`;
        issues++;
    }

    for (const [cat, amt] of Object.entries(categoryMap)) {
        const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
        if (pct > 30) {
            improvementList.innerHTML += `<li>⚠ High spending detected in <strong>${cat}</strong> (${Math.round(pct)}% of total).</li>`;
            issues++;
        }
    }

    if (issues === 0) {
        improvementList.innerHTML += `<li>✔ Great budget control! No major risk factors detected.</li>`;
    }
}