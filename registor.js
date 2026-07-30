async function registerUser() {
    // 1. HTML inputs se data nikalna
    const userName = document.getElementById('name').value;
    const userEmail = document.getElementById('email').value;
    const userPassword = document.getElementById('New_password').value;
    const confirmPassword = document.getElementById('Confirm_password').value;

    // 2. Check karna ki Confirm Password match ho raha hai ya nahi
    if (userPassword !== confirmPassword) {
        alert("Aapke dono passwords match nahi ho rahe hain. Kripya wapas check karein!");
        return; // Ye code ko yahin rok dega
    }

    // 3. Data ka object banana (jo Express ko jayega)
    const dataToSend = {
        name: userName,
        email: userEmail,
        password: userPassword
    };

    try {
        // 4. Express backend par POST request bhejna
        const response = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        // 5. Backend ka result check karna
        const result = await response.json();

        if (response.ok) {
            alert("Account successfully ban gaya!");
            // Account banne ke baad turant login page par bhej dein
            window.location.href = "login.html"; 
        } else {
            alert("Error: " + result.error);
        }

    } catch (error) {
        console.error("Backend connection error:", error);
        alert("Server se connection fail ho gaya. Kya aapka Express chalu hai?");
    }
}