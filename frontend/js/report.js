// ==========================================
// SPENDWISE FINANCIAL REPORTS LOGIC
// ==========================================
let allTransactions = [];
let monthlyChartInstance = null;
let categoryChartInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Authentication Check
    const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");
    if (!userId) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    // 2. Initial Data Load
    await fetchAndRenderReports(userId);

    // 3. Filter Button Event Handler
    const filterBtn = document.querySelector(".filter-btn");
    if (filterBtn) {
        filterBtn.addEventListener("click", () => applyFilters());
    }

    // 4. Export Buttons Handlers
    const pdfBtn = document.querySelector(".pdf-btn");
    if (pdfBtn) {
        pdfBtn.addEventListener("click", () => exportToPDF());
    }

    const csvBtn = document.querySelector(".csv-btn");
    if (csvBtn) {
        csvBtn.addEventListener("click", () => exportToCSV());
    }
});

// ==========================================
// FETCH EXPENSES FROM BACKEND
// ==========================================
async function fetchAndRenderReports(userId) {
    try {
        const response = await fetch(`https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/expenses/${userId}`);
        const data = await response.json();

        if (!response.ok || !Array.isArray(data)) {
            console.error("Failed to load user transactions.");
            return;
        }

        allTransactions = data;
        processAndRenderData(allTransactions);

    } catch (error) {
        console.error("Error fetching report data:", error);
    }
}

// ==========================================
// DATA PROCESSING & RENDER CONTROLLER
// ==========================================
function processAndRenderData(transactions) {
    let totalExpense = 0;
    const categoryMap = {};
    const monthlyMap = {};

    transactions.forEach(tx => {
        const amount = Number(tx.amount) || 0;
        const category = tx.category || "General";
        
        // Date formatting for monthly grouping
        const dateObj = tx.date ? new Date(tx.date) : new Date();
        const monthYear = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });

        totalExpense += amount;
        categoryMap[category] = (categoryMap[category] || 0) + amount;
        monthlyMap[monthYear] = (monthlyMap[monthYear] || 0) + amount;
    });

    // Default static or saved monthly budget
    const monthlyBudget = Number(localStorage.getItem("spendwise_monthly_budget")) || 50000;
    const estimatedSavings = Math.max(0, monthlyBudget - totalExpense);

    // Update Summary Cards
    updateSummaryCards(totalExpense, monthlyBudget, estimatedSavings, transactions.length);

    // Update Recent Table
    renderReportTable(transactions);

    // Render Charts
    renderMonthlyChart(monthlyMap);
    renderCategoryChart(categoryMap);

    // Update Insights & Recommendations
    updateReportInsights(categoryMap, totalExpense, monthlyBudget);
}

// ==========================================
// SUMMARY CARDS RENDERER
// ==========================================
function updateSummaryCards(totalExpense, income, savings, count) {
    const cards = document.querySelectorAll(".report-summary .report-card");
    if (!cards || cards.length < 4) return;

    cards[0].querySelector("h2").innerText = `₹${totalExpense.toLocaleString('en-IN')}`;
    cards[1].querySelector("h2").innerText = `₹${income.toLocaleString('en-IN')}`;
    cards[2].querySelector("h2").innerText = `₹${savings.toLocaleString('en-IN')}`;
    cards[3].querySelector("h2").innerText = count.toString();
}

// ==========================================
// REPORT TABLE RENDERER
// ==========================================
function renderReportTable(transactions) {
    const tableBody = document.querySelector(".report-table table tbody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (transactions.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No records found for selected period.</td></tr>`;
        return;
    }

    // Sort by recent date
    const sortedTx = [...transactions].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    sortedTx.slice(0, 10).forEach(tx => {
        const dateStr = tx.date ? new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A';
        const category = tx.category || 'General';
        const amount = Number(tx.amount) || 0;
        const paymentMode = tx.paymentMode || 'UPI / Cash';
        const status = 'Completed';

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${dateStr}</td>
            <td>${category}</td>
            <td>₹${amount.toLocaleString('en-IN')}</td>
            <td>${paymentMode}</td>
            <td><span style="color: #10b981; font-weight: 600;">${status}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

// ==========================================
// CHART.JS RENDERERS
// ==========================================
function renderMonthlyChart(monthlyMap) {
    const ctx = document.getElementById("monthlyExpenseChart");
    if (!ctx) return;

    const labels = Object.keys(monthlyMap);
    const data = Object.values(monthlyMap);

    if (monthlyChartInstance) monthlyChartInstance.destroy();

    monthlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['Current Month'],
            datasets: [{
                label: 'Expenses (₹)',
                data: data.length > 0 ? data : [0],
                backgroundColor: '#10b981',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function renderCategoryChart(categoryMap) {
    const ctx = document.getElementById("categoryDistributionChart");
    if (!ctx) return;

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);

    if (categoryChartInstance) categoryChartInstance.destroy();

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length > 0 ? labels : ['No Data'],
            datasets: [{
                data: data.length > 0 ? data : [1],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
        }
    });
}

// ==========================================
// FILTER LOGIC
// ==========================================
function applyFilters() {
    const startDateInput = document.querySelectorAll(".report-filter input[type='date']")[0]?.value;
    const endDateInput = document.querySelectorAll(".report-filter input[type='date']")[1]?.value;
    const categorySelect = document.querySelector(".report-filter select")?.value;

    let filtered = [...allTransactions];

    if (startDateInput) {
        filtered = filtered.filter(tx => new Date(tx.date) >= new Date(startDateInput));
    }

    if (endDateInput) {
        filtered = filtered.filter(tx => new Date(tx.date) <= new Date(endDateInput));
    }

    if (categorySelect && categorySelect !== "All Categories") {
        filtered = filtered.filter(tx => (tx.category || "").toLowerCase() === categorySelect.toLowerCase());
    }

    processAndRenderData(filtered);
}

// ==========================================
// DYNAMIC INSIGHTS & RECOMMENDATIONS
// ==========================================
function updateReportInsights(categoryMap, totalExpense, budget) {
    const insightList = document.querySelector(".insight-card ul");
    const recList = document.querySelector(".recommendation-card ul");

    if (insightList) {
        insightList.innerHTML = "";
        let highestCat = "None";
        let highestAmt = 0;

        for (const [cat, amt] of Object.entries(categoryMap)) {
            if (amt > highestAmt) {
                highestAmt = amt;
                highestCat = cat;
            }
        }

        insightList.innerHTML += `<li>${highestCat} is your highest spending category (₹${highestAmt.toLocaleString('en-IN')}).</li>`;
        insightList.innerHTML += `<li>Total transactions recorded: ${allTransactions.length}.</li>`;
        insightList.innerHTML += `<li>Current budget utilization: ${budget > 0 ? Math.round((totalExpense / budget) * 100) : 0}%.</li>`;
    }

    if (recList) {
        recList.innerHTML = "";
        if (totalExpense > budget * 0.75) {
            recList.innerHTML += `<li>⚠️ Expenses are high. Consider lowering ${Object.keys(categoryMap)[0] || 'unnecessary'} purchases.</li>`;
        } else {
            recList.innerHTML += `<li>✔ Great job! Spending is within safe limits.</li>`;
        }
        recList.innerHTML += `<li>Review your weekly reports regularly to maintain discipline.</li>`;
    }
}

// ==========================================
// EXPORT FUNCTIONALITIES
// ==========================================
// ==========================================
// CLEAN PROFESSIONAL PDF EXPORT
// ==========================================
// ==========================================
// CLEAN PDF EXPORT (Without Messing Up UI)
// ==========================================
// ==========================================
// FORMAL EXPENSE REPORT PDF EXPORT
// ==========================================
async function exportToPDF() {
    const userId = localStorage.getItem("currentUserId") || localStorage.getItem("userId");
    const userEmail = localStorage.getItem("userEmail") || "user@spendwise.com";
    const userName = localStorage.getItem("userName") || "Valued User";

    if (!allTransactions || allTransactions.length === 0) {
        alert("No transaction data available to export.");
        return;
    }

    // 1. Calculate Totals
    let subtotal = 0;
    const categoryTotals = {};

    allTransactions.forEach(tx => {
        const amt = Number(tx.amount) || 0;
        subtotal += amt;
        const cat = tx.category || "General";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    });

    const reportId = "EXP-" + Math.floor(100000 + Math.random() * 900000);
    const currentDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // 2. Generate Itemized Rows HTML
    let tableRowsHTML = "";
    allTransactions.forEach((tx, index) => {
        const dateStr = tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : currentDate;
        tableRowsHTML += `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
                <td style="padding: 10px; text-align: center;">${index + 1}</td>
                <td style="padding: 10px;">${dateStr}</td>
                <td style="padding: 10px; font-weight: 600; color: #1e293b;">${tx.category || 'General'}</td>
                <td style="padding: 10px;">${tx.description || 'Expense transaction'}</td>
                <td style="padding: 10px;">${tx.paymentMode || 'UPI / Online'}</td>
                <td style="padding: 10px; text-align: right; font-weight: 600;">₹${(Number(tx.amount) || 0).toLocaleString('en-IN')}</td>
            </tr>
        `;
    });

    // 3. Construct Formal Document Template Container
    const pdfContainer = document.createElement("div");
    pdfContainer.style.width = "750px";
    pdfContainer.style.padding = "40px";
    pdfContainer.style.background = "#ffffff";
    pdfContainer.style.fontFamily = "'Helvetica Neue', Arial, sans-serif";
    pdfContainer.style.color = "#0f172a";

    pdfContainer.innerHTML = `
        <!-- HEADER -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 25px;">
            <div>
                <h1 style="margin: 0; font-size: 28px; color: #10b981; text-transform: uppercase; letter-spacing: 1px;">SpendWise</h1>
                <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Automated Financial Expense Statement</p>
            </div>
            <div style="text-align: right;">
                <h2 style="margin: 0; font-size: 22px; color: #1e293b;">EXPENSE REPORT</h2>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;"><strong>Report ID:</strong> ${reportId}</p>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;"><strong>Date Generated:</strong> ${currentDate}</p>
            </div>
        </div>

        <!-- EMPLOYEE / USER METADATA -->
        <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 25px;">
            <div>
                <p style="margin: 0; font-size: 12px; color: #64748b;">ACCOUNT HOLDER</p>
                <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 700; color: #1e293b;">${userName}</p>
                <p style="margin: 2px 0 0 0; font-size: 13px; color: #475569;">${userEmail}</p>
            </div>
            <div style="text-align: right;">
                <p style="margin: 0; font-size: 12px; color: #64748b;">TOTAL EXPENSE CLAIM</p>
                <p style="margin: 4px 0 0 0; font-size: 22px; font-weight: 800; color: #10b981;">₹${subtotal.toLocaleString('en-IN')}</p>
            </div>
        </div>

        <!-- TRANSACTIONS TABLE -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
                <tr style="background: #10b981; color: white; font-size: 13px;">
                    <th style="padding: 10px; text-align: center;">#</th>
                    <th style="padding: 10px; text-align: left;">Date</th>
                    <th style="padding: 10px; text-align: left;">Category</th>
                    <th style="padding: 10px; text-align: left;">Description</th>
                    <th style="padding: 10px; text-align: left;">Method</th>
                    <th style="padding: 10px; text-align: right;">Amount (₹)</th>
                </tr>
            </thead>
            <tbody>
                ${tableRowsHTML}
            </tbody>
        </table>

        <!-- SUMMARY & TOTALS BLOCK -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
            <div style="width: 50%;">
                <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #475569; text-transform: uppercase;">Notes / Remarks:</h4>
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px dashed #cbd5e1;">
                    This document serves as an official verified expense statement generated via SpendWise AI platform. All amounts are logged from user transaction records.
                </p>
            </div>
            <div style="width: 40%;">
                <table style="width: 100%; font-size: 13px;">
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Subtotal:</td>
                        <td style="padding: 6px 0; text-align: right; font-weight: 600;">₹${subtotal.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b;">Tax / Fees (0%):</td>
                        <td style="padding: 6px 0; text-align: right; font-weight: 600;">₹0</td>
                    </tr>
                    <tr style="border-top: 2px solid #10b981; font-size: 16px; font-weight: 800; color: #0f172a;">
                        <td style="padding: 10px 0 0 0;">Grand Total:</td>
                        <td style="padding: 10px 0 0 0; text-align: right; color: #10b981;">₹${subtotal.toLocaleString('en-IN')}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- APPROVAL & SIGNATURE FOOTER -->
        <div style="display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <div style="text-align: center; width: 200px;">
                <div style="border-bottom: 1px solid #94a3b8; height: 30px; margin-bottom: 6px;"></div>
                <p style="margin: 0; font-size: 12px; color: #64748b;">Claimant Signature</p>
            </div>
            <div style="text-align: center; width: 200px;">
                <div style="border-bottom: 1px solid #94a3b8; height: 30px; margin-bottom: 6px;"></div>
                <p style="margin: 0; font-size: 12px; color: #64748b;">Manager / Auditor Approval</p>
            </div>
        </div>
    `;

    // 4. Download PDF using html2pdf
    const opt = {
        margin:       [8, 8, 8, 8],
        filename:     `Expense_Report_${reportId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(pdfContainer).save();
}

// ==========================================
// FORMAL EXCEL / CSV EXPORT
// ==========================================
// ==========================================
// FORMAL EXCEL / CSV EXPORT (Clean Excel Format)
// ==========================================
function exportToCSV() {
    if (!allTransactions || allTransactions.length === 0) {
        alert("No transaction data available to export.");
        return;
    }

    const userName = localStorage.getItem("userName") || "User";
    const userEmail = localStorage.getItem("userEmail") || "Email";
    const reportDate = new Date().toLocaleDateString('en-IN');

    // 1. CSV Rows Array
    const rows = [];

    // Header Meta Data
    rows.push(["SPENDWISE FINANCIAL EXPENSE REPORT", "", "", "", ""]);
    rows.push(["Account Holder:", userName, "", "Report Date:", reportDate]);
    rows.push(["Account Email:", userEmail, "", "", ""]);
    rows.push([]); // Empty line for spacing

    // Column Headers
    rows.push(["S.No.", "Date", "Category", "Description", "Payment Mode", "Amount (₹)"]);

    // Table Data & Calculation
    let grandTotal = 0;

    allTransactions.forEach((tx, idx) => {
        const amt = Number(tx.amount) || 0;
        grandTotal += amt;
        
        const dateStr = tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : 'N/A';
        const category = tx.category || 'General';
        const description = tx.description || 'N/A';
        const paymentMode = tx.paymentMode || 'Online / UPI';

        rows.push([
            idx + 1,
            dateStr,
            category,
            description,
            paymentMode,
            amt
        ]);
    });

    // Summary Rows
    rows.push([]);
    rows.push(["", "", "", "", "GRAND TOTAL:", grandTotal]);

    // 2. Format rows with Proper CSV Escaping (Quotes around string fields)
    const csvContent = rows.map(row => 
        row.map(field => {
            if (field === null || field === undefined) return '""';
            const stringField = String(field).replace(/"/g, '""'); // Escape inner double quotes
            return `"${stringField}"`; // Enclose each cell value in double quotes
        }).join(",")
    ).join("\n");

    // 3. UTF-8 BOM Prefix (\uFEFF) -> Forces Excel to open with proper alignment & symbols
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // 4. Trigger Download
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SpendWise_Expense_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}