// Shared between /api/chat and the client. Must not import server-only modules.

export const SOURCE_HEADER = "X-Source";
export const MAX_QUESTION_LENGTH = 1000;

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
