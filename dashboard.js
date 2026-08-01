// ==========================================
// 1. GLOBAL VARIABLES & INITIALIZATION
// ==========================================
let transactions = [];
let globalTransactions = [];
let currentFilter = 'monthly';
let myExpenseChart = null;

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
            globalTransactionsForCharts = data;
            
            updateDashboard(); 
            renderAllCharts(transactions); 
            renderRecentTransactions(transactions); // <-- Yeh line yahan add kar dein
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

    const totalBudget = Number(localStorage.getItem("spendwise_monthly_budget")) || 50000;
    let currentBalance = totalBudget - totalExpense; 

    // HTML elements update karein
    const cardValues = document.querySelectorAll('.card h2');
    
    if(cardValues.length >= 3) {
        cardValues[0].innerText = "₹" + totalExpense.toLocaleString();    // Total Expense
        cardValues[1].innerText = "₹" + totalBudget.toLocaleString();    // Total Budget
        cardValues[2].innerText = "₹" + currentBalance.toLocaleString();  // Remaining / Balance
    }

    // Agar alag se Savings card ke liye id di hai toh use yahan update karein:
    const savingsEl = document.getElementById("ui-savings");
    if (savingsEl) {
        // Savings = Budget - Expense (ya agar koi alag logic hai toh yahan likh sakte hain)
        let savings = totalBudget - totalExpense;
        savingsEl.innerText = "₹" + (savings > 0 ? savings.toLocaleString() : 0);
    }
}
// ==========================================
// 5. CHART FILTER & RENDER LOGIC
let myCategoryChart = null;
let myTrendChart = null;
let currentTrendType = 'monthly'; // Default monthly
let globalTransactionsForCharts = [];

// Data milne par dono charts ko call karne ka function
function renderAllCharts(expenses) {
    globalTransactionsForCharts = expenses;
    renderCategoryDoughnutChart(expenses);
    renderTrendBarChart(expenses);
}

// 1. Category Breakdown Doughnut Chart
function renderCategoryDoughnutChart(expenses) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    const categoryTotals = {};
    expenses.forEach(item => {
        const amt = Number(item.amount) || 0;
        const cat = item.category ? item.category.trim() : "General";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    });

    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);

    if (myCategoryChart) {
        myCategoryChart.destroy();
    }

    const colorPalette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    myCategoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.length > 0 ? categories : ['No Data'],
            datasets: [{
                data: amounts.length > 0 ? amounts : [1],
                backgroundColor: categories.length > 0 ? colorPalette.slice(0, categories.length) : ['#e2e8f0'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
            },
            cutout: '65%'
        }
    });
}

// 2. Daily / Monthly Trend Filter Button Handler
function switchTrendFilter(type) {
    currentTrendType = type;
    
    // Style switch
    document.getElementById('btn-trend-daily').style.background = type === 'daily' ? '#16a34a' : 'white';
    document.getElementById('btn-trend-daily').style.color = type === 'daily' ? 'white' : '#16a34a';

    document.getElementById('btn-trend-monthly').style.background = type === 'monthly' ? '#16a34a' : 'white';
    document.getElementById('btn-trend-monthly').style.color = type === 'monthly' ? 'white' : '#16a34a';

    renderTrendBarChart(globalTransactionsForCharts);
}

// 3. Daily & Monthly Trend Bar Chart Logic
function renderTrendBarChart(expenses) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    let labels = [];
    let dataValues = [];

    if (currentTrendType === 'daily') {
        // Pichle 7 dino ka data group karein ya daily basis par
        const dailyMap = {};
        expenses.forEach(item => {
            const dateStr = item.date ? item.date.split('T')[0] : 'Unknown';
            const amt = Number(item.amount) || 0;
            dailyMap[dateStr] = (dailyMap[dateStr] || 0) + amt;
        });
        labels = Object.keys(dailyMap).sort().slice(-7); // Aakhiri 7 din
        dataValues = labels.map(date => dailyMap[date]);
    } else {
        // Monthly trend breakdown
        const monthlyMap = {};
        expenses.forEach(item => {
            // Agar date format available hai toh month nikal lo, warna general
            let monthName = "Current Month";
            if(item.date) {
                const d = new Date(item.date);
                if(!isNaN(d)) {
                    monthName = d.toLocaleString('default', { month: 'short', year: '2-digit' });
                } else {
                    monthName = item.date; // agar format '25 Jul' jaisa hai
                }
            }
            const amt = Number(item.amount) || 0;
            monthlyMap[monthName] = (monthlyMap[monthName] || 0) + amt;
        });
        labels = Object.keys(monthlyMap);
        dataValues = labels.map(m => monthlyMap[m]);
    }

    if (myTrendChart) {
        myTrendChart.destroy();
    }

    myTrendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['No Data'],
            datasets: [{
                label: `${currentTrendType.toUpperCase()} Expenses (₹)`,
                data: dataValues.length > 0 ? dataValues : [0],
                backgroundColor: '#16a34a',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
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
            date: new Date().toISOString(), // Standard date format for comparison
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
                globalTransactions = transactions;
                updateDashboard();
                processAndRenderChart(transactions); 
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
myTrendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['No Data'],
            datasets: [{
                label: `${currentTrendType.toUpperCase()} Expenses (₹)`,
                data: dataValues.length > 0 ? dataValues : [0],
                backgroundColor: '#16a34a',
                borderRadius: 6,
                maxBarThickness: 40 // <-- Yeh line pillars ki max width ko limit kar degi taaki wo mote na ho
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
    // Recent Transactions ko dynamic render karne ka function
function renderRecentTransactions(expenses) {
    const tbody = document.getElementById("recent-transactions-tbody");
    if (!tbody) return;

    tbody.innerHTML = ""; // Purana dummy data clear kar do

    if (!expenses || expenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #64748b;">No transactions found</td></tr>`;
        return;
    }

    // Latest transactions ko upar dikhane ke liye slice ya sort kar sakte hain (aakhiri 5 transactions)
    const recentData = [...expenses].reverse().slice(0, 5);

    recentData.forEach(item => {
        // Date formatting safely
        let formattedDate = item.date ? item.date.split('T')[0] : "Recent";
        
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${item.category || 'General'}</td>
            <td style="color: #ef4444; font-weight: 600;">-₹${Number(item.amount || 0).toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });
}