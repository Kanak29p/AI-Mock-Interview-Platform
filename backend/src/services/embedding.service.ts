import { GoogleGenAI } from "@google/genai";
import { config } from "../config/env";

export const EMBEDDING_DIMENSION = 768;

/**
 * Deterministic fallback embedding generator for local/offline testing
 * Creates a normalized 768-dimensional float vector based on word hashes
 */
const generateFallbackEmbedding = (text: string): number[] => {
  const vector = new Array(EMBEDDING_DIMENSION).fill(0);
  const words = text.toLowerCase().split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const index = Math.abs(hash) % EMBEDDING_DIMENSION;
    vector[index] += 1;
  }

  // Normalize vector to unit length (L2 norm)
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((val) => Number((val / norm).toFixed(6)));
};

/**
 * Generate 768-dimensional vector embedding for given text using Gemini API
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!text || text.trim().length === 0) {
    return new Array(EMBEDDING_DIMENSION).fill(0);
  }

  const apiKey = config.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 0 && apiKey !== "your_gemini_api_key_here") {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text.slice(0, 8000), // Cap max chunk length
        config: {
          outputDimensionality: 768,
        },
      });

      if (
        response &&
        response.embeddings &&
        response.embeddings.length > 0 &&
        response.embeddings[0].values
      ) {
        return response.embeddings[0].values;
      }
    } catch (err: any) {
      console.warn(
        `Gemini Embedding API warning: ${err?.message || err}. Falling back to local semantic vector.`
      );
    }
  }

  // Graceful fallback for local development or missing API key
  return generateFallbackEmbedding(text);
};

/**
 * Format JavaScript number array to PostgreSQL vector literal format: '[0.1, 0.2, ...]'
 */
export const toPgVector = (embedding: number[]): string => {
  return `[${embedding.join(",")}]`;
};
