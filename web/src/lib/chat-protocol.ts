// Shared between /api/chat and the client. Must not import server-only modules.

// Response format of POST /api/chat (text/plain, streamed):
//
//   <answer text…>[META_SEPARATOR<JSON AnswerMeta>]
//
// The answer streams first. If Google Search was used, a single record-separator character
// and a JSON object with the web sources follow at the very end (they're only known once the
// answer is complete). The guide citation, known up front, is sent in the X-Source header.

export const SOURCE_HEADER = "X-Source";

/** ASCII "record separator": never appears in answer text. */
export const META_SEPARATOR = "\u001E";

export interface WebSource {
  domain: string;
  uri: string;
}

export interface AnswerMeta {
  /** "official" = AP-credit answer limited to College Board / .edu; "web" = open Google Search. */
  kind: "official" | "web";
  webSources: WebSource[];
  /** Google Search suggestions widget HTML (required by Google's grounding terms). */
  suggestionsHtml?: string;
}

export function encodeMeta(meta: AnswerMeta): string {
  return META_SEPARATOR + JSON.stringify(meta);
}

/** Split a (possibly partial) response body into the answer text and, once complete, its metadata. */
export function splitResponse(raw: string): { text: string; meta: AnswerMeta | null } {
  const at = raw.indexOf(META_SEPARATOR);
  if (at === -1) return { text: raw, meta: null };
  const text = raw.slice(0, at);
  try {
    const parsed = JSON.parse(raw.slice(at + 1)) as Partial<AnswerMeta>;
    const webSources = Array.isArray(parsed.webSources)
      ? parsed.webSources.filter(
          (s): s is WebSource =>
            typeof s?.domain === "string" && typeof s?.uri === "string" && /^https:\/\//.test(s.uri),
        )
      : [];
    return {
      text,
      meta: {
        kind: parsed.kind === "official" ? "official" : "web",
        webSources,
        suggestionsHtml: typeof parsed.suggestionsHtml === "string" ? parsed.suggestionsHtml : undefined,
      },
    };
  } catch {
    return { text, meta: null }; // metadata still arriving
  }
}

export const MAX_QUESTION_LENGTH = 4000;

export interface ChatRequestBody {
  question: string;
  locale: string;
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
