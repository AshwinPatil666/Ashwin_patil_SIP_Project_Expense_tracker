// ==========================================
// SPENDWISE LOGIN LOGIC (RENDER BACKEND)
// ==========================================

const RENDER_API = "https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/auth/login";

async function loginUser(event) {
    if (event) event.preventDefault();

    const userEmail = document.getElementById('email')?.value?.trim();
    const userPassword = document.getElementById('password')?.value;

    if (!userEmail || !userPassword) {
        alert("Please enter both email and password.");
        return;
    }

    const submitBtn = document.querySelector("#login-Form button[type='submit']") || document.querySelector("button");
    const originalText = submitBtn ? submitBtn.innerText : "Login";
    if (submitBtn) {
        submitBtn.innerText = "Connecting to Render... ⏳";
        submitBtn.disabled = true;
    }

    try {
        const response = await fetch(RENDER_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, password: userPassword })
        });

        const result = await response.json();

        if (response.ok) {
            const userId = result.user?.id || result.user?._id || "user_123";
            const userName = result.user?.name || userEmail.split('@')[0];

            localStorage.setItem("token", result.token || "mock_token");
            localStorage.setItem("currentUserId", userId);
            localStorage.setItem("userId", userId);
            localStorage.setItem("userName", userName);
            localStorage.setItem("userEmail", userEmail);

            alert("Login Successful! 🚀 Redirecting...");

            if (window.location.pathname.includes('/pages/')) {
                window.location.href = "dashboard.html";
            } else {
                window.location.href = "pages/dashboard.html";
            }
        } else {
            alert("Login Failed: " + (result.message || result.error || "Invalid Credentials"));
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Render server waking up or unreachable. Testing fallback activated.");

        localStorage.setItem("currentUserId", "user_123");
        localStorage.setItem("userId", "user_123");
        localStorage.setItem("userName", "Ashwin Patil");
        localStorage.setItem("userEmail", userEmail || "ashwin@example.com");

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

window.loginUser = loginUser;

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-Form");
    if (loginForm) loginForm.addEventListener("submit", loginUser);
});