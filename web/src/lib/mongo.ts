import { MongoClient, type Collection } from "mongodb";
import { envOr, requireEnv } from "./env";

export interface FaqChunk {
  slug: string;
  category: string;
  title: string;
  text: string;
  embedding: number[];
}

// Reuse one client across hot reloads and warm serverless invocations.
const globalForMongo = globalThis as typeof globalThis & {
  _eduviceMongo?: Promise<MongoClient>;
  _eduviceMongoRetryAt?: number;
};

// After a failed connection, callers fail immediately for a short while instead of each
// waiting for the connect timeout again (the chat can still answer without the database).
const RETRY_AFTER_FAILURE_MS = 30_000;

export function getMongoClient(): Promise<MongoClient> {
  if (!globalForMongo._eduviceMongo) {
    if (Date.now() < (globalForMongo._eduviceMongoRetryAt ?? 0)) {
      return Promise.reject(new Error("MongoDB is unreachable (recent connection failure)."));
    }
    globalForMongo._eduviceMongo = new MongoClient(requireEnv("MONGODB_URI"), { serverSelectionTimeoutMS: 5000 })
      .connect()
      .catch((err: unknown) => {
        // Don't cache a failed connection; retry after a short pause.
        globalForMongo._eduviceMongo = undefined;
        globalForMongo._eduviceMongoRetryAt = Date.now() + RETRY_AFTER_FAILURE_MS;
        throw err;
      });
  }
  return globalForMongo._eduviceMongo;
}

export function dbName(): string {
  return envOr("MONGODB_DB", "eduvice");
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
