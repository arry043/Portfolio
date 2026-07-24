import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import logger from '../../utils/logger.js';

/**
 * Lazy singleton for Gemini API embeddings (gemini-embedding-001).
 * Replaces heavy local HuggingFace ONNX model to keep server RSS memory < 100MB.
 */
let instance = null;

export const getEmbeddings = () => {
  if (!instance) {
    const rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const apiKey = (rawKey && rawKey !== 'your_gemini_api_key') ? rawKey : '';

    if (!apiKey) {
      logger.warn('[RAG:Embeddings] GEMINI_API_KEY is missing or set to placeholder value.');
    }

    const baseEmbeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: apiKey || 'missing-key',
      modelName: 'gemini-embedding-001',
      model: 'gemini-embedding-001',
    });

    // Wrapper with rate-limited batching (5 items per batch with delay)
    instance = {
      modelName: 'gemini-embedding-001',
      embedQuery: async (text) => {
        if (!apiKey) {
          throw new Error('GEMINI_API_KEY is missing or invalid');
        }
        return baseEmbeddings.embedQuery(text);
      },
      embedDocuments: async (documents) => {
        if (!apiKey) {
          throw new Error('GEMINI_API_KEY is missing or invalid');
        }
        const BATCH_SIZE = 5;
        const DELAY_MS = 150;
        const results = [];

        for (let i = 0; i < documents.length; i += BATCH_SIZE) {
          const batch = documents.slice(i, i + BATCH_SIZE);
          const batchResults = await baseEmbeddings.embedDocuments(batch);
          results.push(...batchResults);

          if (i + BATCH_SIZE < documents.length) {
            await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
          }
        }

        return results;
      },
    };
  }
  return instance;
};
