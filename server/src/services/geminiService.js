const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generationConfig = {
    temperature: 0.9,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
};

exports.generateResponse = async (message, history = [], images = []) => {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig
        });

        const promptParts = [message];
        if (images && images.length > 0) {
            images.forEach(img => {
                promptParts.push({
                    inlineData: {
                        data: img.data,
                        mimeType: img.mimeType
                    }
                });
            });
        }

        const chat = model.startChat({
            history: history,
            generationConfig,
        });

        const result = await chat.sendMessage(promptParts);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to generate response from AI');
    }
};

exports.generateStreamResponse = async (message, history = [], onChunk, images = []) => {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig
        });

        const promptParts = [message];
        if (images && images.length > 0) {
            images.forEach(img => {
                promptParts.push({
                    inlineData: {
                        data: img.data,
                        mimeType: img.mimeType
                    }
                });
            });
        }

        const chat = model.startChat({
            history: history,
            generationConfig,
        });

        const result = await chat.sendMessageStream(promptParts);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            onChunk(chunkText);
        }
    } catch (error) {
        console.error('Gemini Stream Error:', error);
        throw new Error('Failed to stream response from AI');
    }
};
