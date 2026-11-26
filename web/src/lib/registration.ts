import { createHash, randomBytes } from "node:crypto";
import type { Collection } from "mongodb";
import { dbName, getMongoClient } from "./mongo";

/** A password sign-up waiting for its email to be confirmed. Deleted automatically when it expires. */
export interface PendingRegistration {
  email: string;
  name: string | null;
  passwordHash: string;
  tokenHash: string;
  expires: Date;
  createdAt: Date;
}

export const REGISTRATION_TTL_MS = 24 * 60 * 60 * 1000;

let ttlIndex: Promise<unknown> | undefined;

export async function pendingRegistrations(): Promise<Collection<PendingRegistration>> {
  const col = (await getMongoClient()).db(dbName()).collection<PendingRegistration>("pending_registrations");
  ttlIndex ??= Promise.all([
    col.createIndex({ expires: 1 }, { expireAfterSeconds: 0 }),
    col.createIndex({ tokenHash: 1 }),
    col.createIndex({ email: 1 }, { unique: true }),
  ]).catch((err: unknown) => {
    ttlIndex = undefined;
    throw err;
  });
  await ttlIndex;
  return col;
}

/** Only the hash of the emailed token is stored, so a database leak can't confirm accounts. */
export function newToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
