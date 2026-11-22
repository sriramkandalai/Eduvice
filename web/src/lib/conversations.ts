// Chats saved to a signed-in user's account. Every query is scoped by userId, so people can
// only ever read or change their own conversations.

import { ObjectId, type Collection } from "mongodb";
import { dbName, getMongoClient } from "./mongo";
import { parseMeta, type AnswerMeta, type ChatSource } from "./chat-protocol";

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  source?: ChatSource | null;
  meta?: AnswerMeta | null;
}

interface ConversationDoc {
  _id: ObjectId;
  userId: string;
  title: string;
  messages: StoredMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

/** Oldest messages are dropped beyond this, to keep documents small. */
const MAX_MESSAGES_PER_CONVERSATION = 200;
const MAX_MESSAGE_CHARS = 8000;
const MAX_CONVERSATIONS_LISTED = 100;

let indexes: Promise<unknown> | undefined;

async function collection(): Promise<Collection<ConversationDoc>> {
  const col = (await getMongoClient()).db(dbName()).collection<ConversationDoc>("conversations");
  indexes ??= col.createIndex({ userId: 1, updatedAt: -1 }).catch((err: unknown) => {
    indexes = undefined;
    throw err;
  });
  await indexes;
  return col;
}

function toObjectId(id: string): ObjectId | null {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export function titleFrom(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 80 ? `${t.slice(0, 77)}…` : t || "Chat";
}

/** Validate messages that came from a client (used when importing a guest chat). */
export function sanitizeMessages(raw: unknown): StoredMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: StoredMessage[] = [];
  for (const m of raw.slice(-MAX_MESSAGES_PER_CONVERSATION)) {
    if (typeof m !== "object" || m === null) continue;
    const r = m as Record<string, unknown>;
    if ((r.role !== "user" && r.role !== "assistant") || typeof r.text !== "string" || !r.text.trim()) continue;
    const src = r.source as Record<string, unknown> | null | undefined;
    out.push({
      id: typeof r.id === "string" ? r.id.slice(0, 64) : new ObjectId().toString(),
      role: r.role,
      text: r.text.slice(0, MAX_MESSAGE_CHARS),
      source:
        src && typeof src.slug === "string" && typeof src.title === "string" && typeof src.text === "string"
          ? { slug: src.slug.slice(0, 100), title: src.title.slice(0, 200), text: src.text.slice(0, 1000) }
          : null,
      meta: r.meta ? parseMeta(JSON.stringify(r.meta)) : null,
    });
  }
  return out;
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const docs = await (await collection())
    .find({ userId }, { projection: { title: 1, updatedAt: 1 } })
    .sort({ updatedAt: -1 })
    .limit(MAX_CONVERSATIONS_LISTED)
    .toArray();
  return docs.map((d) => ({ id: d._id.toString(), title: d.title, updatedAt: d.updatedAt.toISOString() }));
}

export async function getConversation(userId: string, id: string) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await collection()).findOne({ _id, userId });
  return doc ? { id: doc._id.toString(), title: doc.title, messages: doc.messages } : null;
}

export async function createConversation(userId: string, title: string, messages: StoredMessage[] = []) {
  const now = new Date();
  const res = await (await collection()).insertOne({
    _id: new ObjectId(),
    userId,
    title: titleFrom(title),
    messages,
    createdAt: now,
    updatedAt: now,
  });
  return res.insertedId.toString();
}

export async function appendMessages(userId: string, id: string, messages: StoredMessage[]) {
  const _id = toObjectId(id);
  if (!_id || messages.length === 0) return;
  await (await collection()).updateOne(
    { _id, userId },
    {
      $push: { messages: { $each: messages, $slice: -MAX_MESSAGES_PER_CONVERSATION } },
      $set: { updatedAt: new Date() },
    },
  );
}

export async function deleteConversation(userId: string, id: string): Promise<boolean> {
  const _id = toObjectId(id);
  if (!_id) return false;
  const res = await (await collection()).deleteOne({ _id, userId });
  return res.deletedCount === 1;
}

export async function deleteAllConversations(userId: string) {
  await (await collection()).deleteMany({ userId });
}
