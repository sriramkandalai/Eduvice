import { MongoClient, type Collection } from "mongodb";
import { envOr, requireEnv } from "./env";

export interface FaqChunk {
  slug: string;
  title: string;
  text: string;
  embedding: number[];
}

// Reuse one client across hot reloads and warm serverless invocations.
const globalForMongo = globalThis as typeof globalThis & {
  _eduviceMongo?: Promise<MongoClient>;
};

export function getMongoClient(): Promise<MongoClient> {
  if (!globalForMongo._eduviceMongo) {
    globalForMongo._eduviceMongo = new MongoClient(requireEnv("MONGODB_URI"))
      .connect()
      .catch((err: unknown) => {
        // Don't cache a failed connection; let the next request retry.
        globalForMongo._eduviceMongo = undefined;
        throw err;
      });
  }
  return globalForMongo._eduviceMongo;
}

export function vectorIndexName(): string {
  return envOr("MONGODB_VECTOR_INDEX", "faq_vector_index");
}

export async function getFaqCollection(): Promise<Collection<FaqChunk>> {
  const client = await getMongoClient();
  return client
    .db(envOr("MONGODB_DB", "eduvice"))
    .collection<FaqChunk>(envOr("MONGODB_COLLECTION", "faq_chunks"));
}
