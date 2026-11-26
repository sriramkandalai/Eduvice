import { createHash } from "node:crypto";
import type { Collection } from "mongodb";
import { getMongoClient } from "./mongo";
import { envOr } from "./env";

// Per-visitor limits for /api/chat. Counters live in MongoDB and expire automatically.
const LIMITS = [
  { name: "minute", windowMs: 60_000, max: 8 },
  { name: "day", windowMs: 86_400_000, max: 100 },
] as const;

interface RateDoc {
  _id: string;
  count: number;
  expiresAt: Date;
}

let ttlIndex: Promise<unknown> | undefined;

async function rateCollection(): Promise<Collection<RateDoc>> {
  const client = await getMongoClient();
  const collection = client.db(envOr("MONGODB_DB", "eduvice")).collection<RateDoc>("rate_limits");
  // Mongo deletes each counter once its window is over.
  ttlIndex ??= collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch((err: unknown) => {
    ttlIndex = undefined;
    throw err;
  });
  await ttlIndex;
  return collection;
}

/** Identify a visitor by a hash of their IP, so raw IP addresses are never stored. */
export function visitorKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

// Fallback counters for when MongoDB is unreachable (per server instance, so less strict).
const memoryCounts = new Map<string, { count: number; expiresAt: number }>();

function countInMemory(id: string, expiresAt: number): number {
  const now = Date.now();
  for (const [k, v] of memoryCounts) if (v.expiresAt <= now) memoryCounts.delete(k);
  const entry = memoryCounts.get(id) ?? { count: 0, expiresAt };
  entry.count += 1;
  memoryCounts.set(id, entry);
  return entry.count;
}

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const collection = await rateCollection().catch((err: unknown) => {
    console.error("[rate-limit] MongoDB unavailable, using in-memory counters:", err instanceof Error ? err.message : err);
    return null;
  });
  const now = Date.now();

  const results = await Promise.all(
    LIMITS.map(async (limit) => {
      const windowStart = Math.floor(now / limit.windowMs) * limit.windowMs;
      const windowEnd = windowStart + limit.windowMs;
      const id = `${key}:${limit.name}:${windowStart}`;
      let count: number;
      if (collection) {
        const doc = await collection.findOneAndUpdate(
          { _id: id },
          { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowEnd) } },
          { upsert: true, returnDocument: "after" },
        );
        count = doc?.count ?? 0;
      } else {
        count = countInMemory(id, windowEnd);
      }
      return { blocked: count > limit.max, retryAfterSec: Math.ceil((windowEnd - now) / 1000) };
    }),
  );

  const blocked = results.filter((r) => r.blocked);
  if (blocked.length === 0) return { ok: true };
  return { ok: false, retryAfterSec: Math.max(...blocked.map((r) => r.retryAfterSec)) };
}
