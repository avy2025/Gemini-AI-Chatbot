const geminiService = require('../services/geminiService');
const { v4: uuidv4 } = require('uuid');

// Store chat sessions in memory (use Redis/DB for production)
const chatSessions = new Map();

exports.sendMessage = async (req, res, next) => {
    try {
        const { message, sessionId = uuidv4() } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (message.length > 4000) {
            return res.status(400).json({ error: 'Message too long (max 4000 characters)' });
        }

        // Get or create session history
        let history = chatSessions.get(sessionId) || [];

        // Get response from Gemini
        const response = await geminiService.generateResponse(message, history);

        // Update history
        history.push(
            { role: 'user', parts: [{ text: message }] },
            { role: 'model', parts: [{ text: response }] }
        );

        // Keep only last 20 messages to manage memory
        if (history.length > 20) {
            history = history.slice(-20);
        }

        chatSessions.set(sessionId, history);

        res.json({
            response,
            sessionId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};

exports.streamMessage = async (req, res, next) => {
    try {
        const { message, sessionId = uuidv4() } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Set headers for SSE (Server-Sent Events)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let history = chatSessions.get(sessionId) || [];

        // Stream response
        let fullResponse = '';
        await geminiService.generateStreamResponse(message, history, (chunk) => {
            fullResponse += chunk;
            res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
        });

        // Update history
        history.push(
            { role: 'user', parts: [{ text: message }] },
            { role: 'model', parts: [{ text: fullResponse }] }
        );

        if (history.length > 20) {
            history = history.slice(-20);
        }

        chatSessions.set(sessionId, history);

        res.write(`data: ${JSON.stringify({ chunk: '', done: true, sessionId })}\n\n`);
        res.end();
    } catch (error) {
        res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
        res.end();
    }
};

exports.clearHistory = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        chatSessions.delete(sessionId);
        res.json({ message: 'History cleared successfully' });
    } catch (error) {
        next(error);
    }
};
