import express from 'express';
import { generativeModel, genAIInstance, modelName } from '../config/vertex.js';

const router = express.Router();

// @route   POST /api/chat
// @desc    Send a message to the AI assistant
// @access  Private (Optional, depends on requirement, but usually better to protect)
router.post('/', async (req, res) => {
    const { content, history, systemInstruction } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        // Option 1: Use the pre-configured generativeModel (Global)
        // Option 2: Create a new chat session if systemInstruction is provided dynamically

        let model = generativeModel;

        // If frontend sends a specific system instruction, we might need to recreate the model instance
        // or start a chat with those instructions if using the newer SDK features.
        // For simplicity and matching current vertex.js, we'll try to use the provided instructions.

        if (systemInstruction) {
            model = genAIInstance.getGenerativeModel({
                model: modelName,
                systemInstruction: systemInstruction
            });
        }

        // Map history to the format expected by Vertex AI/Gemini SDK
        // format: { role: 'user'|'model', parts: [{ text: '...' }] }
        const formattedHistory = (history || []).map(m => {
            // If already formatted, keep as is, otherwise convert
            if (m.parts) return m;
            return {
                role: m.role === 'assistant' ? 'model' : (m.role || 'user'),
                parts: [{ text: m.content || m.text || '' }]
            };
        });

        const chatSession = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 2048,
            },
        });

        const result = await chatSession.sendMessage([{ text: content }]);

        // Vertex AI SDK and Gemini API SDK have different response structures:
        // - Gemini API SDK: result.response.text() is a function
        // - Vertex AI SDK:  result.response.candidates[0].content.parts[0].text is a string
        let text = '';
        const response = result.response;

        if (typeof response.text === 'function') {
            // Gemini API SDK (when GEMINI_API_KEY is set)
            text = response.text();
        } else if (response.candidates && response.candidates[0]) {
            // Vertex AI SDK
            text = response.candidates[0].content.parts[0].text;
        } else {
            text = "I couldn't generate a response. Please try again.";
        }

        res.json({ reply: text });
    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({
            error: 'Failed to get response from AI',
            details: error.message
        });
    }
});

export default router;
