// Shared between /api/chat and the client. Must not import server-only modules.

export const SOURCE_HEADER = "X-Source";
/** Present on live web answers: JSON list of the official sites used. */
export const WEB_SOURCES_HEADER = "X-Web-Sources";
/** Present on live web answers: Google Search suggestions HTML (required by Google's grounding terms). */
export const SUGGESTIONS_HEADER = "X-Search-Suggestions";

export interface WebSource {
  domain: string;
  uri: string;
}

export function encodeJsonHeader(value: unknown): string {
  return encodeURIComponent(JSON.stringify(value));
}

export function decodeWebSources(header: string | null): WebSource[] {
  if (!header) return [];
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(header));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is WebSource =>
        typeof s === "object" &&
        s !== null &&
        typeof (s as WebSource).domain === "string" &&
        typeof (s as WebSource).uri === "string" &&
        /^https:\/\//.test((s as WebSource).uri),
    );
  } catch {
    return [];
  }
}

export function decodeTextHeader(header: string | null): string | null {
  if (!header) return null;
  try {
    return decodeURIComponent(header);
  } catch {
    return null;
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
