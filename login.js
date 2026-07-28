async function sendData() {
            // 1. Input tag ke andar jo likha hai, usko ID ke zariye nikalna
            const userEmail = document.getElementById('email').value;
            const userPassword = document.getElementById('password').value;

            // Agar fields khali hain toh rok do
            if(!userEmail || !userPassword) {
                alert("Pehle email aur password bhariye!");
                return;
            }

            // 2. Data ko ek object me pack karna
            const dataToSend = {
                email: userEmail,
                password: userPassword
            };

            try {
                // 3. Express Backend (port 5000) ko data bhejna
                const response = await fetch('http://localhost:5000/api/register', {
                    method: 'POST', // Kyunki hum data bhej rahe hain
                    headers: {
                        'Content-Type': 'application/json' // Express ko bata rahe hain ki data JSON format me hai
                    },
                    body: JSON.stringify(dataToSend) // Data ko string me convert karke bheja
                });

                // 4. Express se wapas aaya hua jawab (response) padhna
                const result = await response.json();

                if(response.ok) {
                    alert("Success: " + result.message); // Data save ho gaya
                } else {
                    alert("Error: " + result.error);
                }

            } catch (error) {
                console.error("Backend se connect nahi ho paya:", error);
                alert("Server se connection fail ho gaya. Kya Express chalu hai?");
            }
        }       