const API_KEY = CONFIG.GEMINI_API_KEY;
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Load saved chat history on page load
window.addEventListener('DOMContentLoaded', function() {
    loadChatHistory();
    loadDarkMode();
});

userInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

// Character counter
userInput.addEventListener('input', function() {
    const charCount = document.getElementById('charCount');
    const length = this.value.length;
    charCount.textContent = `${length}/500`;
    
    if (length > 500) {
        charCount.style.color = 'red';
    } else {
        charCount.style.color = '';
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
    
    // Save chat history after each message
    saveChatHistory();
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
    saveChatHistory();
}

function saveChatHistory() {
    localStorage.setItem('geminiChatHistory', chatBox.innerHTML);
}

function loadChatHistory() {
    const savedChat = localStorage.getItem('geminiChatHistory');
    if (savedChat) {
        chatBox.innerHTML = savedChat;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    // Change button emoji
    const btn = document.querySelector('.dark-mode-toggle');
    btn.textContent = isDark ? '☀️' : '🌙';
}

function loadDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        const btn = document.querySelector('.dark-mode-toggle');
        btn.textContent = '☀️';
    }
}

function askQuestion(question) {
    userInput.value = question;
    sendMessage();
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
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY,
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

        if (!response.ok) {
            addMessage("API Error: " + (data.error?.message || response.statusText), false);
            return;
        }

        if (data.candidates && data.candidates.length > 0) {
            const reply = data.candidates[0].content.parts[0].text;
            addMessage(reply, false);
        } else {
            addMessage("Sorry, I couldn't generate a response.", false);
        }
    } catch (error) {
        removeLoading();
        console.error("Error:", error);
        addMessage("Error: " + error.message, false);
    }

    sendBtn.disabled = false;
    userInput.focus();
}