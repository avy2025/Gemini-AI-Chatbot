const API_KEY = CONFIG.GEMINI_API_KEY;
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

userInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

function addMessage(text, isUser) {
    const msgDiv = document.createElement("div");
    msgDiv.className = isUser ? "message user-msg" : "message ai-msg";
    
    const textDiv = document.createElement("div");
    textDiv.className = "msg-text";
    textDiv.textContent = text;
    
    msgDiv.appendChild(textDiv);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showLoading() {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "message ai-msg";
    loadingDiv.id = "loading";
    loadingDiv.innerHTML = '<div class="msg-text loading">Typing...</div>';
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById("loading");
    if (loading) loading.remove();
}

function clearChat() {
    chatBox.innerHTML = '<div class="message ai-msg"><div class="msg-text">Hello! Ask me anything.</div></div>';
}

async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;

    if (API_KEY === "YOUR_API_KEY_HERE") {
        alert("Please add your API key in the code!");
        return;
    }

    addMessage(message, true);
    userInput.value = "";
    sendBtn.disabled = true;
    showLoading();

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + API_KEY,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ 
                        role: "user", 
                        parts: [{ text: message }] 
                    }]
                })
            }
        );

        const data = await response.json();
        removeLoading();

        if (data.candidates && data.candidates.length > 0) {
            const reply = data.candidates[0].content.parts[0].text;
            addMessage(reply, false);
        } else {
            addMessage("Sorry, I couldn't generate a response.", false);
        }
    } catch (error) {
        removeLoading();
        addMessage("Error: Could not connect to AI.", false);
        console.error(error);
    }

    sendBtn.disabled = false;
    userInput.focus();
}