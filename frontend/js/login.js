async function loginUser() {
    // 1. Input tag se email aur password nikalna
    const userEmail = document.getElementById('email').value;
    const userPassword = document.getElementById('password').value;

    // Validation
    if (!userEmail || !userPassword) {
        alert("Please enter both email and password.");
        return;
    }

    // 2. Data pack karna
    const dataToSend = {
        email: userEmail,
        password: userPassword
    };

    try {
        // 3. Backend ki LOGIN API par data bhejna (Live URL)
        const response = await fetch('https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        // 4. Backend se aaya jawab padhna
        const result = await response.json();

        // 5. Agar login successful hua
        if (response.ok) {
            // Token aur User Details Save Karein
            if (result.token) {
                localStorage.setItem("token", result.token);
            }
            if (result.user) {
                localStorage.setItem("currentUserId", result.user.id || result.user._id);
                localStorage.setItem("userEmail", result.user.email);
            }

            alert("Login Successful! 🚀");
            // Pages subfolder ke andar redirection
            window.location.href = "dashboard.html"; 
        } else {
            // Error Message Show Karein
            alert("Login Failed: " + (result.message || result.error || "Invalid Credentials"));
        }

    } catch (error) {
        console.error("Error occurred while logging in:", error);
        alert("Server error. Please check your internet or backend status.");
    }
}

// Event Listener ko attach karein taaki form submit par login trigger ho
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loginUser();
        });
    }
});