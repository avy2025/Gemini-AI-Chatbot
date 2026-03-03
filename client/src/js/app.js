/**
 * app.js
 * Application entry point.
 * Orchestrates: ChatUI (ui.js), ChatAPI (api.js), Storage (storage.js).
 * Keeps framework-free ES6+ class-based architecture.
 */

import chatAPI from './api.js';
import { ChatUI, MAX_CHARS } from './ui.js';
import {
    initStorage,
    saveMessage,
    loadAllMessages,
    clearAllMessages,
    exportMessages,
    importMessages,
} from './storage.js';

class ChatApp {
    constructor() {
        this.ui = new ChatUI();
        this.isStreaming = false;
        this.theme = localStorage.getItem('theme') || 'light';

        this.init();
    }

    async init() {
        this.applyTheme();
        this.adjustTextareaHeight();

        // Initialise persistent storage before rendering
        await initStorage();
        await this.loadHistory();

        // Wire up all user interactions only after storage is ready
        this.setupEventListeners();
    }

    /* ───────────────────────────────────────────
       Event listeners
    ─────────────────────────────────────────── */

    setupEventListeners() {
        // ── Send message ──
        this.ui.sendButton.addEventListener('click', () => this.handleSendMessage());

        // Enter = send, Shift+Enter = new line
        this.ui.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Live char counter + auto-resize textarea
        this.ui.messageInput.addEventListener('input', () => {
            this.adjustTextareaHeight();
            this.ui.updateCharCounter();
        });

        // ── Header actions ──
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('clearChat').addEventListener('click', () => this.clearChat());
        document.getElementById('exportChat').addEventListener('click', () => this.exportChat());

        // ── Import: trigger hidden file input ──
        document.getElementById('importChat').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.importChat(file);
            // Reset so the same file can be picked again
            e.target.value = '';
        });

        // ── Suggested prompts (delegated) ──
        this.ui.chatContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('prompt-btn')) {
                this.ui.messageInput.value = e.target.dataset.prompt;
                this.ui.updateCharCounter();
                this.adjustTextareaHeight();
                this.handleSendMessage();
            }
        });
    }

    /* ───────────────────────────────────────────
       Messaging
    ─────────────────────────────────────────── */

    async handleSendMessage() {
        const message = this.ui.messageInput.value.trim();

        // Guard: empty, over-limit, or mid-stream
        if (!message || message.length > MAX_CHARS || this.isStreaming) return;

        const timeLabel = this.ui.getCurrentTime();

        // Add user message to UI and persist it
        this.ui.addMessage(message, true, timeLabel);
        await saveMessage('user', message, timeLabel);

        // Reset input
        this.ui.messageInput.value = '';
        this.adjustTextareaHeight();
        this.ui.updateCharCounter();
        this.ui.disableInput();

        // Show typing indicator immediately
        this.ui.addTypingIndicator();
        this.ui.setStatus('loading', 'Thinking…');

        try {
            await this.streamResponse(message);
        } catch (error) {
            console.error('Send message error:', error);
            // Always remove typing indicator even on failure
            this.ui.removeTypingIndicator();
            this.ui.showError('Failed to get a response. Please try again.');
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
            // onChunk: first chunk → replace typing indicator with message bubble
            (chunk) => {
                if (!messageElement) {
                    this.ui.removeTypingIndicator();
                    messageElement = this.ui.addMessage('', false);
                }
                fullResponse += chunk;
                this.ui.updateMessageText(messageElement, fullResponse);
            },
            // onComplete: persist the full AI response
            async (sessionId) => {
                console.log('Stream complete. sessionId:', sessionId);
                if (fullResponse) {
                    const timeLabel = this.ui.getCurrentTime();
                    await saveMessage('ai', fullResponse, timeLabel);
                }
            },
            // onError: propagate so the outer try/catch handles UI
            (error) => { throw error; }
        );
    }

    /* ───────────────────────────────────────────
       History: load on startup
    ─────────────────────────────────────────── */

    async loadHistory() {
        const messages = await loadAllMessages();
        if (messages.length === 0) return; // keep welcome screen

        for (const msg of messages) {
            this.ui.addMessage(msg.content, msg.role === 'user', msg.timeLabel);
        }
    }

    /* ───────────────────────────────────────────
       History: clear / export / import
    ─────────────────────────────────────────── */

    async clearChat() {
        if (!confirm('Are you sure you want to clear the chat history?')) return;

        try {
            await chatAPI.clearHistory();    // clear server-side session too
            await clearAllMessages();        // clear IndexedDB / localStorage
            this.ui.clearChat();
            this.ui.setStatus('ready', 'Ready');
        } catch (err) {
            console.error('Clear chat error:', err);
            this.ui.showError('Failed to clear chat history.');
        }
    }

    async exportChat() {
        try {
            await exportMessages();
        } catch (err) {
            console.error('Export error:', err);
            this.ui.showError('Failed to export chat. Please try again.');
        }
    }

    async importChat(file) {
        try {
            const messages = await importMessages(file);
            // Replay imported messages into the UI
            this.ui.clearChat();
            for (const msg of messages) {
                this.ui.addMessage(msg.content, msg.role === 'user', msg.timeLabel);
            }
        } catch (err) {
            console.error('Import error:', err);
            this.ui.showError(`Import failed: ${err.message}`);
        }
    }

    /* ───────────────────────────────────────────
       Theme
    ─────────────────────────────────────────── */

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.theme);
    }

    /* ───────────────────────────────────────────
       Utilities
    ─────────────────────────────────────────── */

    adjustTextareaHeight() {
        const ta = this.ui.messageInput;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 150) + 'px';
    }
}

// Bootstrap when DOM is ready
document.addEventListener('DOMContentLoaded', () => { new ChatApp(); });
