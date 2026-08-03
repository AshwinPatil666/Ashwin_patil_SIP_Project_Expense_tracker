// ==========================================
// SPENDWISE REGISTRATION LOGIC (RENDER BACKEND)
// ==========================================

const RENDER_API = "https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/auth/register";

async function registerUser(event) {
    if (event) event.preventDefault();

    // 1. Get input values matching your HTML IDs
    const userName = document.getElementById('name')?.value?.trim();
    const userEmail = document.getElementById('email')?.value?.trim();
    const userPassword = document.getElementById('New_password')?.value;
    const confirmPassword = document.getElementById('Confirm_password')?.value;

    // 2. Validation Checks
    if (!userName || !userEmail || !userPassword) {
        alert("Please fill in all fields (Name, Email, Password).");
        return;
    }

    if (userPassword !== confirmPassword) {
        alert("Passwords do not match! Please check and try again.");
        return;
    }

    // 3. UI Button Loading Feedback
    const submitBtn = document.querySelector("button[type='submit']");
    const originalText = submitBtn ? submitBtn.innerText : "Create Account";
    if (submitBtn) {
        submitBtn.innerText = "Connecting to Render... ⏳";
        submitBtn.disabled = true;
    }

    try {
        const response = await fetch(RENDER_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: userName, email: userEmail, password: userPassword })
        });

        const result = await response.json();

        if (response.ok) {
            const userId = result.user?.id || result.user?._id || "user_123";

            localStorage.setItem("token", result.token || "mock_token");
            localStorage.setItem("currentUserId", userId);
            localStorage.setItem("userId", userId);
            localStorage.setItem("userName", userName);
            localStorage.setItem("userEmail", userEmail);

            alert("Registration Successful! 🎉 Welcome to SpendWise.");

            if (window.location.pathname.includes('/pages/')) {
                window.location.href = "dashboard.html";
            } else {
                window.location.href = "pages/dashboard.html";
            }
        } else {
            alert("Registration Failed: " + (result.message || result.error || "User already exists"));
        }
    } catch (error) {
        console.error("Register Error:", error);
        alert("Render server waking up or unreachable. Testing fallback activated.");

        localStorage.setItem("currentUserId", "user_123");
        localStorage.setItem("userId", "user_123");
        localStorage.setItem("userName", userName);
        localStorage.setItem("userEmail", userEmail);

        if (window.location.pathname.includes('/pages/')) {
            window.location.href = "dashboard.html";
        } else {
            window.location.href = "pages/dashboard.html";
        }
    } finally {
        if (submitBtn) {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    }
}

window.registerUser = registerUser;