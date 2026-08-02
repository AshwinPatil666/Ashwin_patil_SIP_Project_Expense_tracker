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
async function loadBudgetPageData(userId) {
    try {
        const totalBudget = Number(localStorage.getItem("spendwise_monthly_budget")) || 50000;

        const response = await fetch(`http://localhost:5000/api/expenses/${userId}`);
        const expenses = await response.json();

        let totalSpent = 0;
        let categorySpent = { Food: 0, Transport: 0, Shopping: 0, Entertainment: 0, Bills: 0 };

        if (response.ok && Array.isArray(expenses)) {
            expenses.forEach(item => {
                const amt = Number(item.amount) || 0;
                totalSpent += amt;

                // Category wise spent count karna
                if (item.category && categorySpent[item.category] !== undefined) {
                    categorySpent[item.category] += amt;
                }
            });
        }

        const remaining = totalBudget - totalSpent;
        let percentageUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
        if (percentageUsed > 100) percentageUsed = 100;

        // UI update (Monthly Cards)
        const totalBudgetEl = document.getElementById("ui-total-budget");
        const totalSpentEl = document.getElementById("ui-total-spent");
        const remainingEl = document.getElementById("ui-remaining");
        const percentTextEl = document.getElementById("ui-percent-text");
        const progressFillEl = document.getElementById("ui-progress-fill");

        if (totalBudgetEl) totalBudgetEl.innerText = `₹${totalBudget.toLocaleString()}`;
        if (totalSpentEl) totalSpentEl.innerText = `₹${totalSpent.toLocaleString()}`;
        if (remainingEl) {
            remainingEl.innerText = `₹${remaining.toLocaleString()}`;
            remainingEl.style.color = remaining < 0 ? "#ef4444" : "inherit";
        }

        if (percentTextEl) percentTextEl.innerText = `${percentageUsed}%`;
        if (progressFillEl) progressFillEl.style.width = `${percentageUsed}%`;

        // Category Table ko dynamically update karna
        updateCategoryTable(categorySpent);

        // 🔥 AI Budget Tips ko call karna
        loadAIBudgetTips(totalBudget, totalSpent, categorySpent);

    } catch (error) {
        console.error("Error loading budget data:", error);
    }
}

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
  // Enter your OpenRouter API key here
    const apiKey = localStorage.getItem("openrouter_api_key"); 
    
    if (!apiKey) {
        const tipsList = document.getElementById("ai-budget-tips-list");
        if (tipsList) {
            tipsList.innerHTML = "<li>Please set your OpenRouter API key in browser console first.</li>";
        }
        return;
    }
    const url = "https://openrouter.ai/api/v1/chat/completions";

    const prompt = `The user's monthly budget is ₹${totalBudget} and they have spent a total of ₹${totalSpent}. The category-wise breakdown is: ${JSON.stringify(categorySpent)}. Based on this data, provide 3 short and effective budget-saving tips in English using bullet points (-).`;

    const tipsList = document.getElementById("ai-budget-tips-list");

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "SpendWise AI"
            },
            body: JSON.stringify({
      model: "openrouter/free",
                messages: [
                    { role: "user", content: prompt }
                ]
            })
        });

        const data = await response.json();
        
        // Debugging ke liye console me response print karna
        console.log("OpenRouter Response:", data);

        if (data.choices && data.choices[0] && data.choices[0].message) {
            const aiText = data.choices[0].message.content;
            
            if (tipsList) {
                const tipsArray = aiText.split('\n').filter(tip => tip.trim() !== '');
                tipsList.innerHTML = "";
                tipsArray.forEach(tip => {
                    const li = document.createElement("li");
                    li.innerHTML = tip.replace(/[-*#]/g, '').trim();
                    tipsList.appendChild(li);
                });
            }
        } else {
            // Yeh batayega ki error exactly kya hai
            console.error("Detailed API Error Data:", data);
            throw new Error(data.error?.message || "Invalid OpenRouter response format");
        }

    } catch (error) {
        console.error("Failed to load AI tips:", error);
        if (tipsList) {
            tipsList.innerHTML = "<li>Failed to load tips.</li>";
        }
    }
}
// Modal open/close controls (Overall Monthly Budget ke liye)
const setBudgetBtn = document.querySelector(".set-budget-btn");
if (setBudgetBtn) {
    setBudgetBtn.addEventListener("click", () => {
        const modal = document.getElementById("budget-modal");
        if (modal) {
            modal.style.display = "flex";
            const input = document.getElementById("modal-budget-input");
            if (input) input.value = localStorage.getItem("spendwise_monthly_budget") || 50000;
        }
    });
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