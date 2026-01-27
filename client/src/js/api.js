const API_BASE_URL = 'http://localhost:3000/api';

class ChatAPI {
    constructor() {
        this.sessionId = this.getOrCreateSessionId();
    }

    getOrCreateSessionId() {
        let sessionId = localStorage.getItem('chatSessionId');
        if (!sessionId) {
            sessionId = this.generateUUID();
            localStorage.setItem('chatSessionId', sessionId);
        }
        return sessionId;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async sendMessage(message) {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    sessionId: this.sessionId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send message');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async streamMessage(message, onChunk, onComplete, onError) {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    sessionId: this.sessionId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to stream message');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));

                        if (data.error) {
                            onError(new Error(data.error));
                            return;
                        }

                        if (data.done) {
                            onComplete(data.sessionId);
                            return;
                        }

                        onChunk(data.chunk);
                    }
                }
            }
        } catch (error) {
            console.error('Stream Error:', error);
            onError(error);
        }
    }

    async clearHistory() {
        try {
            await fetch(`${API_BASE_URL}/chat/history/${this.sessionId}`, {
                method: 'DELETE'
            });

            // Generate new session ID
            this.sessionId = this.generateUUID();
            localStorage.setItem('chatSessionId', this.sessionId);
        } catch (error) {
            console.error('Clear history error:', error);
        }
    }
}

export default new ChatAPI();
