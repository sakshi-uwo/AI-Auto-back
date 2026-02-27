import { generativeModel, genAIInstance, modelName } from './config/vertex.js';
import 'dotenv/config';

async function testChat() {
    console.log("🚀 Starting Chat Debug Test...");

    try {
        console.log(`📡 Using model: ${modelName}`);

        const model = genAIInstance.getGenerativeModel({
            model: modelName,
            systemInstruction: "You are a helpful assistant."
        });

        const chatSession = model.startChat({ history: [] });

        console.log(`📤 Sending message...`);
        const result = await chatSession.sendMessage([{ text: "Say hello" }]);

        console.log("📥 Raw result keys:", Object.keys(result));
        console.log("📥 Raw response keys:", Object.keys(result.response));
        console.log("📥 typeof response.text:", typeof result.response.text);

        // Try to extract text using multiple methods
        const r = result.response;

        if (typeof r.text === 'function') {
            console.log("✅ Method 1 (text()): ", r.text());
        }

        if (r.candidates) {
            console.log("✅ Method 2 (candidates):", JSON.stringify(r.candidates[0]?.content?.parts, null, 2));
        }

        if (r.usageMetadata) {
            console.log("📊 Usage:", JSON.stringify(r.usageMetadata, null, 2));
        }

        // Log the entire response to understand its structure
        console.log("🔍 Full response JSON:", JSON.stringify(r, null, 2).substring(0, 1000));

    } catch (error) {
        console.error("❌ Test Failed! Error:", error.message);
        if (error.code) console.error("Error code:", error.code);
    }
}

testChat();
