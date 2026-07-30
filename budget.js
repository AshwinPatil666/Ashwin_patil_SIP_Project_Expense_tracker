document.addEventListener("DOMContentLoaded", async () => {
    const userId = localStorage.getItem("currentUserId");
    if (!userId) {
        alert("Pehle login karein!");
        window.location.href = "login.html";
        return;
    }
    await loadBudgetPageData(userId);
});

// Dropdown change hone par category box dikhana ya chupana
function toggleBudgetFields() {
    const typeSelect = document.getElementById("budget-type-select").value;
    const categoryBox = document.getElementById("category-box");
    
    if (typeSelect === "category") {
        categoryBox.style.display = "block";
    } else {
        categoryBox.style.display = "none";
    }
}

// Main function jo saari values aur table calculate karega
async function loadBudgetPageData(userId) {
    try {
        // Universal key use ki hai taaki baki pages ke sath match kare
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
        document.getElementById("ui-total-budget").innerText = `₹${totalBudget.toLocaleString()}`;
        document.getElementById("ui-total-spent").innerText = `₹${totalSpent.toLocaleString()}`;
        const remainingEl = document.getElementById("ui-remaining");
        remainingEl.innerText = `₹${remaining.toLocaleString()}`;
        remainingEl.style.color = remaining < 0 ? "#ef4444" : "inherit";

        document.getElementById("ui-percent-text").innerText = `${percentageUsed}%`;
        document.getElementById("ui-progress-fill").style.width = `${percentageUsed}%`;

        // Category Table ko dynamically update karna
        updateCategoryTable(categorySpent);

    } catch (error) {
        console.error("Error loading budget data:", error);
    }
}

// Category Table ka data render karne ka function
function updateCategoryTable(categorySpent) {
    const savedCatBudgets = JSON.parse(localStorage.getItem("spendwise_category_budgets")) || {
        Food: 10000,
        Transport: 6000,
        Shopping: 8000,
        Entertainment: 5000,
        Bills: 7000
    };

    const tbody = document.getElementById("category-table-body");
    if (!tbody) return;

    tbody.innerHTML = ""; 

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
                    <input type="number" class="cat-budget-input" data-category="${cat}" value="${catBudget}" style="width: 100px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
                </td>
                <td>₹${catSpent.toLocaleString()}</td>
                <td>₹${catRemaining.toLocaleString()}</td>
                <td style="color: ${statusColor}; font-weight: 600;">${status}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    }
}

// Saare budgets ko ek sath save karne ka function
function saveAllCategoryBudgets() {
    const inputs = document.querySelectorAll(".cat-budget-input");
    let savedCatBudgets = {};

    inputs.forEach(input => {
        const cat = input.getAttribute("data-category");
        const val = Number(input.value) || 0;
        savedCatBudgets[cat] = val;
    });

    localStorage.setItem("spendwise_category_budgets", JSON.stringify(savedCatBudgets));
    alert("Saare category budgets ek sath successfully update ho gaye!");
    
    const userId = localStorage.getItem("currentUserId");
    loadBudgetPageData(userId);
}
// Modal open/close controls
document.querySelector(".set-budget-btn").addEventListener("click", () => {
    document.getElementById("budget-modal").style.display = "flex";
    document.getElementById("budget-type-select").value = "monthly";
    document.getElementById("category-box").style.display = "none";
    document.getElementById("modal-budget-input").value = localStorage.getItem("spendwise_monthly_budget") || 50000;
});

function closeBudgetModal() {
    document.getElementById("budget-modal").style.display = "none";
}

// Save Budget logic (Monthly ya Category ke hisab se)
function saveModalBudget() {
    const type = document.getElementById("budget-type-select").value;
    const amount = Number(document.getElementById("modal-budget-input").value);

    if (!amount || amount <= 0) {
        alert("Kripya ek valid amount dalein!");
        return;
    }

    if (type === "monthly") {
        // Universal key me save karna taaki sabhi jagah match ho
        localStorage.setItem("spendwise_monthly_budget", amount);
        alert("Monthly Budget successfully update ho gaya!");
    } else {
        // Category budget save karna
        const category = document.getElementById("budget-category-select").value;
        let savedCatBudgets = JSON.parse(localStorage.getItem("spendwise_category_budgets")) || {
            Food: 10000, Transport: 6000, Shopping: 8000, Entertainment: 5000, Bills: 7000
        };
        
        savedCatBudgets[category] = amount;
        localStorage.setItem("spendwise_category_budgets", JSON.stringify(savedCatBudgets));
        alert(`${category} ka Budget successfully update ho gaya!`);
    }

    closeBudgetModal();
    const userId = localStorage.getItem("currentUserId");
    loadBudgetPageData(userId);
}