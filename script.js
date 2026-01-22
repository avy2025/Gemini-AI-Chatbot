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
    saveCurrentSession();
}

function saveChatHistory() {
    saveCurrentSession();
}

function loadChatHistory() {
    if (currentSessionId && sessions[currentSessionId]) {
        chatBox.innerHTML = sessions[currentSessionId].messages;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

function loadSessions() {
    const saved = localStorage.getItem('chatSessions');
    if (saved) {
        sessions = JSON.parse(saved);
    }
    
    if (Object.keys(sessions).length === 0) {
        createNewSession();
    } else {
        const lastSession = localStorage.getItem('lastSessionId');
        if (lastSession && sessions[lastSession]) {
            switchSession(lastSession);
        } else {
            switchSession(Object.keys(sessions)[0]);
        }
    }
    
    renderSessionList();
}

function createNewSession() {
    const sessionId = 'session_' + Date.now();
    sessions[sessionId] = {
        id: sessionId,
        name: 'New Chat',
        messages: '<div class="message ai-msg"><div class="msg-text">Hello! Ask me anything.</div></div>',
        createdAt: Date.now()
    };
    
    saveSessions();
    switchSession(sessionId);
    renderSessionList();
}

function switchSession(sessionId) {
    if (currentSessionId) {
        saveCurrentSession();
    }
    
    currentSessionId = sessionId;
    localStorage.setItem('lastSessionId', sessionId);
    loadChatHistory();
    renderSessionList();
}

function deleteSession(sessionId) {
    if (Object.keys(sessions).length === 1) {
        alert('Cannot delete the last session');
        return;
    }
    
    if (confirm('Delete this chat session?')) {
        delete sessions[sessionId];
        saveSessions();
        
        if (currentSessionId === sessionId) {
            const newSessionId = Object.keys(sessions)[0];
            switchSession(newSessionId);
        }
        
        renderSessionList();
    }
}

function renameSession(sessionId, newName) {
    if (sessions[sessionId]) {
        sessions[sessionId].name = newName.trim() || 'New Chat';
        saveSessions();
        renderSessionList();
    }
}

function saveCurrentSession() {
    if (currentSessionId && sessions[currentSessionId]) {
        sessions[currentSessionId].messages = chatBox.innerHTML;
        
        const lastMsg = chatBox.querySelector('.message:last-child .msg-text');
        if (lastMsg) {
            const preview = lastMsg.textContent.substring(0, 30);
            sessions[currentSessionId].preview = preview;
        }
        
        saveSessions();
    }
}

function saveSessions() {
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
}

function renderSessionList() {
    sessionList.innerHTML = '';
    
    const sortedSessions = Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt);
    
    sortedSessions.forEach(session => {
        const item = document.createElement('div');
        item.className = 'session-item' + (session.id === currentSessionId ? ' active' : '');
        item.onclick = () => switchSession(session.id);
        
        const name = document.createElement('div');
        name.className = 'session-name';
        name.textContent = session.name;
        name.ondblclick = (e) => {
            e.stopPropagation();
            makeEditable(name, session.id);
        };
        
        const preview = document.createElement('div');
        preview.className = 'session-preview';
        preview.textContent = session.preview || 'New conversation';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-session';
        deleteBtn.textContent = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteSession(session.id);
        };
        
        item.appendChild(name);
        item.appendChild(preview);
        item.appendChild(deleteBtn);
        sessionList.appendChild(item);
    });
}

function makeEditable(nameElement, sessionId) {
    const currentName = nameElement.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'session-name-input';
    input.value = currentName;
    
    input.onblur = () => {
        renameSession(sessionId, input.value);
    };
    
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            input.blur();
        } else if (e.key === 'Escape') {
            renderSessionList();
        }
    };
    
    nameElement.parentElement.onclick = (e) => e.stopPropagation();
    nameElement.replaceWith(input);
    input.focus();
    input.select();
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

function initVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            stopListening();
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopListening();
            if (event.error === 'not-allowed') {
                alert('Microphone access denied. Please allow microphone access.');
            }
        };
        
        recognition.onend = () => {
            stopListening();
        };
    } else {
        voiceBtn.style.display = 'none';
    }
}

function toggleVoiceInput() {
    if (!recognition) {
        alert('Voice input is not supported in your browser');
        return;
    }
    
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
}

function startListening() {
    try {
        recognition.start();
        isListening = true;
        voiceBtn.classList.add('listening');
        userInput.placeholder = 'Listening...';
    } catch (error) {
        console.error('Error starting recognition:', error);
    }
}

function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
    }
    isListening = false;
    voiceBtn.classList.remove('listening');
    userInput.placeholder = 'Type a message...';
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