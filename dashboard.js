// ==========================================
// 1. GLOBAL VARIABLES & INITIALIZATION
// ==========================================
let transactions = [];
let myExpenseChart = null; // To avoid chart overlapping issues

document.addEventListener("DOMContentLoaded", () => {
    // A. User Authentication check
    const userId = localStorage.getItem("currentUserId");
    if (!userId) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    // B. Display user email on navbar or profile if element exists
    const savedEmail = localStorage.getItem("userEmail");
    const emailSpan = document.getElementById("user-display-email");
    if (savedEmail && emailSpan) {
        emailSpan.innerText = `👤 ${savedEmail}`;
    }

    // C. Fetch data from MongoDB
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
// 3. FETCH DATA FROM MONGODB (DASHBOARD)
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
            renderExpenseChart(transactions); // Render interactive chart with live data
        }
    } catch (error) {
        console.error("Failed to load dashboard data:", error);
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

    // Universal key used in budget page as well
    const totalBudget = Number(localStorage.getItem("spendwise_monthly_budget")) || 50000;
    let currentBalance = totalBudget - totalExpense; 

    // Update values in HTML cards
    const cardValues = document.querySelectorAll('.card h2');
    
    if(cardValues.length >= 3) {
        cardValues[0].innerText = "₹" + totalExpense.toLocaleString();     // Total Expense
        cardValues[1].innerText = "₹" + totalBudget.toLocaleString();     // Total Budget
        cardValues[2].innerText = "₹" + currentBalance.toLocaleString();  // Remaining Balance
    }
}

// ==========================================
// 5. RENDER EXPENSE CHART (Chart.js Integration)
// ==========================================
// ==========================================
// 5. RENDER EXPENSE CHART (Clean Chart.js Integration)
// ==========================================
function renderExpenseChart(expenses) {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;

    // Dynamically generate category totals from actual data (No hardcoding bugs)
    const categoryTotals = {};

    expenses.forEach(item => {
        const amt = Number(item.amount) || 0;
        const cat = item.category ? item.category.trim() : "General";
        
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    });

    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);

    // Destroy previous chart instance if it exists
    if (window.myExpenseChart) {
        window.myExpenseChart.destroy();
    }

    // Modern color palette generator for dynamic categories
    const colorPalette = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
        '#ec4899', '#06b6d4', '#84cc16', '#14532d'
    ];

    window.myExpenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                label: 'Expenses (₹)',
                data: amounts,
                backgroundColor: colorPalette.slice(0, categories.length),
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            family: "'Poppins', sans-serif"
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12,
                    cornerRadius: 8
                }
            },
            cutout: '68%'
        }
    });
}

// ==========================================
// 6. ADD TRANSACTION MODAL (POPUP) LOGIC
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

// Submit new form and save to MongoDB
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
                renderExpenseChart(transactions); // Update chart live on new expense addition
                modal.style.display = "none";
                form.reset();
            } else {
                alert("Failed to save transaction!");
            }
        } catch (error) {
            console.error("Error saving transaction:", error);
        }
    });
}