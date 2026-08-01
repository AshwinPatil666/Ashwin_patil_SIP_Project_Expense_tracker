async function loginUser() {
    // 1. Input tag se email aur password nikalna
    const userEmail = document.getElementById('email').value;
    const userPassword = document.getElementById('password').value;

    // 2. Data pack karna
    const dataToSend = {
        email: userEmail,
        password: userPassword
    };

    try {
        // 3. Backend ki LOGIN API par data bhejna (Dhyan dein: URL me /api/login hai)
        const response = await fetch('http://localhost:5000/api/login', {
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
          
         localStorage.setItem("currentUserId", result.userId);
         localStorage.setItem("userEmail", userEmail);
            // Login hote hi seedha dashboard par bhej do
            window.location.href = "dashboard.html"; 
        } else {
            // Agar email nahi mila ya password galat hua toh alert dikhayega
            alert("Login Faile: " + result.error);
        }

    } catch (error) {
        console.error("Error occurred while logging in:", error);
        alert("Please check your backend server. Login failed.");
    }
}
// Login hone ke baad

