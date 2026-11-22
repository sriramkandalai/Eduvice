import { NextResponse } from "next/server";
import { ThinkingLevel, type GenerateContentResponse } from "@google/genai";
import { retrieveTopChunks } from "@/lib/rag";
import { getFaq } from "@/lib/faqs";
import { chatModel, getGemini } from "@/lib/gemini";
import { buildSystemPrompt, MAX_TAG_LENGTH, TAG_UNUSED, TAG_USED_PATTERN } from "@/lib/prompt";
import { checkRateLimit, visitorKey } from "@/lib/rate-limit";
import {
  MAX_QUESTION_LENGTH,
  SOURCE_HEADER,
  SUGGESTIONS_HEADER,
  WEB_SOURCES_HEADER,
  encodeJsonHeader,
  encodeSource,
} from "@/lib/chat-protocol";
import { needsWebSearch } from "@/lib/router";
import { answerWithWebSearch } from "@/lib/web-search";
import { getTranslations } from "next-intl/server";
import { isLocale, routing, type Locale } from "@/i18n/routing";

export const runtime = "nodejs"; // the MongoDB driver needs Node, not Edge
export const dynamic = "force-dynamic";

const SOURCE_EXCERPT_CHARS = 280;

/** Cut text to roughly `max` characters at a word boundary (CJK text has no spaces, so fall back to a hard cut). */
function excerpt(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function jsonError(status: number, error: string, headers?: HeadersInit) {
  return NextResponse.json({ error }, { status, headers });
}

/**
 * The model starts its reply with "[SOURCE:n]" or "[NO_SOURCE]" (see lib/prompt.ts).
 * `sourceIndex`: 0-based index of the source used, -1 for none, or null if no valid tag was found.
 */
function parseTag(text: string, sourceCount: number): { sourceIndex: number | null; rest: string } {
  const trimmed = text.trimStart();
  const strip = (tagLength: number) => trimmed.slice(tagLength).replace(/^\s+/, "");

  if (trimmed.startsWith(TAG_UNUSED)) return { sourceIndex: -1, rest: strip(TAG_UNUSED.length) };

  const match = TAG_USED_PATTERN.exec(trimmed);
  if (match?.[1]) {
    const n = Number(match[1]);
    return { sourceIndex: n >= 1 && n <= sourceCount ? n - 1 : null, rest: strip(match[0].length) };
  }
  return { sourceIndex: null, rest: text };
}

/** Answer from a live search of College Board / official .edu sites (not streamed: sources are checked first). */
async function webAnswerResponse(question: string, locale: Locale): Promise<Response> {
  const answer = await answerWithWebSearch(question, locale);
  const headers = new Headers({
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });

  if (!answer) {
    const t = await getTranslations({ locale, namespace: "Chat" });
    return new Response(t("webNoResult"), { headers });
  }

  headers.set(WEB_SOURCES_HEADER, encodeJsonHeader(answer.sources));
  if (answer.suggestionsHtml) headers.set(SUGGESTIONS_HEADER, encodeURIComponent(answer.suggestionsHtml));
  return new Response(answer.text, { headers });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Body must be JSON.");
  }

  const raw = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const question = typeof raw.question === "string" ? raw.question.trim() : "";
  const locale: Locale =
    typeof raw.locale === "string" && isLocale(raw.locale) ? raw.locale : routing.defaultLocale;

  if (!question) return jsonError(400, "Question is required.");
  if (question.length > MAX_QUESTION_LENGTH) return jsonError(400, "Question is too long.");

  try {
    const limit = await checkRateLimit(visitorKey(req));
    if (!limit.ok) {
      return jsonError(429, "Too many questions. Please wait and try again.", {
        "Retry-After": String(limit.retryAfterSec),
      });
    }

    // Guide search and the "does this need a live web search?" check run in parallel.
    const [sources, webSearch] = await Promise.all([retrieveTopChunks(question), needsWebSearch(question)]);

    if (webSearch) {
      try {
        return await webAnswerResponse(question, locale);
      } catch (err) {
        // e.g. search quota reached: fall back to the guide-based answer below.
        console.error("[api/chat] web search failed, using guide answer:", err);
      }
    }

    const abort = new AbortController();
    const generator = await getGemini().models.generateContentStream({
      model: chatModel(),
      contents: question,
      config: {
        systemInstruction: buildSystemPrompt(sources, locale),
        temperature: 0.2,
        maxOutputTokens: 2048,
        // Short factual answers need little "thinking"; LOW keeps replies fast and cheap.
        // (gemini-3.8-flash rejects MINIMAL.)
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal: abort.signal,
      },
    });
    const chunks: AsyncIterator<GenerateContentResponse> = generator[Symbol.asyncIterator]();

    // Read just enough of the reply to see the tag, so we know whether to attach the source
    // before the response headers are sent.
    let head = "";
    let finished = false;
    while (head.trimStart().length <= MAX_TAG_LENGTH && !head.includes("\n")) {
      const next = await chunks.next();
      if (next.done) {
        finished = true;
        break;
      }
      head += next.value.text ?? "";
    }
    const { sourceIndex, rest } = parseTag(head, sources.length);
    // If the model forgot the tag (or gave a bad number), fall back to the best search match.
    const source = sourceIndex === null ? sources[0] : sourceIndex >= 0 ? sources[sourceIndex] : undefined;

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          if (rest) controller.enqueue(encoder.encode(rest));
          while (!finished) {
            const next = await chunks.next();
            if (next.done) break;
            const text = next.value.text;
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
      cancel() {
        abort.abort();
      },
    });

    const headers = new Headers({
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    });
    if (source) {
      // Show the citation in the reader's language when a translation exists. Only an excerpt is
      // sent (non-Latin text grows ~6x when percent-encoded); the card links to the full topic.
      const shown = getFaq(locale, source.slug) ?? source;
      headers.set(
        SOURCE_HEADER,
        encodeSource({ slug: source.slug, title: shown.title, text: excerpt(shown.text, SOURCE_EXCERPT_CHARS) }),
      );
    }

    return new Response(stream, { headers });
  } catch (err) {
    console.error("[api/chat]", err);
    return jsonError(500, "Failed to generate an answer.");
  }
}
