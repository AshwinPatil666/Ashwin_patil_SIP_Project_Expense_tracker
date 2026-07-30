// ==========================================
// 1. SEARCH BAR LOGIC (Aapka Code)
// ==========================================
const search = document.getElementById("search");
const results = document.getElementById("search-results");

const pages = [
    {name:"Dashboard", url:"dashboard.html"},
    {name:"Expenses", url:"expense.html"},
    {name:"Budget", url:"budget.html"},
    {name:"AI Insights", url:"ai_insight.html"},
    {name:"OCR Scanner", url:"ocr.html"},
    {name:"Reports", url:"report.html"},
    {name:"Settings", url:"#"},
    {name:"Logout", url:"#"},
    {name:"History",url:""}
];

search.addEventListener("input", function(){
    const value = search.value.toLowerCase().trim();
    results.innerHTML = "";
    
    if(value === ""){
        results.style.display = "none";
        return;
    }

    const filtered = pages.filter(page =>
        page.name.toLowerCase().includes(value)
    );

    if(filtered.length === 0){
        results.style.display = "none";
        return;
    }

    filtered.forEach(page=>{
        const link = document.createElement("a");
        link.href = page.url;
        link.textContent = page.name;
        results.appendChild(link);
    });

    results.style.display = "block";
});

document.addEventListener("click", function(e){
    if(!e.target.closest(".search")){
        results.style.display="none";
    }
});


// ==========================================
// 2. DASHBOARD MATH LOGIC (Calculation)
// ==========================================
// Shuruaati Data (Aage chal kar ye MongoDB se aayega)
let transactions = [
    { type: 'income', amount: 30000, category: 'Salary' },
    { type: 'expense', amount: 500, category: 'Food' },
    { type: 'expense', amount: 200, category: 'Travel' }
];

// Math Karne Wala Function
function updateDashboard() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(item => {
        if(item.type === 'income') {
            totalIncome += item.amount;
        } else {
            totalExpense += item.amount;
        }
    });

    let currentBalance = totalIncome - totalExpense; 

    // HTML me values update karna (Index 0, 1, 2 ke hisaab se)
    const cardValues = document.querySelectorAll('.card h2');
    
    if(cardValues.length >= 3) {
        cardValues[0].innerText = "₹" + totalExpense;   // Total Expense
        cardValues[1].innerText = "₹" + totalIncome;    // Total Income
        cardValues[2].innerText = "₹" + currentBalance; // Current Balance
    }
}

// Pehli baar dashboard load hote hi numbers update karein
updateDashboard();


// ==========================================
// 3. ADD TRANSACTION MODAL (POPUP) LOGIC
// ==========================================
const modal = document.getElementById("expense-modal");
const addBtn = document.getElementById("add-expense-btn");
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

// Naya form submit karne par data add karna
if(form) {
    form.addEventListener("submit", (event) => {
        event.preventDefault(); // Page refresh hone se rokna

        // Form se details nikalna
        const type = document.getElementById("trans-type").value;
        const amount = Number(document.getElementById("trans-amount").value);
        const category = document.getElementById("trans-category").value;

        // Naye data ko apne array me daalna
        transactions.push({
            type: type,
            amount: amount,
            category: category
        });

        // Saare numbers ko wapas re-calculate karna
        updateDashboard();

        // Modal band karke form clear kar dena
        modal.style.display = "none";
        form.reset();
    });
}