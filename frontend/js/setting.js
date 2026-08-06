// ==========================================
// 1. INITIALIZATION & DATA LOADING
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // A. Authentication check
    const userId = localStorage.getItem("currentUserId");
    if (!userId) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    // B. Display user email on profile header
    const savedEmail = localStorage.getItem("userEmail");
    const emailSpan = document.getElementById("user-display-email");
    if (savedEmail && emailSpan) {
        emailSpan.innerText = `👤 ${savedEmail}`;
    }

    // C. Load existing settings data into form fields
    loadUserSettings();
});

// ==========================================
// 2. LOAD USER SETTINGS DATA
// ==========================================
function loadUserSettings() {
    const savedName = localStorage.getItem("userName") || "";
    const savedEmail = localStorage.getItem("userEmail") || "";
    const savedCurrency = localStorage.getItem("spendwise_currency") || "INR";
    const emailNotifStatus = localStorage.getItem("spendwise_email_notif");

    // Populate inputs if they exist
    const nameInput = document.getElementById("setting-name");
    const emailInput = document.getElementById("setting-email");
    const currencySelect = document.getElementById("currency-select");
    const notifCheckbox = document.getElementById("email-notif");

    if (nameInput) nameInput.value = savedName;
    if (emailInput) emailInput.value = savedEmail;
    if (currencySelect) currencySelect.value = savedCurrency;
    
    if (notifCheckbox) {
        notifCheckbox.checked = emailNotifStatus !== "false"; // default true
    }
}

// ==========================================
// 3. UPDATE PROFILE DETAILS
// ==========================================
async function updateProfile() {
    const nameInput = document.getElementById("setting-name");
    const newName = nameInput?.value.trim();
    const token = localStorage.getItem("token");

    if (!newName) {
        alert("Name cannot be empty!");
        return;
    }

    if (!token) {
        alert("Please login again.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(
            "https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/auth/profile",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newName
                })
            }
        );

        const data = await response.json();

        console.log("Profile Update:", response.status, data);

        if (!response.ok) {
            throw new Error(data.message || "Profile update failed");
        }

        // LocalStorage sync
        localStorage.setItem("userName", data.user.name);

        alert("Profile updated successfully!");

        // Dashboard name immediately update hoga
        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Profile Update Error:", error);
        alert(error.message);
    }
}
// ==========================================
// 4. UPDATE PASSWORD
// ==========================================
async function updatePassword() {
    const currentPasswordInput = document.getElementById("current-password");
    const newPasswordInput = document.getElementById("new-password");

const currentPassword = currentPasswordInput?.value || "";
const newPassword = newPasswordInput?.value || "";
    const userId = localStorage.getItem("currentUserId");

    if (!currentPassword || !newPassword) {
        alert("Please fill in both password fields!");
        return;
    }

    if (newPassword.length < 6) {
        alert("New password must be at least 6 characters long.");
        return;
    }

    try {
        // Backend API call to update password in MongoDB
        const response = await fetch('https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/users/update-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, currentPassword, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Password updated successfully!");
            currentPasswordInput.value = "";
            newPasswordInput.value = "";
        } else {
            alert(data.message || "Failed to update password. Check your current password.");
        }
    } catch (error) {
        console.error("Error updating password:", error);
        alert("Server error. Please try again later.");
    }
}

// ==========================================
// 5. SAVE PREFERENCES (Currency & Notifications)
// ==========================================
function savePreferences() {
    const currencySelect = document.getElementById("currency-select");
    const notifCheckbox = document.getElementById("email-notif");

    const selectedCurrency = currencySelect ? currencySelect.value : "INR";
    const isEmailNotifEnabled = notifCheckbox ? notifCheckbox.checked : true;

    // Save preferences in localStorage so other pages (Dashboard, Expenses, Budget) can use them
    localStorage.setItem("spendwise_currency", selectedCurrency);
    localStorage.setItem("spendwise_email_notif", isEmailNotifEnabled);

    alert("Preferences saved successfully!");
}

// ==========================================
// 6. LOGOUT FUNCTION
// ==========================================
function logoutUser() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("token");
        localStorage.removeItem("currentUserId");
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");

        window.location.href = "login.html";
    }
}