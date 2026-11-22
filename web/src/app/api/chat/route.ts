import { NextResponse } from "next/server";
import { ThinkingLevel, type Content, type GenerateContentResponse, type GroundingMetadata } from "@google/genai";
import { getTranslations } from "next-intl/server";
import { retrieveTopChunks } from "@/lib/rag";
import { getFaq } from "@/lib/faqs";
import { chatModel, getGemini } from "@/lib/gemini";
import { buildSystemPrompt, MAX_TAG_LENGTH, TAG_UNUSED, TAG_USED_PATTERN } from "@/lib/prompt";
import { checkRateLimit, visitorKey } from "@/lib/rate-limit";
import {
  MAX_QUESTION_LENGTH,
  SOURCE_HEADER,
  encodeMeta,
  encodeSource,
  sanitizeHistory,
  type HistoryTurn,
} from "@/lib/chat-protocol";
import { needsWebSearch } from "@/lib/router";
import { answerWithWebSearch, citedWebSources } from "@/lib/web-search";
import { suggestFollowUps } from "@/lib/followups";
import { isLocale, routing, type Locale } from "@/i18n/routing";

export const runtime = "nodejs"; // the MongoDB driver needs Node, not Edge
export const dynamic = "force-dynamic";

const SOURCE_EXCERPT_CHARS = 280;

const TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
} as const;

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

/** Keep the most recent grounding metadata that actually contains search results. */
function groundingFrom(chunk: GenerateContentResponse, previous: GroundingMetadata | undefined) {
  const gm = chunk.candidates?.[0]?.groundingMetadata;
  return gm && (gm.groundingChunks?.length || gm.searchEntryPoint) ? gm : previous;
}

function toContents(history: HistoryTurn[], question: string): Content[] {
  return [
    ...history.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    { role: "user", parts: [{ text: question }] },
  ];
}

/**
 * Text used for guide search and the AP check. Short follow-ups ("what about UCLA?") make sense
 * only with the previous question, so it's included.
 */
function searchText(history: HistoryTurn[], question: string): string {
  const previous = [...history].reverse().find((t) => t.role === "user")?.text;
  return previous ? `${previous.slice(0, 500)}\n${question}` : question;
}

/** AP-credit answer from a live search of College Board / official .edu sites (not streamed: sources are checked first). */
async function officialAnswerResponse(contents: Content[], question: string, locale: Locale): Promise<Response> {
  const answer = await answerWithWebSearch(contents, locale);
  const text = answer?.text ?? (await getTranslations({ locale, namespace: "Chat" }))("webNoResult");
  const followUps = await suggestFollowUps(question, text, locale);
  const body =
    text +
    encodeMeta({
      webKind: answer ? "official" : undefined,
      webSources: answer?.sources ?? [],
      suggestionsHtml: answer?.suggestionsHtml,
      followUps,
    });
  return new Response(body, { headers: TEXT_HEADERS });
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
  const history = sanitizeHistory(raw.history);

  if (!question) return jsonError(400, "Question is required.");
  if (question.length > MAX_QUESTION_LENGTH) return jsonError(400, "Question is too long.");

  try {
    const limit = await checkRateLimit(visitorKey(req));
    if (!limit.ok) {
      return jsonError(429, "Too many questions. Please wait and try again.", {
        "Retry-After": String(limit.retryAfterSec),
      });
    }

    const contents = toContents(history, question);
    const lookup = searchText(history, question);

    // Guide search and the "is this an AP-credit question?" check run in parallel.
    const [sources, apCredit] = await Promise.all([retrieveTopChunks(lookup), needsWebSearch(lookup)]);

    if (apCredit) {
      try {
        return await officialAnswerResponse(contents, question, locale);
      } catch (err) {
        // e.g. search quota reached: fall back to the general answer below.
        console.error("[api/chat] official search failed, using general answer:", err);
      }
    }

    // General answer: guide sources in the prompt, plus Google Search that Gemini uses only when
    // it needs current or specific facts.
    const abort = new AbortController();
    const generator = await getGemini().models.generateContentStream({
      model: chatModel(),
      contents,
      config: {
        systemInstruction: buildSystemPrompt(sources, locale),
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
        maxOutputTokens: 2048,
        // LOW keeps replies fast and cheap. (gemini-3.8-flash rejects MINIMAL.)
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal: abort.signal,
      },
    });
    const chunks: AsyncIterator<GenerateContentResponse> = generator[Symbol.asyncIterator]();
    let grounding: GroundingMetadata | undefined;

    // Read just enough of the reply to see the tag, so we know whether to attach the guide
    // source before the response headers are sent.
    let head = "";
    let finished = false;
    while (head.trimStart().length <= MAX_TAG_LENGTH && !head.includes("\n")) {
      const next = await chunks.next();
      if (next.done) {
        finished = true;
        break;
      }
      head += next.value.text ?? "";
      grounding = groundingFrom(next.value, grounding);
    }
    const { sourceIndex, rest } = parseTag(head, sources.length);
    // If the model forgot the tag (or gave a bad number), fall back to the best search match.
    const source = sourceIndex === null ? sources[0] : sourceIndex >= 0 ? sources[sourceIndex] : undefined;

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let answer = rest;
          if (rest) controller.enqueue(encoder.encode(rest));
          while (!finished) {
            const next = await chunks.next();
            if (next.done) break;
            const text = next.value.text;
            if (text) {
              answer += text;
              controller.enqueue(encoder.encode(text));
            }
            grounding = groundingFrom(next.value, grounding);
          }

          // After the answer: follow-up suggestions and, if Gemini searched the web, its sources.
          const webSources = citedWebSources(grounding);
          const followUps = await suggestFollowUps(question, answer, locale);
          controller.enqueue(
            encoder.encode(
              encodeMeta({
                webKind: webSources.length > 0 ? "web" : undefined,
                webSources,
                suggestionsHtml: webSources.length > 0 ? grounding?.searchEntryPoint?.renderedContent : undefined,
                followUps,
              }),
            ),
          );
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
      cancel() {
        abort.abort();
      },
    });

    const headers = new Headers(TEXT_HEADERS);
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
