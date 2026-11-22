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

/** Embed the question and return the single closest FAQ chunk from Atlas Vector Search. */
export async function retrieveTopChunk(question: string): Promise<RetrievedChunk | null> {
  const [queryVector] = await embed([question], "RETRIEVAL_QUERY");
  if (!queryVector) return null;

  const collection = await getFaqCollection();
  const results = await collection
    .aggregate<RetrievedChunk>([
      {
        $vectorSearch: {
          index: vectorIndexName(),
          path: "embedding",
          queryVector,
          numCandidates: 50,
          limit: 1,
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

  const top = results[0];
  return top && top.score >= MIN_SOURCE_SCORE ? top : null;
}
