/**
 * ui.js
 * Handles all DOM manipulation and UI state management.
 * Imports: formatter.js for rich message rendering.
 */

import { formatMessage } from './formatter.js';

/** Maximum allowed characters in the input. */
export const MAX_CHARS = 2000;
/** Threshold at which the counter shows a warning colour. */
const WARN_THRESHOLD = 1800;

export class ChatUI {
    constructor() {
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.charCounter = document.getElementById('charCounter');
        this.statusIndicator = document.getElementById('status');
        this.chatSearch = document.getElementById('chatSearch');
        this.voiceButton = document.getElementById('voiceButton');
        this.attachButton = document.getElementById('attachButton');
        this.imageInput = document.getElementById('imageInput');
        this.imagePreviewContainer = document.getElementById('imagePreviewContainer');

        // Sync HTML maxlength attribute with the constant
        this.messageInput.setAttribute('maxlength', MAX_CHARS);
        this.charCounter.textContent = `0/${MAX_CHARS}`;
    }

    /* ───────────────────────────────────────────
       Message rendering
    ─────────────────────────────────────────── */

    /**
     * Creates and appends a chat message bubble.
     * @param {string} content     - Raw text content
     * @param {boolean} isUser     - True for user messages
     * @param {string} [timeLabel] - Optional timestamp string (for history replay)
     * @returns {HTMLElement}       The .message-text element (for streaming updates)
     */
    addMessage(content, isUser = false, timeLabel = null) {
        // Remove welcome screen on first real message
        const welcome = this.chatContainer.querySelector('.welcome-message');
        if (welcome) welcome.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        messageDiv.setAttribute('role', 'listitem');

        // Avatar
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = isUser ? '👤' : '🤖';

        // Content wrapper
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        // Text bubble
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';

        if (content) {
            // User messages are plain text; AI messages get rich formatting
            if (isUser) {
                textDiv.textContent = content;
            } else {
                textDiv.appendChild(formatMessage(content));
            }
        }

        // Timestamp
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.setAttribute('aria-label', 'Message sent at ' + (timeLabel || this.getCurrentTime()));
        timeDiv.textContent = timeLabel || this.getCurrentTime();

        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(timeDiv);

        // Add "Speak" button for AI messages
        if (!isUser) {
            const speakBtn = document.createElement('button');
            speakBtn.className = 'icon-btn speak-btn';
            speakBtn.title = 'Listen to response';
            speakBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
            `;
            speakBtn.dataset.text = content;
            contentDiv.appendChild(speakBtn);
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);

        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();

        return textDiv;
    }

    /**
     * Updates the text content of an existing message element.
     * Used during streaming to progressively render AI responses.
     * @param {HTMLElement} el   - The .message-text element
     * @param {string} text      - Full accumulated text so far
     */
    updateMessageText(el, text) {
        // Clear and re-render with the formatter for proper code block handling
        el.innerHTML = '';
        el.appendChild(formatMessage(text));
        this.scrollToBottom();
    }

    /* ───────────────────────────────────────────
       Typing indicator
    ─────────────────────────────────────────── */

    /**
     * Shows an animated typing indicator (three bouncing dots).
     * Safe to call multiple times — removes any existing one first.
     */
    addTypingIndicator() {
        this.removeTypingIndicator(); // idempotent

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.setAttribute('aria-label', 'AI is typing');
        typingDiv.setAttribute('role', 'status');
        typingDiv.setAttribute('aria-live', 'polite');

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = '🤖';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const dots = document.createElement('div');
        dots.className = 'typing-dots';
        // Three dot spans for the bouncing animation
        dots.innerHTML = '<span></span><span></span><span></span>';

        contentDiv.appendChild(dots);
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(contentDiv);

        this.chatContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    /**
     * Removes the typing indicator. Safe to call even if none exists.
     */
    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }

    /* ───────────────────────────────────────────
       Error display
    ─────────────────────────────────────────── */

    /**
     * Appends an error message banner to the chat.
     * @param {string} message
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.setAttribute('role', 'alert');

        const icon = document.createElement('span');
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>`;

        const text = document.createElement('span');
        text.textContent = message;

        errorDiv.appendChild(icon);
        errorDiv.appendChild(text);
        this.chatContainer.appendChild(errorDiv);
        this.scrollToBottom();

        // Auto-dismiss after 6 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) errorDiv.remove();
        }, 6000);
    }

    /* ───────────────────────────────────────────
       Chat clear / restore
    ─────────────────────────────────────────── */

    /**
     * Resets the chat area to the welcome screen.
     */
    clearChat() {
        this.chatContainer.innerHTML = `
          <div class="welcome-message" role="main">
            <div class="welcome-icon" aria-hidden="true">🤖</div>
            <h2>Welcome to Gemini AI Chatbot</h2>
            <p>Start a conversation by typing a message below</p>
            <div class="suggested-prompts" role="list">
              <button class="prompt-btn" data-prompt="What can you help me with?" role="listitem">What can you help me with?</button>
              <button class="prompt-btn" data-prompt="Tell me a joke" role="listitem">Tell me a joke</button>
              <button class="prompt-btn" data-prompt="Explain quantum computing" role="listitem">Explain quantum computing</button>
            </div>
          </div>`;
    }

    /* ───────────────────────────────────────────
       Status indicator
    ─────────────────────────────────────────── */

    /**
     * Updates the header status indicator.
     * @param {'ready'|'loading'|'error'} status
     * @param {string} text
     */
    setStatus(status, text) {
        const dot = this.statusIndicator.querySelector('.status-dot');
        const label = this.statusIndicator.querySelector('.status-text');
        dot.className = `status-dot ${status}`;
        label.textContent = text;
    }

    /* ───────────────────────────────────────────
       Input: character counter & validation
    ─────────────────────────────────────────── */

    /**
     * Updates the live character counter and visual styles.
     * Disables the send button when invalid.
     */
    updateCharCounter() {
        const count = this.messageInput.value.length;
        this.charCounter.textContent = `${count}/${MAX_CHARS}`;

        // Reset classes
        this.charCounter.classList.remove('warning', 'error');

        if (count > MAX_CHARS) {
            this.charCounter.classList.add('error');
        } else if (count >= WARN_THRESHOLD) {
            this.charCounter.classList.add('warning');
        }

        // Update send button state
        this._refreshSendButton();
    }

    /**
     * Internal: enable/disable send button based on current input validity.
     */
    _refreshSendButton() {
        const value = this.messageInput.value;
        const trimmed = value.trim();
        const overLimit = value.length > MAX_CHARS;
        this.sendButton.disabled = !trimmed || overLimit;
    }

    /* ───────────────────────────────────────────
       Input: enable / disable
    ─────────────────────────────────────────── */

    enableInput() {
        this.messageInput.disabled = false;
        this._refreshSendButton();
        this.messageInput.focus();
    }

    disableInput() {
        this.messageInput.disabled = true;
        this.sendButton.disabled = true;
    }

    /* ───────────────────────────────────────────
       Utilities
    ─────────────────────────────────────────── */

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        });
    }

    /**
     * Returns the current time as a human-readable HH:MM string.
     * @returns {string}
     */
    getCurrentTime() {
        return new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }
}
