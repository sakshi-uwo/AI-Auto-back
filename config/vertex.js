import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dual-mode initialization: Try Gemini API Key first, fallback to Vertex AI
const apiKey = process.env.GEMINI_API_KEY;
const projectId = process.env.GCP_PROJECT_ID;
const location = 'asia-south1';
const keyFilePath = path.join(__dirname, '../google_cloud_credentials.json');

let genAI;
let vertexAI;
let useVertexAI = false;

// Try Gemini API Key first (simpler, more portable)
if (apiKey) {
  console.log(`✅ Gemini AI initializing with API Key`);
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    useVertexAI = false;
  } catch (err) {
    console.error('❌ Gemini AI initialization failed:', err.message);
  }
}
// Fallback to Vertex AI with service account
else if (projectId) {
  console.log(`✅ Vertex AI initializing with project: ${projectId}`);
  try {
    vertexAI = new VertexAI({ project: projectId, location: location, keyFilename: keyFilePath });
    useVertexAI = true;
  } catch (e) {
    console.warn('⚠️ Vertex AI with keyfile failed, trying system auth...');
    try {
      vertexAI = new VertexAI({ project: projectId, location: location });
      useVertexAI = true;
    } catch (e2) {
      console.error('❌ Vertex AI initialization failed:', e2.message);
      useVertexAI = false;
    }
  }
} else {
  console.warn("⚠️ Warning: Neither GEMINI_API_KEY nor GCP_PROJECT_ID found. AI features will be limited.");
}

// Model name
export const modelName = "gemini-1.5-flash";

const systemInstructionText = `You are AI-AUTO , the internal intelligent sales and operations assistant...`; // Truncated for brevity but keep original

// Mock Model for when everything fails
const mockModel = {
  startChat: () => ({
    sendMessage: async () => ({
      response: {
        candidates: [{ content: { parts: [{ text: "AI Service is currently unavailable. Please check configuration." }] } }]
      }
    })
  }),
  generateContent: async () => ({
    response: {
      candidates: [{ content: { parts: [{ text: "AI Service is currently unavailable." }] } }]
    }
  })
};

// Create generative model based on available initialization
export const generativeModel = (useVertexAI && vertexAI)
  ? vertexAI.preview.getGenerativeModel({
    model: modelName,
    generationConfig: { maxOutputTokens: 4096 },
    systemInstruction: systemInstructionText,
  })
  : (genAI ? genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { maxOutputTokens: 4096 },
    systemInstruction: systemInstructionText,
  }) : mockModel);

// Export genAI instance for multi-model support in chatRoutes
export const genAIInstance = (useVertexAI && vertexAI)
  ? { getGenerativeModel: (options) => vertexAI.preview.getGenerativeModel(options) }
  : (genAI || { getGenerativeModel: () => mockModel });

// Export vertexAI for compatibility
export { vertexAI };