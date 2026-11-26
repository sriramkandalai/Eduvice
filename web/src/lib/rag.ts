import { embed } from "./gemini";
import { getFaqCollection, vectorIndexName } from "./mongo";

export interface RetrievedChunk {
  slug: string;
  title: string;
  text: string;
  score: number;
}

/**
 * Matches below this score are never shown to the model.
 * Measured with gemini-embedding-001: on-topic questions score ~0.82–0.87 and
 * unrelated ones ~0.74–0.80, so this floor only drops clearly unrelated matches.
 * The model makes the final "did I use the source?" call (see lib/prompt.ts).
 */
export const MIN_SOURCE_SCORE = 0.75;

/** How many candidate chunks the model sees; it picks the one it relied on most. */
export const TOP_K = 3;

/** Embed the question and return the closest FAQ chunks (best first) from Atlas Vector Search. */
export async function retrieveTopChunks(question: string, k = TOP_K): Promise<RetrievedChunk[]> {
  const [queryVector] = await embed([question], "RETRIEVAL_QUERY");
  if (!queryVector) return [];

  const collection = await getFaqCollection();
  const results = await collection
    .aggregate<RetrievedChunk>([
      {
        $vectorSearch: {
          index: vectorIndexName(),
          path: "embedding",
          queryVector,
          numCandidates: 100,
          limit: k,
        },
      },
      {
        $project: {
          _id: 0,
          slug: 1,
          title: 1,
          text: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ])
    .toArray();

  return results.filter((r) => r.score >= MIN_SOURCE_SCORE);
}
