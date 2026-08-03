async function registerUser(event) {
    // Agar form submit event se call ho raha hai toh reload roko
    if (event) event.preventDefault();

    // 1. HTML inputs se data nikalna
    const userName = document.getElementById('name').value;
    const userEmail = document.getElementById('email').value;
    const userPassword = document.getElementById('New_password').value;
    const confirmPassword = document.getElementById('Confirm_password').value;

    // Basic Validation
    if (!userName || !userEmail || !userPassword) {
        alert("Please fill in all required fields.");
        return;
    }

    // 2. Check karna ki Confirm Password match ho raha hai ya nahi
    if (userPassword !== confirmPassword) {
        alert("Entered passwords do not match. Please try again.");
        return; // Code yahan ruk jayega
    }

    // 3. Data ka object banana (jo Express ko jayega)
    const dataToSend = {
        name: userName,
        email: userEmail,
        password: userPassword
    };

    try {
        // 4. Express backend par POST request bhejna (Fixed URL: /api/auth/register)
        const response = await fetch('https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        // 5. Backend ka result check karna
        const result = await response.json();

        if (response.ok) {
            alert("Account created successfully! 🚀");
            // Account banne ke baad turant login page par bhej dein
            window.location.href = "login.html"; 
        } else {
            // Updated error display (message fallback)
            alert("Registration Failed: " + (result.message || result.error || "Something went wrong"));
        }

    } catch (error) {
        console.error("Error occurred while registering user:", error);
        alert("Please check your backend server. Registration failed.");
    }
}