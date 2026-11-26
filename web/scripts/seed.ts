/**
 * Seeds the FAQ corpus into MongoDB Atlas and creates the Vector Search index.
 * Run from web/:  npm run seed   (reads .env.local)
 * Safe to re-run: chunks are upserted by slug, and the index is only created if missing.
 */
import { EMBEDDING_DIMENSIONS, embed } from "../src/lib/gemini";
import { getFaqCollection, getMongoClient, vectorIndexName } from "../src/lib/mongo";
import { FAQS_EN } from "../src/lib/faqs";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const faqs = FAQS_EN;
  const slugs = new Set(faqs.map((f) => f.slug));
  if (slugs.size !== faqs.length) throw new Error("Duplicate slugs in data/faqs/en.json");
  console.log(`Embedding ${faqs.length} FAQ chunks…`);

  const embeddings = await embed(
    faqs.map((f) => `${f.title}\n\n${f.text}`),
    "RETRIEVAL_DOCUMENT",
  );
  const collection = await getFaqCollection();

  const result = await collection.bulkWrite(
    faqs.map((faq, i) => {
      const embedding = embeddings[i];
      if (!embedding) throw new Error(`No embedding returned for ${faq.slug}`);
      return {
        replaceOne: {
          filter: { slug: faq.slug },
          replacement: { ...faq, embedding },
          upsert: true,
        },
      };
    }),
  );
  const removed = await collection.deleteMany({ slug: { $nin: faqs.map((f) => f.slug) } });
  console.log(
    `Upserted ${result.upsertedCount}, updated ${result.modifiedCount}, removed ${removed.deletedCount} stale.`,
  );

  const indexName = vectorIndexName();
  const existing = await collection.listSearchIndexes(indexName).toArray();
  if (existing.length === 0) {
    console.log(`Creating vector search index "${indexName}"…`);
    await collection.createSearchIndex({
      name: indexName,
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: EMBEDDING_DIMENSIONS,
            similarity: "cosine",
          },
        ],
      },
    });
  } else {
    console.log(`Vector search index "${indexName}" already exists.`);
  }

  process.stdout.write("Waiting for the index to become queryable");
  for (let attempt = 0; attempt < 60; attempt++) {
    // Atlas returns { name, status, queryable, ... }; the driver only types `name`.
    const [index] = (await collection.listSearchIndexes(indexName).toArray()) as Array<{
      queryable?: boolean;
    }>;
    if (index?.queryable) {
      console.log("\nIndex is ready. Seeding complete.");
      return;
    }
    process.stdout.write(".");
    await sleep(5000);
  }
  console.log("\nIndex is still building — check Atlas → Search & Vector Search. It usually finishes within a minute or two.");
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    const client = await getMongoClient().catch(() => null);
    await client?.close();
  });
