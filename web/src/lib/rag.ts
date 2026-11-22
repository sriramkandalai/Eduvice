import { embed } from "./openai";
import { getFaqCollection, vectorIndexName } from "./mongo";

export interface RetrievedChunk {
  slug: string;
  title: string;
  text: string;
  score: number;
}

/** Embed the question and return the single closest FAQ chunk from Atlas Vector Search. */
export async function retrieveTopChunk(question: string): Promise<RetrievedChunk | null> {
  const [queryVector] = await embed([question]);
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

  return results[0] ?? null;
}
