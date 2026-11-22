import { NextResponse } from "next/server";
import { ThinkingLevel, type GenerateContentResponse } from "@google/genai";
import { retrieveTopChunk } from "@/lib/rag";
import { chatModel, getGemini } from "@/lib/gemini";
import { buildSystemPrompt, TAG_UNUSED, TAG_USED } from "@/lib/prompt";
import { checkRateLimit, visitorKey } from "@/lib/rate-limit";
import { MAX_QUESTION_LENGTH, SOURCE_HEADER, encodeSource } from "@/lib/chat-protocol";
import { isLocale, routing, type Locale } from "@/i18n/routing";

export const runtime = "nodejs"; // the MongoDB driver needs Node, not Edge
export const dynamic = "force-dynamic";

function jsonError(status: number, error: string, headers?: HeadersInit) {
  return NextResponse.json({ error }, { status, headers });
}

/**
 * The model starts its reply with TAG_USED or TAG_UNUSED (see lib/prompt.ts).
 * Returns whether the source was used (null if no tag was found) and the text after the tag.
 */
function parseTag(text: string): { used: boolean | null; rest: string } {
  const trimmed = text.trimStart();
  for (const [tag, used] of [[TAG_USED, true], [TAG_UNUSED, false]] as const) {
    if (trimmed.startsWith(tag)) {
      return { used, rest: trimmed.slice(tag.length).replace(/^\s+/, "") };
    }
  }
  return { used: null, rest: text };
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

    const source = await retrieveTopChunk(question);

    const abort = new AbortController();
    const generator = await getGemini().models.generateContentStream({
      model: chatModel(),
      contents: question,
      config: {
        systemInstruction: buildSystemPrompt(source, locale),
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
    while (head.trimStart().length <= TAG_UNUSED.length && !head.includes("\n")) {
      const next = await chunks.next();
      if (next.done) {
        finished = true;
        break;
      }
      head += next.value.text ?? "";
    }
    const { used, rest } = parseTag(head);
    // If the model forgot the tag, fall back to showing whatever source passed the score floor.
    const showSource = source !== null && (used ?? true);

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
    if (showSource && source) {
      headers.set(SOURCE_HEADER, encodeSource({ slug: source.slug, title: source.title, text: source.text }));
    }

    return new Response(stream, { headers });
  } catch (err) {
    console.error("[api/chat]", err);
    return jsonError(500, "Failed to generate an answer.");
  }
}
