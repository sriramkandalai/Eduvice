import { GoogleGenAI } from "@google/genai";
import { envOr, requireEnv } from "./env";

let client: GoogleGenAI | undefined;

export function getGemini(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });
  return client;
}

export function chatModel(): string {
  return envOr("GEMINI_CHAT_MODEL", "gemini-3.8-flash");
}

export function embeddingModel(): string {
  return envOr("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001");
}

/** Must match `numDimensions` in the Atlas Vector Search index. */
export const EMBEDDING_DIMENSIONS = 768;

/** Documents and queries are embedded with different task types for better retrieval. */
export type EmbedTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export async function embed(inputs: string[], taskType: EmbedTask): Promise<number[][]> {
  const res = await getGemini().models.embedContent({
    model: embeddingModel(),
    contents: inputs,
    config: { taskType, outputDimensionality: EMBEDDING_DIMENSIONS },
  });

  const vectors = (res.embeddings ?? []).map((e) => e.values ?? []);
  if (vectors.length !== inputs.length || vectors.some((v) => v.length !== EMBEDDING_DIMENSIONS)) {
    throw new Error("Gemini returned an unexpected number or size of embeddings.");
  }
  return vectors;
}
