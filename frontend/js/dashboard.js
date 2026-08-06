// dashboard.js ke start me
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    
    // Agar token nahi mila toh local par login.html par bhej do
    if (!token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }
    
    // Yahan aapke dashboard items/expenses load honge
    loadDashboardData(); 
});// ==========================================
// 1. GLOBAL VARIABLES & INITIALIZATION
// ==========================================
let transactions = [];
let globalTransactionsForCharts = [];
let currentTrendType = 'monthly';
let myCategoryChart = null;
let myTrendChart = null;

document.addEventListener("DOMContentLoaded", () => {
    // ---------------------------------------------------------
    // A. User Authentication & LocalStorage Setup
    // ---------------------------------------------------------
    const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");
    if (!userId) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    const userName = localStorage.getItem("userName") || localStorage.getItem("userEmail")?.split('@')[0] || "Friend";
    const userEmail = localStorage.getItem("userEmail") || "user@example.com";

    // ---------------------------------------------------------
    // B. Navbar Dynamic Time-based Greeting
    // ---------------------------------------------------------
    const greetingEl = document.getElementById("user-display-name");
    if (greetingEl) {
        const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1);
        greetingEl.innerText = formattedName;
    }

    const hours = new Date().getHours();
    const welcomeHeading = document.getElementById("welcome-user-heading");
    let timeGreeting = "Welcome back";
    
    if (hours < 12) timeGreeting = "Good morning";
    else if (hours < 17) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";

    if (welcomeHeading) {
        welcomeHeading.innerHTML = `${timeGreeting}, <span style="color: #16a34a;">${userName}</span>! 👋`;
    }

    // Display user email on navbar (agar element exist kare)
    const emailSpan = document.getElementById("user-display-email");
    if (emailSpan) {
        emailSpan.innerText = `👤 ${userEmail}`;
    }

    // ---------------------------------------------------------
    // C. Profile Avatar Initials (e.g. Ashwin Patil -> AP)
    // ---------------------------------------------------------
    const avatarInitialsEl = document.getElementById("avatar-initials");
    if (avatarInitialsEl && userName) {
        const parts = userName.trim().split(" ");
        let initials = parts[0].charAt(0).toUpperCase();
        if (parts.length > 1) {
            initials += parts[parts.length - 1].charAt(0).toUpperCase();
        }
        avatarInitialsEl.innerText = initials;
    }

    // Dropdown header name & email update
    const dropdownNameEl = document.getElementById("dropdown-user-name");
    const dropdownEmailEl = document.getElementById("dropdown-user-email");
    if (dropdownNameEl) dropdownNameEl.innerText = userName;
    if (dropdownEmailEl) dropdownEmailEl.innerText = userEmail;

    // ---------------------------------------------------------
    // D. Dropdown Menus Toggles (Notification & Profile)
    // ---------------------------------------------------------
    const notifBtn = document.getElementById("notif-bell-btn");
    const notifDropdown = document.getElementById("notif-dropdown");
    const profileBtn = document.getElementById("profile-avatar-btn");
    const profileDropdown = document.getElementById("profile-dropdown");

    // Notification Dropdown Toggle
    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (profileDropdown) profileDropdown.style.display = "none"; // Close profile menu
            notifDropdown.style.display = notifDropdown.style.display === "block" ? "none" : "block";
        });
    }

    // Profile Dropdown Toggle
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (notifDropdown) notifDropdown.style.display = "none"; // Close notification menu
            profileDropdown.style.display = profileDropdown.style.display === "block" ? "none" : "block";
        });
    }

    // Outside click par dono dropdowns band karna
    window.addEventListener("click", () => {
        if (notifDropdown) notifDropdown.style.display = "none";
        if (profileDropdown) profileDropdown.style.display = "none";
    });

    // Profile Dropdown Sign Out Handler
    const dropdownLogout = document.getElementById("dropdown-logout-btn");
    if (dropdownLogout) {
        dropdownLogout.addEventListener("click", () => {
            if (confirm("Are you sure you want to log out?")) {
                localStorage.removeItem("token");
                localStorage.removeItem("currentUserId");

                localStorage.removeItem("userId");
                localStorage.removeItem("userName");
                localStorage.removeItem("userEmail");
                window.location.href = "login.html";
            }
        });
    }

    // ---------------------------------------------------------
    // E. Fetch Data from MongoDB Backend
    // ---------------------------------------------------------
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
async function loadDashboardData() {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");

    if (!token || !userId) {
        alert("Session expired. Please login again.");
        window.location.href = "login.html";
        return;
    }

    try {
        // ============================
        // EXPENSES FROM MONGODB
        // ============================
        const token = localStorage.getItem("token");

if (!token) {
    alert("Session expired. Please login again.");
    window.location.href = "login.html";
    return;
}

const response = await fetch(
    "https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/expenses/add",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    }
);

        const expenseData = await expenseResponse.json();

        console.log("Expenses API:", expenseResponse.status, expenseData);

        if (expenseResponse.status === 401 || expenseResponse.status === 403) {
            localStorage.removeItem("token");
            alert("Session expired. Please login again.");
            window.location.href = "login.html";
            return;
        }

        if (!expenseResponse.ok) {
            console.error("Expense API failed:", expenseData);
            return;
        }

        transactions = Array.isArray(expenseData)
            ? expenseData
            : expenseData.expenses || [];

        globalTransactionsForCharts = transactions;

        // ============================
        // BUDGET FROM MONGODB
        // ============================
        const budgetResponse = await fetch(
            "https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/budget",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const budgetData = await budgetResponse.json();

        console.log("Budget API:", budgetResponse.status, budgetData);

        if (budgetResponse.status === 401 || budgetResponse.status === 403) {
            localStorage.removeItem("token");
            alert("Session expired. Please login again.");
            window.location.href = "login.html";
            return;
        }

        if (budgetResponse.ok) {
            // MongoDB budget ko localStorage me temporary cache
            localStorage.setItem(
                "spendwise_monthly_budget",
                budgetData.monthlyLimit || 0
            );

            // Dashboard update
            updateDashboard(budgetData.monthlyLimit || 0);
        } else {
            updateDashboard(0);
        }

        // Charts + transactions
        renderAllCharts(transactions);
        renderRecentTransactions(transactions);

    } catch (error) {
        console.error("Dashboard loading error:", error);
    }
}

// ==========================================
// 4. DASHBOARD MATH LOGIC
// ==========================================
function updateDashboard(monthlyBudget = 0) {

    let totalExpense = 0;

    transactions.forEach(item => {
        // Income ko expense me count mat karo
        if (item.type !== "income") {
            totalExpense += Number(item.amount) || 0;
        }
    });

    const totalBudget = Number(monthlyBudget) || 0;

    const currentBalance = totalBudget - totalExpense;

    const cardValues = document.querySelectorAll(".card h2");

    if (cardValues.length >= 3) {
        cardValues[0].innerText =
            "₹" + totalExpense.toLocaleString("en-IN");

        cardValues[1].innerText =
            "₹" + totalBudget.toLocaleString("en-IN");

        cardValues[2].innerText =
            "₹" + currentBalance.toLocaleString("en-IN");
    }

    const savingsEl = document.getElementById("ui-savings");

    if (savingsEl) {
        savingsEl.innerText =
            "₹" + Math.max(currentBalance, 0).toLocaleString("en-IN");
    }
}
// ==========================================
// 5. CHART FILTER & RENDER LOGIC
// ==========================================
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

// 2. Filter Handler
function switchTrendFilter(type) {
    currentTrendType = type;
    
    const btnDaily = document.getElementById('btn-trend-daily');
    const btnMonthly = document.getElementById('btn-trend-monthly');

    if (btnDaily && btnMonthly) {
        btnDaily.style.background = type === 'daily' ? '#16a34a' : 'white';
        btnDaily.style.color = type === 'daily' ? 'white' : '#16a34a';

        btnMonthly.style.background = type === 'monthly' ? '#16a34a' : 'white';
        btnMonthly.style.color = type === 'monthly' ? 'white' : '#16a34a';
    }

    renderTrendBarChart(globalTransactionsForCharts);
}

// 3. Bar Chart Logic
function renderTrendBarChart(expenses) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    let labels = [];
    let dataValues = [];

    if (currentTrendType === 'daily') {
        const dailyMap = {};
        expenses.forEach(item => {
            const dateStr = item.date ? item.date.split('T')[0] : 'Unknown';
            const amt = Number(item.amount) || 0;
            dailyMap[dateStr] = (dailyMap[dateStr] || 0) + amt;
        });
        labels = Object.keys(dailyMap).sort().slice(-7);
        dataValues = labels.map(date => dailyMap[date]);
    } else {
        const monthlyMap = {};
        expenses.forEach(item => {
            let monthName = "Current Month";
            if (item.date) {
                const d = new Date(item.date);
                if (!isNaN(d)) {
                    monthName = d.toLocaleString('default', { month: 'short', year: '2-digit' });
                } else {
                    monthName = item.date;
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
                borderRadius: 6,
                maxBarThickness: 40
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
// ==========================================
// ADD TRANSACTION MODAL LOGIC
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("expense-modal");
    const addBtn = document.getElementById("add-expense-btn");
    const closeBtn = document.querySelector(".close-btn");
    const dateInput = document.getElementById("trans-date");

    // Default Today's Date
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Open Modal
    if (addBtn && modal) {
        addBtn.addEventListener("click", () => {
            modal.style.display = "flex";
        });
    }

    // Close Modal
    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    // Close modal on outside click
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });

    // Handle Form Submit
    const expenseForm = document.getElementById("expense-form");
    if (expenseForm) {
        expenseForm.addEventListener("submit", handleAddTransaction);
    }
});

// Toggle between Expense and Income
function switchTransType(type) {
    const typeInput = document.getElementById("trans-type");
    const btnExpense = document.getElementById("type-expense");
    const btnIncome = document.getElementById("type-income");
    const categorySelect = document.getElementById("trans-category");

    typeInput.value = type;

    if (type === 'expense') {
        btnExpense.classList.add("active");
        btnIncome.classList.remove("active");
        
        // Expense categories
        categorySelect.innerHTML = `
            <option value="" disabled selected>Select Category</option>
            <option value="Food & Dining">🍔 Food & Dining</option>
            <option value="Shopping">🛍️ Shopping</option>
            <option value="Transport & Fuel">⛽ Transport & Fuel</option>
            <option value="Bills & Utilities">⚡ Bills & Utilities</option>
            <option value="Entertainment">🎬 Entertainment</option>
            <option value="General">📦 General</option>
        `;
    } else {
        btnIncome.classList.add("active");
        btnExpense.classList.remove("active");

        // Income categories
        categorySelect.innerHTML = `
            <option value="" disabled selected>Select Income Source</option>
            <option value="Salary">💼 Salary</option>
            <option value="Freelance">💻 Freelance</option>
            <option value="Investment">📈 Investment</option>
            <option value="Business">🏪 Business</option>
            <option value="Other Income">💰 Other Income</option>
        `;
    }
}

// Submit Transaction to Express/MongoDB Backend
async function handleAddTransaction(event) {
    event.preventDefault();

    const userId =
        localStorage.getItem("currentUserId") ||
        localStorage.getItem("userId");

    const token = localStorage.getItem("token");

    if (!userId || !token) {
        alert("Please login again.");
        window.location.href = "login.html";
        return;
    }

    const type = document.getElementById("trans-type").value;
    const amount = Number(document.getElementById("trans-amount").value);
    const category = document.getElementById("trans-category").value;
    const paymentMode = document.getElementById("trans-payment").value;
    const date = document.getElementById("trans-date").value;
    const description =
        document.getElementById("trans-desc").value || category;

    // IMPORTANT
    const payload = {
        userId,
        type,
        amount,
        category,
        paymentMode,
        date,
        description
    };

    try {
        const response = await fetch(
            "https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/expenses/add-expense",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();

        console.log("Add Expense:", response.status, data);

        if (!response.ok) {
            alert(`Failed (${response.status}): ${data.message || data.error}`);
            return;
        }

        alert("Expense added successfully!");

        document.getElementById("expense-modal").style.display = "none";
        document.getElementById("expense-form").reset();

        await loadDashboardData();

    } catch (error) {
        console.error("Save Expense Error:", error);
        alert("Error: " + error.message);
    }
}

// ==========================================
// 7. RECENT TRANSACTIONS RENDER
// ==========================================
function renderRecentTransactions(expenses) {
    const tbody = document.getElementById("recent-transactions-tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!expenses || expenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #64748b;">No transactions found</td></tr>`;
        return;
    }

    const recentData = [...expenses].slice(0, 5);

    recentData.forEach(item => {
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