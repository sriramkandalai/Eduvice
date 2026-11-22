import OpenAI from "openai";
import { envOr, requireEnv } from "./env";

let client: OpenAI | undefined;

export function getOpenAI(): OpenAI {
  client ??= new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
  return client;
}

export function chatModel(): string {
  return envOr("OPENAI_CHAT_MODEL", "gpt-4o-mini");
}

export function embeddingModel(): string {
  return envOr("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small");
}

/** Must match `numDimensions` in the Atlas Vector Search index. */
export const EMBEDDING_DIMENSIONS = 1536;

export async function embed(inputs: string[]): Promise<number[][]> {
  const res = await getOpenAI().embeddings.create({
    model: embeddingModel(),
    input: inputs,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return res.data.map((d) => d.embedding);
}
