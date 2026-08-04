// ==========================================
// CONFIGURATION & GLOBAL CONSTANTS
// ==========================================
const API_BASE_URL = 'https://ashwin-patil-sip-project-expense-tracker.onrender.com/api';

// ==========================================
// INITIALIZATION ON DOM LOAD
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Budget script initialized successfully.");
    
    const userId = localStorage.getItem("currentUserId");
    if (!userId) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }
    
    // Initial page data load
    await loadBudgetPageData(userId);
});

// ==========================================
// MAIN BUDGET DATA & PROGRESS LOADER
// ==========================================
async function loadBudgetPageData(userId) {
    try {
        const token = localStorage.getItem('token');

        // 1. Total Monthly Budget (Fallback to LocalStorage or Default 10000)
        const savedBudget = localStorage.getItem("spendwise_monthly_budget");
        const totalBudget = savedBudget ? Number(savedBudget) : 0;

        // 2. Fetch Expenses from MongoDB
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/expenses/${userId}`, { headers });
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

        // 3. Calculations
        const remaining = totalBudget - totalSpent;

        let rawUsedPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        let usedPercent = Math.round(rawUsedPercent);
        let leftPercent = Math.max(100 - usedPercent, 0);

        // Daily Limit Calculation (Based on Remaining Days in Month)
        const today = new Date();
        const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const remainingDays = Math.max(totalDaysInMonth - today.getDate() + 1, 1);
        let dailyLimit = remaining > 0 ? Math.round(remaining / remainingDays) : 0;

        // 4. Update UI Text Elements
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

        // 6. Update Progress Bar Percent Text
        const progressTextEl = document.getElementById("ui-progress-percent-text");
        if (progressTextEl) {
            progressTextEl.innerText = `${usedPercent}%`;
        }

        // 7. Update Progress Bar Fill Width
        const progressFillEl = document.getElementById("ui-progress-fill");
        if (progressFillEl) {
            let fillWidth = Math.min(Math.max(rawUsedPercent, 0), 100);
            progressFillEl.style.width = `${fillWidth}%`;
            progressFillEl.style.backgroundColor = usedPercent > 100 ? "#ef4444" : "#16a34a";
        }

        // 8. Refresh Category Table & AI Tips
        updateCategoryTable(categorySpent);
        loadAIBudgetTips(totalBudget, totalSpent, categorySpent);

    } catch (error) {
        console.error("Error loading budget data:", error);
    }
}

// ==========================================
// CATEGORY TABLE RENDERER
// ==========================================
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

    tbody.innerHTML = ""; 

    for (let cat in savedCatBudgets) {
        const catBudget = savedCatBudgets[cat];
        const catSpent = categorySpent[cat] || 0;
        const catRemaining = catBudget - catSpent;
        
        let status = "Healthy";
        let statusColor = "#16a34a";
        if (catRemaining < 0) {
            status = "Exceeded";
            statusColor = "#ef4444";
        } else if (catSpent > catBudget * 0.8) {
            status = "Warning";
            statusColor = "#f59e0b";
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

// Save all categories at once
window.saveAllCategoryBudgets = function() {
    const inputs = document.querySelectorAll(".cat-budget-input");
    let savedCatBudgets = JSON.parse(localStorage.getItem("spendwise_category_budgets")) || {};

    inputs.forEach(input => {
        const cat = input.getAttribute("data-category");
        const val = Number(input.value) || 0;
        savedCatBudgets[cat] = val;
    });

    localStorage.setItem("spendwise_category_budgets", JSON.stringify(savedCatBudgets));
    alert("All category budgets updated!");
    
    const userId = localStorage.getItem("currentUserId");
    loadBudgetPageData(userId);
};

// ==========================================
// AI TIPS GENERATOR
// ==========================================
async function loadAIBudgetTips(totalBudget, totalSpent, categorySpent) {
    const tipsList = document.getElementById("ai-budget-tips-list");
    if (!tipsList) return;

    tipsList.innerHTML = "<li>🤖 Generating personalized AI tips...</li>";

    try {
        const response = await fetch(`${API_BASE_URL}/ai-tips`, {
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

// ==========================================
// MODAL & DOM WINDOW CONTROLLERS
// ==========================================
window.openBudgetModal = function () {
    const modal = document.getElementById('budget-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeBudgetModal = function () {
    const modal = document.getElementById('budget-modal');
    if (modal) modal.style.display = 'none';
};

window.toggleBudgetFields = function () {
    const typeSelect = document.getElementById('budget-type-select');
    const categoryBox = document.getElementById('category-box');
    if (typeSelect && categoryBox) {
        categoryBox.style.display = typeSelect.value === 'category' ? 'block' : 'none';
    }
};

window.saveModalBudget = async function () {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('currentUserId');
    
    const typeSelect = document.getElementById('budget-type-select');
    const amountInput = document.getElementById('modal-budget-input');
    const categorySelect = document.getElementById('budget-category-select');

    const type = typeSelect ? typeSelect.value : 'monthly';
    const amount = Number(amountInput ? amountInput.value : 0);
    const category = categorySelect ? categorySelect.value : 'Food';

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    // Always update local storage for smooth fallback UI
    if (type === 'monthly') {
        localStorage.setItem("spendwise_monthly_budget", amount);
    }

    // Sync with backend API if Token exists
    if (token) {
        const payload = type === 'category' 
            ? { category: category, amount: amount }
            : { monthlyLimit: amount };

        const endpoint = type === 'category' 
            ? `${API_BASE_URL}/budget/category`
            : `${API_BASE_URL}/budget/monthly`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                console.warn("Backend Sync Error:", data.message || data.error);
            }
        } catch (error) {
            console.error("Server update failed, saved locally:", error);
        }
    }

    alert("Budget successfully update ho gaya! 🎯");
    window.closeBudgetModal();
    loadBudgetPageData(userId);
};