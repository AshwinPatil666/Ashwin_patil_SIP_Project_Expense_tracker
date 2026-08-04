// ==========================================
// SPENDWISE LOGIN LOGIC
// ==========================================

const RENDER_API =
    "https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/auth/login";

async function loginUser(event) {
    if (event) event.preventDefault();

    const userEmail = document.getElementById("email")?.value.trim();
    const userPassword = document.getElementById("password")?.value;

    if (!userEmail || !userPassword) {
        alert("Please enter both email and password.");
        return;
    }

    const submitBtn =
        document.querySelector("#login-Form button[type='submit']");

    const originalText = submitBtn?.innerText || "Sign In";

    if (submitBtn) {
        submitBtn.innerText = "Connecting to Render... ⏳";
        submitBtn.disabled = true;
    }

    try {
        const response = await fetch(RENDER_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: userEmail,
                password: userPassword
            })
        });

        const result = await response.json();

        console.log("Login response:", result);

        if (!response.ok) {
            alert(
                "Login Failed: " +
                (result.message || result.error || "Invalid Credentials")
            );
            return;
        }

        // ==============================
        // JWT MUST EXIST
        // ==============================

        if (!result.token) {
            console.error("JWT missing:", result);

            alert(
                "Login failed: Backend did not return authentication token."
            );

            return;
        }

        const userId =
            result.user?.id ||
            result.user?._id;

        const userName =
            result.user?.name ||
            userEmail.split("@")[0];

        // ==============================
        // SAVE AUTH DATA
        // ==============================

        localStorage.setItem("token", result.token);

        if (userId) {
            localStorage.setItem("currentUserId", userId);
            localStorage.setItem("userId", userId);
        }

        localStorage.setItem("userName", userName);
        localStorage.setItem("userEmail", userEmail);

        console.log("JWT saved successfully");

        alert("Login Successful! 🚀");

        // ==============================
        // REDIRECT
        // ==============================

        if (window.location.pathname.includes("/pages/")) {
            window.location.href = "dashboard.html";
        } else {
            window.location.href = "pages/dashboard.html";
        }

    } catch (error) {

        console.error("Login Error:", error);

        alert(
            "Unable to connect to server. Please try again."
        );

    } finally {

        if (submitBtn) {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    }
}

window.loginUser = loginUser;

document.addEventListener("DOMContentLoaded", () => {

    const loginForm =
        document.getElementById("login-Form");

    if (loginForm) {
        loginForm.addEventListener("submit", loginUser);
    }

});