// ==========================================
// 1. GLOBAL VARIABLES & INITIALIZATION
// ==========================================
let expenses = [];
let myChart = null;

document.addEventListener("DOMContentLoaded", () => {
    // A. User Authentication check
    const userId = localStorage.getItem("currentUserId");
    if (!userId) {
        alert("Pehle login karein!");
        window.location.href = "login.html";
        return;
    }

    // B. Navbar par email dikhana
    const savedEmail = localStorage.getItem("userEmail");
    const emailSpan = document.getElementById("user-display-email");
    if (savedEmail && emailSpan) {
        emailSpan.innerText = `👤 ${savedEmail}`;
    }

    // C. Database se expenses load karna
    loadUserExpenses();
});

// ==========================================
// 2. LOGOUT FUNCTION
// ==========================================
function logoutUser() {
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("userEmail");
    window.location.href = "login.html";
}

// ==========================================
// 3. MONGODB SE DATA LANA
// ==========================================
async function loadUserExpenses() {
    const userId = localStorage.getItem("currentUserId");
    if (!userId) return;

    try {
        const response = await fetch(`http://localhost:5000/api/expenses/${userId}`);
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
            expenses = data; 
            renderExpenseTable(expenses); 
            updateSummary(); 
            renderChart(); 
        }
    } catch (error) {
        console.error("Data load nahi ho paya:", error);
    }
}

// ==========================================
// 4. TABLE UPDATE KARNE KA FUNCTION
// ==========================================
function renderExpenseTable(data) {
    const tbody = document.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = ""; 

    data.forEach((item, index) => {
        const statusColor = item.status === 'Paid' ? '#16a34a' : '#d97706';
        const statusBg = item.status === 'Paid' ? '#dcfce7' : '#fef3c7';

        const row = `
            <tr>
                <td>${item.date} <br><small style="color: gray;">${item.time || ''}</small></td>
                <td>${item.title}</td>
                <td>${item.category}</td>
                <td>${item.payment}</td>
                <td style="color: red; font-weight: bold;">-₹${item.amount}</td>
                <td><span style="background: ${statusBg}; color: ${statusColor}; padding: 2px 8px; border-radius: 10px;">${item.status || 'Paid'}</span></td>
                <td>
                    <button onclick="deleteExpense(${index})" style="border:none; background:none; color:red; cursor:pointer; font-size:16px;">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ==========================================
// 5. SUMMARY CARDS UPDATE (Budget Synced!)
// ==========================================
function updateSummary() {
    const cards = document.querySelectorAll(".summary-card");

    let totalExpense = 0;
    expenses.forEach(exp => totalExpense += Number(exp.amount) || 0);

    // Budget page wali universal key yahan bhi use ki hai taaki same budget dikhe
    const totalBudget = Number(localStorage.getItem("spendwise_monthly_budget")) || 50000;
    const budgetLeft = totalBudget - totalExpense;

    if(cards.length >= 4) {
        cards[0].innerHTML = `Total Expense <br> <h2 style="color:#14532d; margin-top:10px;">₹${totalExpense.toLocaleString()}</h2>`;
        cards[1].innerHTML = `This Month <br> <h2 style="color:#14532d; margin-top:10px;">₹${totalExpense.toLocaleString()}</h2>`; 
        cards[2].innerHTML = `Categories <br> <h2 style="color:#14532d; margin-top:10px;">${new Set(expenses.map(e => e.category)).size}</h2>`; 
        cards[3].innerHTML = `Budget Left <br> <h2 style="color:${budgetLeft < 0 ? '#ef4444' : '#16a34a'}; margin-top:10px;">₹${budgetLeft.toLocaleString()}</h2>`; 
    }
}

// ==========================================
// 6. DELETE EXPENSE LOGIC
// ==========================================
window.deleteExpense = function(index) {
    if(confirm("Kya aap sach me ye kharcha delete karna chahte hain?")) {
        expenses.splice(index, 1); 
        renderExpenseTable(expenses); 
        updateSummary(); 
        renderChart(); 
    }
}

// ==========================================
// 7. MASTER FILTER LOGIC (Search + Dropdowns)
// ==========================================
const filterCategory = document.getElementById("filter-category");
const filterPayment = document.getElementById("filter-payment");
const filterDate = document.getElementById("filter-date");
const filterSearch = document.getElementById("filter-search");

function applyFilters() {
    const catValue = filterCategory ? filterCategory.value : "All";
    const payValue = filterPayment ? filterPayment.value : "All";
    const searchValue = filterSearch ? filterSearch.value.toLowerCase().trim() : "";
    const dateValue = filterDate ? filterDate.value : ""; 

    const filteredData = expenses.filter(exp => {
        const matchCategory = catValue === "All" || exp.category === catValue;
        const matchPayment = payValue === "All" || exp.payment === payValue;
        const matchSearch = exp.title.toLowerCase().includes(searchValue);
        
        let matchDate = true;
        if (dateValue) {
            const selectedDateObj = new Date(dateValue);
            const formattedFilterDate = selectedDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            matchDate = exp.date === formattedFilterDate;
        }

        return matchCategory && matchPayment && matchSearch && matchDate;
    });

    renderExpenseTable(filteredData);
}

if(filterCategory) filterCategory.addEventListener("change", applyFilters);
if(filterPayment) filterPayment.addEventListener("change", applyFilters);
if(filterDate) filterDate.addEventListener("input", applyFilters);
if(filterSearch) filterSearch.addEventListener("input", applyFilters);

// ==========================================
// 8. ADD EXPENSE POPUP & MONGODB SAVE LOGIC
// ==========================================
const modal = document.getElementById("expense-modal");
const addBtn = document.querySelector(".add-expense-btn"); 
const closeBtn = document.querySelector(".close-btn");
const form = document.getElementById("expense-form");

if(addBtn && modal) {
    addBtn.addEventListener("click", () => { modal.style.display = "flex"; });
}
if(closeBtn && modal) {
    closeBtn.addEventListener("click", () => { modal.style.display = "none"; });
}

if(form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const rawDate = document.getElementById("exp-date").value;
        const dateObj = new Date(rawDate);
        const dateFormatted = !isNaN(dateObj) ? dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : "Today";

        const rawTime = document.getElementById("exp-time").value;
        let formattedTime = "12:00 PM";
        if (rawTime) {
            const [hours, minutes] = rawTime.split(':');
            let h = parseInt(hours);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            formattedTime = `${h}:${minutes} ${ampm}`;
        }

        const newExpense = {
            userId: localStorage.getItem("currentUserId"),
            date: dateFormatted,
            time: formattedTime,
            title: document.getElementById("exp-title").value,
            category: document.getElementById("exp-category").value,
            payment: document.getElementById("exp-payment").value,
            amount: Number(document.getElementById("exp-amount").value),
            status: "Paid"
        };

        try {
            const response = await fetch('http://localhost:5000/api/add-expense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newExpense)
            });

            if(response.ok) {
                expenses.unshift(newExpense); 
                renderExpenseTable(expenses);
                updateSummary();
                renderChart();

                form.reset();
                if(modal) modal.style.display = "none";
            } else {
                alert("Data save nahi hua!");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });
}

// ==========================================
// 9. EXPENSE PIE CHART LOGIC
// ==========================================
function renderChart() {
    const ctx = document.getElementById('categoryPieChart');
    if (!ctx) return;

    const categoryTotals = {};
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + Number(exp.amount);
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#16a34a', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}