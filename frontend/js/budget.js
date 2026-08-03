document.addEventListener("DOMContentLoaded", async () => {
    const userId = localStorage.getItem("currentUserId");
    if (!userId) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }
    await loadBudgetPageData(userId);
});

// Dropdown change hone par category box dikhana ya chupana
function toggleBudgetFields() {
    const typeSelect = document.getElementById("budget-type-select")?.value;
    const categoryBox = document.getElementById("category-box");
    
    if (categoryBox) {
        if (typeSelect === "category") {
            categoryBox.style.display = "block";
        } else {
            categoryBox.style.display = "none";
        }
    }
}

// Main function jo saari values aur table calculate karega
// ==========================================
// MAIN BUDGET PAGE DATA & PROGRESS LOADER
// ==========================================
async function loadBudgetPageData(userId) {
    try {
        // 1. Total Monthly Budget (Default 10,000 agar set na ho)
        const savedBudget = localStorage.getItem("spendwise_monthly_budget");
        const totalBudget = savedBudget ? Number(savedBudget) : 10000;

        // 2. Fetch Expenses from MongoDB
        const response = await fetch(`https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/expenses/${userId}`);
        const expenses = await response.json();

        let totalSpent = 0;
        let categorySpent = { Food: 0, Transport: 0, Shopping: 0, Entertainment: 0, Bills: 0 };

        if (response.ok && Array.isArray(expenses)) {
            expenses.forEach(item => {
                const amt = Number(item.amount) || 0;
                totalSpent += amt;

                if (item.category && categorySpent[item.category] !== undefined) {
                    categorySpent[item.category] += amt;
                }
            });
        }

        // 3. Exact Math Calculations
        const remaining = totalBudget - totalSpent;

        // Dynamic Percentages
        let rawUsedPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        let usedPercent = Math.round(rawUsedPercent);
        let leftPercent = Math.max(100 - usedPercent, 0);

        // Daily Limit Calculation (Remaining Days basis)
        const today = new Date();
        const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const remainingDays = Math.max(totalDaysInMonth - today.getDate() + 1, 1);
        let dailyLimit = remaining > 0 ? Math.round(remaining / remainingDays) : 0;

        // 4. Update Main Text Elements
        const totalBudgetEl = document.getElementById("ui-total-budget");
        const totalSpentEl = document.getElementById("ui-total-spent");
        const remainingEl = document.getElementById("ui-remaining");
        const dailyLimitEl = document.getElementById("ui-daily-limit");

        if (totalBudgetEl) totalBudgetEl.innerText = `₹${totalBudget.toLocaleString()}`;
        if (totalSpentEl) totalSpentEl.innerText = `₹${totalSpent.toLocaleString()}`;
        
        if (remainingEl) {
            remainingEl.innerText = `₹${remaining.toLocaleString()}`;
            remainingEl.style.color = remaining < 0 ? "#ef4444" : "#16a34a";
        }

        if (dailyLimitEl) dailyLimitEl.innerText = `₹${dailyLimit.toLocaleString()}`;

        // 5. Update Card Percentages Text
        const percentUsedEl = document.getElementById("ui-percent-used");
        const percentLeftEl = document.getElementById("ui-percent-left");

        if (percentUsedEl) percentUsedEl.innerText = `${usedPercent}% Used`;
        if (percentLeftEl) percentLeftEl.innerText = `${leftPercent}% Left`;

        // 6. Update Progress Bar Percent Text (Jahan 62% dikh raha tha)
        const progressTextEl = document.getElementById("ui-progress-percent-text");
        if (progressTextEl) {
            progressTextEl.innerText = `${usedPercent}%`;
        }

        // 7. Update Progress Bar Width (CSS Styles Safe Range: 0% to 100%)
        const progressFillEl = document.getElementById("ui-progress-fill");
        if (progressFillEl) {
            let fillWidth = Math.min(Math.max(rawUsedPercent, 0), 100);
            progressFillEl.style.width = `${fillWidth}%`;
            progressFillEl.style.backgroundColor = usedPercent > 100 ? "#ef4444" : "#16a34a";
        }

        // 8. Refresh Category Table & AI Tips
        if (typeof updateCategoryTable === "function") updateCategoryTable(categorySpent);
        if (typeof loadAIBudgetTips === "function") loadAIBudgetTips(totalBudget, totalSpent, categorySpent);

    } catch (error) {
        console.error("Error loading budget data:", error);
    }
}

        // Category Table and AI Tips Refresh
   
// Category Table ko render karne ka function (Direct Inputs)
function updateCategoryTable(categorySpent) {
    const savedCatBudgets = JSON.parse(localStorage.getItem("spendwise_category_budgets")) || {
        Food: 10000,
        Transport: 6000,
        Shopping: 8000,
        Entertainment: 5000,
        Bills: 7000
    };

    const tbody = document.getElementById("category-table-body") || document.querySelector("table tbody");
    if (!tbody) return;

    tbody.innerHTML = ""; // Purani rows saaf karna

    for (let cat in savedCatBudgets) {
        const catBudget = savedCatBudgets[cat];
        const catSpent = categorySpent[cat] || 0;
        const catRemaining = catBudget - catSpent;
        
        let status = "Healthy";
        let statusColor = "green";
        if (catRemaining < 0) {
            status = "Exceeded";
            statusColor = "red";
        } else if (catSpent > catBudget * 0.8) {
            status = "Warning";
            statusColor = "orange";
        }

        const row = `
            <tr>
                <td><strong>${cat}</strong></td>
                <td>
                    <input type="number" class="cat-budget-input" data-category="${cat}" value="${catBudget}" style="width: 110px; padding: 6px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px;">
                </td>
                <td>₹${catSpent.toLocaleString()}</td>
                <td>₹${catRemaining.toLocaleString()}</td>
                <td style="color: ${statusColor}; font-weight: 600;">${status}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    }
}

// Ek hi click me saare category budgets save karne ka function
function saveAllCategoryBudgets() {
    const inputs = document.querySelectorAll(".cat-budget-input");
    let savedCatBudgets = JSON.parse(localStorage.getItem("spendwise_category_budgets")) || {};

    inputs.forEach(input => {
        const cat = input.getAttribute("data-category");
        const val = Number(input.value) || 0;
        savedCatBudgets[cat] = val;
    });

    localStorage.setItem("spendwise_category_budgets", JSON.stringify(savedCatBudgets));
    alert("Saare category budgets successfully update ho gaye!");
    
    const userId = localStorage.getItem("currentUserId");
    loadBudgetPageData(userId);
}


// ==========================================
async function loadAIBudgetTips(totalBudget, totalSpent, categorySpent) {
    const tipsList = document.getElementById("ai-budget-tips-list");
    if (!tipsList) return;

    tipsList.innerHTML = "<li>🤖 Generating personalized AI tips...</li>";

    try {
        // Direct Apne Backend Ko Call Karo
        const response = await fetch("https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/ai-tips", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ totalBudget, totalSpent, categorySpent })
        });

        const data = await response.json();

        if (response.ok && data.tips) {
            const tipsArray = data.tips.split('\n').filter(t => t.trim() !== '');
            tipsList.innerHTML = "";
            
            tipsArray.forEach(tip => {
                const cleanTip = tip.replace(/^[-*#\d.]+\s*/, '').trim();
                if (cleanTip) {
                    const li = document.createElement("li");
                    li.innerText = cleanTip;
                    tipsList.appendChild(li);
                }
            });
        } else {
            tipsList.innerHTML = "<li>⚠️ Could not fetch AI tips right now.</li>";
        }
    } catch (error) {
        console.error("Frontend AI Fetch Error:", error);
        tipsList.innerHTML = "<li>⚠️ Error connecting to AI server.</li>";
    }
}
function closeBudgetModal() {
    const modal = document.getElementById("budget-modal");
    if (modal) modal.style.display = "none";
}

// Monthly Budget save karne ka logic (Modal se)
function saveModalBudget() {
    const amount = Number(document.getElementById("modal-budget-input")?.value);

    if (!amount || amount <= 0) {
        alert("Kripya ek valid amount dalein!");
        return;
    }

    localStorage.setItem("spendwise_monthly_budget", amount);
    alert("Monthly Budget successfully update ho gaya!");

    closeBudgetModal();
    const userId = localStorage.getItem("currentUserId");
    loadBudgetPageData(userId);
}