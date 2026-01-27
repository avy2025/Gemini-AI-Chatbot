export class ChatUI {
    constructor() {
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.charCounter = document.getElementById('charCounter');
        this.statusIndicator = document.getElementById('status');
    }

    addMessage(content, isUser = false) {
        // Remove welcome message if it exists
        const welcomeMsg = this.chatContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = isUser ? '👤' : '🤖';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = content;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.getCurrentTime();

        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(timeDiv);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);

        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();

        return textDiv;
    }

    addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing-indicator';
        typingDiv.id = 'typingIndicator';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const dots = document.createElement('div');
        dots.className = 'typing-dots';
        dots.innerHTML = '<span></span><span></span><span></span>';

        contentDiv.appendChild(dots);
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(contentDiv);

        this.chatContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    updateMessageText(messageElement, text) {
        messageElement.textContent = text;
        this.scrollToBottom();
    }

    appendToMessage(messageElement, text) {
        messageElement.textContent += text;
        this.scrollToBottom();
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <span>${message}</span>
    `;
        this.chatContainer.appendChild(errorDiv);
        this.scrollToBottom();
    }

    clearChat() {
        this.chatContainer.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-icon">🤖</div>
        <h2>Welcome to Gemini AI Chatbot</h2>
        <p>Start a conversation by typing a message below</p>
        <div class="suggested-prompts">
          <button class="prompt-btn" data-prompt="What can you help me with?">What can you help me with?</button>
          <button class="prompt-btn" data-prompt="Tell me a joke">Tell me a joke</button>
          <button class="prompt-btn" data-prompt="Explain quantum computing">Explain quantum computing</button>
        </div>
      </div>
    `;
    }

    setStatus(status, text) {
        const statusDot = this.statusIndicator.querySelector('.status-dot');
        const statusText = this.statusIndicator.querySelector('.status-text');

        statusDot.className = `status-dot ${status}`;
        statusText.textContent = text;
    }

    updateCharCounter() {
        const count = this.messageInput.value.length;
        this.charCounter.textContent = `${count}/4000`;

        if (count > 3500) {
            this.charCounter.classList.add('warning');
        } else {
            this.charCounter.classList.remove('warning');
        }
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        });
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    enableInput() {
        this.messageInput.disabled = false;
        this.sendButton.disabled = this.messageInput.value.trim().length === 0;
    }

    disableInput() {
        this.messageInput.disabled = true;
        this.sendButton.disabled = true;
    }
}
