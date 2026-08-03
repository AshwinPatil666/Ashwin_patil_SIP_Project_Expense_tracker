// ==========================================
// GLOBAL AI CHATBOT WIDGET (All Pages)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Inject Chat HTML structure into the body dynamically
    const chatWidgetHTML = `
        <div id="spendwise-chat-container" style="position: fixed; bottom: 25px; right: 25px; z-index: 9999; font-family: 'Poppins', sans-serif;">
            <!-- Floating Toggle Button -->
            <button id="chat-toggle-btn" style="background: #18852c; color: white; border: none; width: 60px; height: 60px; border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 24px; transition: transform 0.2s;">
                💬
            </button>

            <!-- Chat Popup Box (Hidden by default) -->
            <div id="chat-popup-box" style="display: none; position: absolute; bottom: 75px; right: 0; width: 350px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; flex-direction: column; overflow: hidden;">
                <!-- Header -->
                <div style="background: #18852c; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 1rem; display: flex; align-items: center; gap: 8px;">🤖 SpendWise AI</h3>
                    <button id="chat-close-btn" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">&times;</button>
                </div>

                <!-- Chat Messages Body -->
                <div id="global-chat-box" style="height: 300px; padding: 15px; overflow-y: auto; background: #f8fafc; display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem;">
                    <div style="background: #e0f2fe; color: #0369a1; padding: 10px 14px; border-radius: 10px; max-width: 85%;">
                        Hello! I am your AI financial assistant. Ask me anything about your expenses or budget!
                    </div>
                </div>

                <!-- Input Footer -->
                <div style="padding: 12px; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; gap: 8px;">
                    <input type="text" id="global-chat-input" placeholder="Type a message..." style="flex: 1; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; font-size: 0.9rem;">
                    <button id="global-send-btn" style="background: #18852c; color: white; border: none; padding: 0 16px; border-radius: 8px; font-weight: 600; cursor: pointer;">Send</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatWidgetHTML);

    // 2. Toggle Logic
    const toggleBtn = document.getElementById("chat-toggle-btn");
    const closeBtn = document.getElementById("chat-close-btn");
    const popupBox = document.getElementById("chat-popup-box");
    const sendBtn = document.getElementById("global-send-btn");
    const chatInput = document.getElementById("global-chat-input");
    const chatBox = document.getElementById("global-chat-box");

    toggleBtn.addEventListener("click", () => {
        popupBox.style.display = popupBox.style.display === "flex" ? "none" : "flex";
        if (popupBox.style.display === "flex") {
            chatInput.focus();
        }
    });

    closeBtn.addEventListener("click", () => {
        popupBox.style.display = "none";
    });

    // 3. Send Message Logic with User Context
    sendBtn.addEventListener("click", () => sendGlobalMessage());
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendGlobalMessage();
    });

   async function sendGlobalMessage() {
    const query = chatInput.value.trim();
    if (!query) return;

    appendMsg(query, "user");
    chatInput.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    const loadingId = appendMsg("Thinking...", "ai");

    try {
        const userId = localStorage.getItem("currentUserId");
        const userEmail = localStorage.getItem("userEmail") || "User";
        const totalBudget = localStorage.getItem("spendwise_monthly_budget") || 50000;

        // Fetch MongoDB Data for Context
        let txns = [];
        if (userId) {
            try {
                const res = await fetch(`https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/expenses/${userId}`);
                if (res.ok) txns = await res.json();
            } catch (e) {
                console.warn("Could not fetch user expense context:", e);
            }
        }

        // Send request to Express backend (NO apiKey variable needed here!)
        const response = await fetch("https://ashwin-patil-sip-project-expense-tracker.onrender.com/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: query,
                userEmail: userEmail,
                totalBudget: totalBudget,
                transactions: txns
            })
        });

        const data = await response.json();

        if (response.ok && data.reply) {
            updateMsg(loadingId, data.reply);
        } else {
            updateMsg(loadingId, data.error || "Sorry, I couldn't process that right now.");
        }
    } catch (err) {
        console.error("Chat Error:", err);
        updateMsg(loadingId, "Connection error with SpendWise backend.");
    }
}

    function appendMsg(text, sender) {
        const div = document.createElement("div");
        const id = 'msg-' + Math.random().toString(36).substring(2, 7);
        div.id = id;
        if (sender === "user") {
            div.style.cssText = "background: #18852c; color: white; padding: 8px 12px; border-radius: 8px; max-width: 85%; align-self: flex-end; word-break: break-word;";
        } else {
            div.style.cssText = "background: #e0f2fe; color: #0369a1; padding: 8px 12px; border-radius: 8px; max-width: 85%; align-self: flex-start; word-break: break-word;";
        }
        div.innerText = text;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
        return id;
    }

    function updateMsg(id, text) {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = text;
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }
});