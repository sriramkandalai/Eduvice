// Shared between /api/chat and the client. Must not import server-only modules.

// Response format of POST /api/chat (text/plain, streamed):
//
//   <answer text…>[META_SEPARATOR<JSON AnswerMeta>]
//
// The answer streams first. Then a single record-separator character and a JSON object follow
// with things only known once the answer is complete: suggested follow-up questions and, if
// Google Search was used, the web sources. The guide citation, known up front, is sent in the
// X-Source header.

export const SOURCE_HEADER = "X-Source";
/** For signed-in users: the saved conversation this exchange belongs to. */
export const CONVERSATION_HEADER = "X-Conversation-Id";

/** ASCII "record separator": never appears in answer text. */
export const META_SEPARATOR = "\u001E";

export interface WebSource {
  domain: string;
  uri: string;
}

export interface AnswerMeta {
  /** "official" = AP-credit answer limited to College Board / .edu; "web" = open Google Search. */
  webKind?: "official" | "web";
  webSources: WebSource[];
  /** Google Search suggestions widget HTML (required by Google's grounding terms). */
  suggestionsHtml?: string;
  /** Short follow-up questions the user might ask next, in their language. */
  followUps: string[];
}

export function encodeMeta(meta: AnswerMeta): string {
  return META_SEPARATOR + JSON.stringify(meta);
}

export function parseMeta(json: string): AnswerMeta | null {
  try {
    const parsed = JSON.parse(json) as Partial<AnswerMeta>;
    const webSources = Array.isArray(parsed.webSources)
      ? parsed.webSources.filter(
          (s): s is WebSource =>
            typeof s?.domain === "string" && typeof s?.uri === "string" && /^https:\/\//.test(s.uri),
        )
      : [];
    const followUps = Array.isArray(parsed.followUps)
      ? parsed.followUps.filter((q): q is string => typeof q === "string" && q.trim().length > 0).slice(0, 3)
      : [];
    return {
      webKind: parsed.webKind === "official" ? "official" : parsed.webKind === "web" ? "web" : undefined,
      webSources,
      suggestionsHtml: typeof parsed.suggestionsHtml === "string" ? parsed.suggestionsHtml : undefined,
      followUps,
    };
  } catch {
    return null; // still arriving
  }
}

/** Split a (possibly partial) response body into the answer text and, once complete, its metadata. */
export function splitResponse(raw: string): { text: string; meta: AnswerMeta | null } {
  const at = raw.indexOf(META_SEPARATOR);
  if (at === -1) return { text: raw, meta: null };
  return { text: raw.slice(0, at), meta: parseMeta(raw.slice(at + 1)) };
}

export const MAX_QUESTION_LENGTH = 4000;
/** Earlier turns sent with each question, so Marg remembers the conversation. */
export const MAX_HISTORY_TURNS = 8;
export const MAX_HISTORY_CHARS = 12_000;

export interface HistoryTurn {
  role: "user" | "model";
  text: string;
}

export interface ChatRequestBody {
  question: string;
  locale: string;
  /** Guests send their recent turns; signed-in users' history is loaded from their account. */
  history?: HistoryTurn[];
  /** Signed-in users: the saved conversation to continue (omit to start a new one). */
  conversationId?: string | null;
}

/** Keep only well-formed, recent turns within the size budget (newest kept first). */
export function sanitizeHistory(raw: unknown): HistoryTurn[] {
  if (!Array.isArray(raw)) return [];
  const turns = raw
    .filter(
      (t): t is HistoryTurn =>
        typeof t === "object" &&
        t !== null &&
        ((t as HistoryTurn).role === "user" || (t as HistoryTurn).role === "model") &&
        typeof (t as HistoryTurn).text === "string" &&
        (t as HistoryTurn).text.trim().length > 0,
    )
    .slice(-MAX_HISTORY_TURNS);

  const kept: HistoryTurn[] = [];
  let budget = MAX_HISTORY_CHARS;
  for (let i = turns.length - 1; i >= 0; i--) {
    const turn = turns[i]!;
    const text = turn.text.slice(0, MAX_QUESTION_LENGTH);
    if (text.length > budget) break;
    budget -= text.length;
    kept.unshift({ role: turn.role, text });
  }
  // Gemini expects the conversation to start with a user turn.
  while (kept[0]?.role === "model") kept.shift();
  return kept;
}

export interface ChatSource {
  slug: string;
  title: string;
  text: string;
}

// HTTP headers must be ASCII, so the JSON is percent-encoded.
export function encodeSource(source: ChatSource): string {
  return encodeURIComponent(JSON.stringify(source));
}

export function decodeSource(header: string | null): ChatSource | null {
  if (!header) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(header));
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "title" in parsed &&
      "text" in parsed &&
      "slug" in parsed &&
      typeof parsed.title === "string" &&
      typeof parsed.text === "string" &&
      typeof parsed.slug === "string"
    ) {
      return { slug: parsed.slug, title: parsed.title, text: parsed.text };
    }
  } catch {
    // fall through
  }
  return null;
}
