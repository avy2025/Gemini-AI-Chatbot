import chatAPI from './api.js';
import { ChatUI } from './ui.js';

class ChatApp {
    constructor() {
        this.ui = new ChatUI();
        this.isStreaming = false;
        this.theme = localStorage.getItem('theme') || 'light';

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyTheme();
        this.adjustTextareaHeight();
    }

    setupEventListeners() {
        // Send message
        this.ui.sendButton.addEventListener('click', () => this.handleSendMessage());

        // Enter to send (Shift+Enter for new line)
        this.ui.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Auto-resize textarea
        this.ui.messageInput.addEventListener('input', () => {
            this.adjustTextareaHeight();
            this.ui.updateCharCounter();
            this.ui.sendButton.disabled = this.ui.messageInput.value.trim().length === 0;
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Clear chat
        document.getElementById('clearChat').addEventListener('click', () => {
            this.clearChat();
        });

        // Export chat
        document.getElementById('exportChat').addEventListener('click', () => {
            this.exportChat();
        });

        // Suggested prompts
        this.ui.chatContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('prompt-btn')) {
                const prompt = e.target.dataset.prompt;
                this.ui.messageInput.value = prompt;
                this.handleSendMessage();
            }
        });
    }

    async handleSendMessage() {
        const message = this.ui.messageInput.value.trim();

        if (!message || this.isStreaming) return;

        // Add user message to UI
        this.ui.addMessage(message, true);
        this.ui.messageInput.value = '';
        this.adjustTextareaHeight();
        this.ui.updateCharCounter();
        this.ui.disableInput();
        this.ui.setStatus('loading', 'Thinking...');

        try {
            // Use streaming for better UX
            await this.streamResponse(message);
        } catch (error) {
            console.error('Send message error:', error);
            this.ui.removeTypingIndicator();
            this.ui.showError('Failed to get response. Please try again.');
            this.ui.setStatus('error', 'Error');
        } finally {
            this.ui.enableInput();
            this.ui.setStatus('ready', 'Ready');
            this.isStreaming = false;
        }
    }

    async streamResponse(message) {
        this.isStreaming = true;
        let messageElement = null;
        let fullResponse = '';

        await chatAPI.streamMessage(
            message,
            // onChunk
            (chunk) => {
                if (!messageElement) {
                    messageElement = this.ui.addMessage('', false);
                }
                fullResponse += chunk;
                this.ui.updateMessageText(messageElement, fullResponse);
            },
            // onComplete
            (sessionId) => {
                console.log('Streaming complete', sessionId);
            },
            // onError
            (error) => {
                throw error;
            }
        );
    }

    async clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            await chatAPI.clearHistory();
            this.ui.clearChat();
            this.ui.setStatus('ready', 'Ready');
        }
    }

    exportChat() {
        const messages = Array.from(this.ui.chatContainer.querySelectorAll('.message'));
        const chatHistory = messages.map(msg => {
            const isUser = msg.classList.contains('user-message');
            const text = msg.querySelector('.message-text').textContent;
            const time = msg.querySelector('.message-time')?.textContent || '';
            return `[${time}] ${isUser ? 'You' : 'AI'}: ${text}`;
        }).join('\n\n');

        const blob = new Blob([chatHistory], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.theme);
    }

    adjustTextareaHeight() {
        const textarea = this.ui.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});
