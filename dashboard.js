// ==========================================
// 1. GLOBAL VARIABLES & INITIALIZATION
// ==========================================
let transactions = [];

document.addEventListener("DOMContentLoaded", () => {
    // A. User Authentication check
    const userId = localStorage.getItem("currentUserId");
    if (!userId) {
        alert("Pehle login karein!");
        window.location.href = "login.html";
        return;
    }

    // B. Navbar ya profile par email dikhana (agar element ho)
    const savedEmail = localStorage.getItem("userEmail");
    const emailSpan = document.getElementById("user-display-email");
    if (savedEmail && emailSpan) {
        emailSpan.innerText = `👤 ${savedEmail}`;
    }

    // C. MongoDB se data load karna
    loadDashboardData();
});

// ==========================================
// 2. SEARCH BAR LOGIC
// ==========================================
const search = document.getElementById("search");
const results = document.getElementById("search-results");

const pages = [
    { name: "Dashboard", url: "dashboard.html" },
    { name: "Expenses", url: "expense.html" },
    { name: "Budget", url: "budget.html" },
    { name: "AI Insights", url: "ai_insight.html" },
    { name: "OCR Scanner", url: "ocr.html" },
    { name: "Reports", url: "report.html" }
];

if (search && results) {
    search.addEventListener("input", function() {
        const value = search.value.toLowerCase().trim();
        results.innerHTML = "";
        
        if (value === "") {
            results.style.display = "none";
            return;
        }

        const filtered = pages.filter(page => page.name.toLowerCase().includes(value));

        if (filtered.length === 0) {
            results.style.display = "none";
            return;
        }

        filtered.forEach(page => {
            const link = document.createElement("a");
            link.href = page.url;
            link.textContent = page.name;
            results.appendChild(link);
        });

        results.style.display = "block";
    });

    document.addEventListener("click", function(e) {
        if (!e.target.closest(".search")) {
            results.style.display = "none";
        }
    });
}

// ==========================================
// 3. MONGODB SE DATA LANA (DASHBOARD)
// ==========================================
async function loadDashboardData() {
    const userId = localStorage.getItem("currentUserId");
    if (!userId) return;

    try {
        const response = await fetch(`http://localhost:5000/api/expenses/${userId}`);
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
            transactions = data; 
            updateDashboard(); 
        }
    } catch (error) {
        console.error("Dashboard data load nahi ho paya:", error);
    }
}

// ==========================================
// 4. DASHBOARD MATH LOGIC (Synced with Budget)
// ==========================================
function updateDashboard() {
    let totalExpense = 0;

    transactions.forEach(item => {
        totalExpense += Number(item.amount) || 0;
    });

    // Budget page wali universal key yahan bhi use ki hai
    const totalBudget = Number(localStorage.getItem("spendwise_monthly_budget")) || 50000;
    let currentBalance = totalBudget - totalExpense; 

    // HTML me values update karna
    const cardValues = document.querySelectorAll('.card h2');
    
    if(cardValues.length >= 3) {
        cardValues[0].innerText = "₹" + totalExpense.toLocaleString();     // Total Expense
        cardValues[1].innerText = "₹" + totalBudget.toLocaleString();     // Total Budget
        cardValues[2].innerText = "₹" + currentBalance.toLocaleString();  // Remaining Balance
    }
}

// ==========================================
// 5. ADD TRANSACTION MODAL (POPUP) LOGIC
// ==========================================
const modal = document.getElementById("expense-modal");
const addBtn = document.getElementById("add-expense-btn");
const closeBtn = document.querySelector(".close-btn");
const form = document.getElementById("expense-form");

if(addBtn && modal) {
    addBtn.addEventListener("click", () => {
        modal.style.display = "flex";
    });
}

if(closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

// Naya form submit karke MongoDB me save karna
if(form) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); 

        const amount = Number(document.getElementById("trans-amount").value);
        const category = document.getElementById("trans-category").value;
        const title = document.getElementById("trans-title") ? document.getElementById("trans-title").value : "General";

        const newExpense = {
            userId: localStorage.getItem("currentUserId"),
            title: title,
            category: category,
            payment: "UPI",
            amount: amount,
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            status: "Paid"
        };

        try {
            const response = await fetch('http://localhost:5000/api/add-expense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newExpense)
            });

            if (response.ok) {
                transactions.unshift(newExpense);
                updateDashboard();
                modal.style.display = "none";
                form.reset();
            } else {
                alert("Transaction save nahi ho paya!");
            }
        } catch (error) {
            console.error("Error saving transaction:", error);
        }
    });
}