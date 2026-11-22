import { NextResponse } from "next/server";
import { ThinkingLevel, type GenerateContentResponse } from "@google/genai";
import { retrieveTopChunks } from "@/lib/rag";
import { chatModel, getGemini } from "@/lib/gemini";
import { buildSystemPrompt, MAX_TAG_LENGTH, TAG_UNUSED, TAG_USED_PATTERN } from "@/lib/prompt";
import { checkRateLimit, visitorKey } from "@/lib/rate-limit";
import { MAX_QUESTION_LENGTH, SOURCE_HEADER, encodeSource } from "@/lib/chat-protocol";
import { isLocale, routing, type Locale } from "@/i18n/routing";

export const runtime = "nodejs"; // the MongoDB driver needs Node, not Edge
export const dynamic = "force-dynamic";

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

    const sources = await retrieveTopChunks(question);

    const abort = new AbortController();
    const generator = await getGemini().models.generateContentStream({
      model: chatModel(),
      contents: question,
      config: {
        systemInstruction: buildSystemPrompt(sources, locale),
        temperature: 0.2,
        maxOutputTokens: 600,
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
      headers.set(SOURCE_HEADER, encodeSource({ slug: source.slug, title: source.title, text: source.text }));
    }

    return new Response(stream, { headers });
  } catch (err) {
    console.error("[api/chat]", err);
    return jsonError(500, "Failed to generate an answer.");
  }
}
