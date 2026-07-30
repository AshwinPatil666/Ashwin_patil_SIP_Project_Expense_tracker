// ==========================================// 1. Page load hote hi email dikhana
window.addEventListener('DOMContentLoaded', () => {
    const savedEmail = localStorage.getItem("userEmail");
    const emailSpan = document.getElementById("user-display-email");
    
    if (savedEmail && emailSpan) {
        emailSpan.innerText = `👤 ${savedEmail}`;
    }
});

// 2. Logout function
function logoutUser() {
    // LocalStorage se saara data saaf kar dena
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("userEmail");
    
    // Wapas login page par bhej dena
    window.location.href = "login.html";
}
// ==========================================
// PAGE LOAD HOTE HI MONGODB SE DATA LANA
// ==========================================
async function loadUserExpenses() {
    const userId = localStorage.getItem("currentUserId");
    
    // Agar user login nahi hai toh wapas login page par bhej do
    if (!userId) {
        alert("Pehle login karein!");
        window.location.href = "login.html"; 
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/expenses/${userId}`);
        const data = await response.json();

        if (response.ok) {
            expenses = data; // Database wala data global array me save kiya
            renderExpenseTable(expenses); // Table me dikhaya
            updateSummary(); // Total amount update kiya
            if (typeof renderChart === 'function') {
                renderChart(); // Gol chart update kiya
            }
        }
    } catch (error) {
        console.error("Data load nahi ho paya:", error);
    }
}

// 👉 Page khulte hi automatic ye function chal jayega
loadUserExpenses();
// 1. DATA (Dummy Data - Aage MongoDB se aayega)
// ==========================================
let expenses = [
    { date: "25 Jul", title: "Pizza", category: "Food", payment: "UPI", amount: 450, status: "Paid" },
    { date: "22 Jul", title: "Electricity Bill", category: "Utility", payment: "Bank", amount: 1200, status: "Paid" },
    { date: "20 Jul", title: "Shoes", category: "Shopping", payment: "Credit Card", amount: 2000, status: "Pending" },
    { date: "18 Jul", title: "Petrol", category: "Fuel", payment: "Cash", amount: 500, status: "Paid" }
];

// ==========================================
// 2. TABLE UPDATE KARNE KA FUNCTION
// ==========================================
function renderExpenseTable(data) {
    // Table ke body ko target karna
    const tbody = document.querySelector("tbody");
    tbody.innerHTML = ""; // Pehle purana data saaf karein

    // Har expense ke liye nayi line banana
    data.forEach((item, index) => {
        // Status ke hisaab se rang badalna (Paid = Green, Pending = Orange)
        const statusColor = item.status === 'Paid' ? '#16a34a' : '#d97706';
        const statusBg = item.status === 'Paid' ? '#dcfce7' : '#fef3c7';

        const row = `
    <tr>
        <td>${item.date} <br><small style="color: gray;">${item.time || ''}</small></td>
        <td>${item.title}</td>
        <td>${item.category}</td>
        <td>${item.payment}</td>
        <td style="color: red; font-weight: bold;">-₹${item.amount}</td>
        <td><span style="background: ${statusBg}; color: ${statusColor}; padding: 2px 8px; border-radius: 10px;">${item.status}</span></td>
        <td>
            <button onclick="deleteExpense(${index})" style="border:none; background:none; color:red; cursor:pointer; font-size:16px;">🗑️</button>
        </td>
    </tr>
`;
        tbody.innerHTML += row;
    });
}

// ==========================================
// 3. SUMMARY CARDS UPDATE KARNE KA FUNCTION
// ==========================================
function updateSummary() {
    const cards = document.querySelectorAll(".summary-card");

    // Total kharcha calculate karna
    let totalExpense = 0;
    expenses.forEach(exp => totalExpense += exp.amount);

    // Cards me data daalna
    if(cards.length >= 4) {
        cards[0].innerHTML = `Total Expense <br> <h2 style="color:#14532d; margin-top:10px;">₹${totalExpense}</h2>`;
        cards[1].innerHTML = `This Month <br> <h2 style="color:#14532d; margin-top:10px;">₹${totalExpense}</h2>`; 
        cards[2].innerHTML = `Categories <br> <h2 style="color:#14532d; margin-top:10px;">4</h2>`; 
        cards[3].innerHTML = `Budget Left <br> <h2 style="color:#16a34a; margin-top:10px;">₹15,000</h2>`; 
    }
}

// ==========================================
// 4. DELETE EXPENSE LOGIC
// ==========================================
// Ye function tab chalega jab koi 🗑️ icon par click karega
window.deleteExpense = function(index) {
    if(confirm("Kya aap sach me ye kharcha delete karna chahte hain?")) {
        expenses.splice(index, 1); // Array se item hata do
        renderExpenseTable(expenses); // Table wapas load karo
        updateSummary(); // Cards wapas update karo
    }
}

// ==========================================
// 5. SEARCH LOGIC (Magic! ✨)
// ==========================================
// ==========================================
// 5. MASTER FILTER LOGIC (Search + Dropdowns)
// ==========================================
const filterCategory = document.getElementById("filter-category");
const filterPayment = document.getElementById("filter-payment");
const filterDate = document.getElementById("filter-date");
const filterSearch = document.getElementById("filter-search");

// Ek common function jo sabhi filters ko ek sath check karega
function applyFilters() {
    const catValue = filterCategory.value;
    const payValue = filterPayment.value;
    const searchValue = filterSearch.value.toLowerCase().trim();
    const dateValue = filterDate.value; // Format: "YYYY-MM-DD"

    const filteredData = expenses.filter(exp => {
        // 1. Category check
        const matchCategory = catValue === "All" || exp.category === catValue;
        
        // 2. Payment check
        const matchPayment = payValue === "All" || exp.payment === payValue;
        
        // 3. Search check (Title me)
        const matchSearch = exp.title.toLowerCase().includes(searchValue);
        
        // 4. Date check (Agar date select ki hai tabhi check karo)
        let matchDate = true;
        if (dateValue) {
            // HTML date format ko apne format (25 Jul) se match karwana
            const selectedDateObj = new Date(dateValue);
            const formattedFilterDate = selectedDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            matchDate = exp.date === formattedFilterDate;
        }

        // Agar charo cheezein sahi hain, tabhi data table me dikhao
        return matchCategory && matchPayment && matchSearch && matchDate;
    });

    // Filter hone ke baad bacha hua data table me bhejo
    renderExpenseTable(filteredData);
}

// Jab bhi kisi dropdown ya input me kuch change ho, ye function chala do
if(filterCategory) filterCategory.addEventListener("change", applyFilters);
if(filterPayment) filterPayment.addEventListener("change", applyFilters);
if(filterDate) filterDate.addEventListener("input", applyFilters);
if(filterSearch) filterSearch.addEventListener("input", applyFilters);

// ==========================================
// PAGE LOAD HOTE HI KYA KYA CHALANA HAI
// ==========================================
renderExpenseTable(expenses);
updateSummary();
// ==========================================
// 6. ADD EXPENSE POPUP LOGIC
// ==========================================
const modal = document.getElementById("expense-modal");
const addBtn = document.querySelector(".add-expense-btn"); // Aapke button ki class
const closeBtn = document.querySelector(".close-btn");
const form = document.getElementById("expense-form");

// Button dabane par modal kholna
if(addBtn) {
    addBtn.addEventListener("click", () => {
        modal.style.display = "flex";
    });
}

// (X) dabane par modal band karna
if(closeBtn) {
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });
}

// ==========================================
// FORM SUBMIT KARKE MONGODB ME SAVE KARNA
// ==========================================
// Form submit hone par time ke sath data bhejna
if(form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // 1. Date formatting
        const rawDate = document.getElementById("exp-date").value;
        const dateObj = new Date(rawDate);
        const dateFormatted = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

        // 👉 NAYA: 2. Time formatting (jaise 04:30 PM)
        const rawTime = document.getElementById("exp-time").value; // Format: "16:30"
        let formattedTime = "";
        if (rawTime) {
            const [hours, minutes] = rawTime.split(':');
            let h = parseInt(hours);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12; // 12-hour format me badalna
            formattedTime = `${h}:${minutes} ${ampm}`;
        }

        // 3. Naya kharcha object (Time ke sath)
     // 2. Naya kharcha banayein
     const newExpense = {
    userId: localStorage.getItem("currentUserId"), // 👉 NAYA: Kis user ki ID hai ye
    date: dateFormatted !== "Invalid Date" ? dateFormatted : "Today",
    time: formattedTime || "12:00 PM",
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
                if (typeof renderChart === 'function') renderChart();

                form.reset();
                modal.style.display = "none";
            } else {
                alert("Data save nahi hua!");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });
}
// ==========================================
// 7. EXPENSE PIE CHART LOGIC
// ==========================================
let myChart = null; // Purane chart ko clear karne ke liye ek variable

function renderChart() {
    const ctx = document.getElementById('categoryPieChart');
    if (!ctx) return;

    // Categories ke hisaab se total nikalna (Math logic)
    const categoryTotals = {};
    expenses.forEach(exp => {
        if (categoryTotals[exp.category]) {
            categoryTotals[exp.category] += exp.amount;
        } else {
            categoryTotals[exp.category] = exp.amount;
        }
    });

    // Chart ko labels aur data dena
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // Agar purana chart hai toh use delete karo taaki naya ban sake
    if (myChart) {
        myChart.destroy();
    }

    // Naya Chart banana
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

// Chart ko pehli baar load karne ke liye call karein
renderChart();
