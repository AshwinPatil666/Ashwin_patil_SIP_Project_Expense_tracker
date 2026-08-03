// js/sidebar.js
document.addEventListener("DOMContentLoaded", () => {
    const sidebarHTML = `
    <aside class="sidebar">
        <div class="logo">
             <img src="../src/logo.jpeg" alt="SpendWise Logo">
        </div>
        <ul class="menu">
            <li><a href="dashboard.html"><i class="fa-solid fa-house"></i>Dashboard</a></li>
            <li><a href="expense.html"><i class="fa-solid fa-wallet"></i> Expenses</a></li>
            <li><a href="budget.html"><i class="fa-solid fa-chart-column"></i> Budget</a></li>
            <li><a href="ai_insight.html"><i class="fa-solid fa-robot"></i> AI Insights</a></li>
            <li><a href="ocr.html"><i class="fa-solid fa-camera"></i> OCR Scanner</a></li>
            <li><a href="report.html"><i class="fa-solid fa-file-lines"></i> Reports</a></li>
            <li><a href="setting.html"><i class="fa-solid fa-gear"></i> Settings</a></li>
            <li><a href="login.html"><i class="fa-solid fa-right-from-bracket"></i> Logout</a></li>
        </ul>
    </aside>
    `;

    // Jiss bhi page par class="dashboard" hai, uske andar sidebar sabse pehle daal do
    const dashboardContainer = document.querySelector(".dashboard");
    if (dashboardContainer) {
        dashboardContainer.insertAdjacentHTML("afterbegin", sidebarHTML);
    }
});