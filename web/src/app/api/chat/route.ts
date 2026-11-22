import { NextResponse } from "next/server";
import { retrieveTopChunk, type RetrievedChunk } from "@/lib/rag";
import { chatModel, getGemini } from "@/lib/gemini";
import { MAX_QUESTION_LENGTH, SOURCE_HEADER, encodeSource } from "@/lib/chat-protocol";
import { isLocale, routing, type Locale } from "@/i18n/routing";

export const runtime = "nodejs"; // the MongoDB driver needs Node, not Edge
export const dynamic = "force-dynamic";

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Spanish",
};

function systemPrompt(source: RetrievedChunk | null, locale: Locale): string {
  const context = source
    ? `SOURCE (title: "${source.title}"):\n${source.text}`
    : "SOURCE: (no relevant source was found)";

  return [
    "You are EduVice, a friendly guide that helps immigrant parents understand the US school system.",
    "Answer ONLY using the SOURCE below. If the SOURCE does not answer the question, say you don't have that information yet and suggest asking the child's school or district.",
    `Reply in the same language the parent wrote in. If unclear, reply in ${LANGUAGE_NAMES[locale]}.`,
    "Use short, simple sentences. Plain text only — no markdown, no headings. Keep it under 150 words.",
    "This is general information, not legal advice.",
    "",
    context,
  ].join("\n");
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body must be JSON.");
  }

  const raw = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const question = typeof raw.question === "string" ? raw.question.trim() : "";
  const locale: Locale =
    typeof raw.locale === "string" && isLocale(raw.locale) ? raw.locale : routing.defaultLocale;

  if (!question) return badRequest("Question is required.");
  if (question.length > MAX_QUESTION_LENGTH) return badRequest("Question is too long.");

  try {
    const source = await retrieveTopChunk(question);

    const abort = new AbortController();
    const completion = await getGemini().models.generateContentStream({
      model: chatModel(),
      contents: question,
      config: {
        systemInstruction: systemPrompt(source, locale),
        temperature: 0.2,
        maxOutputTokens: 600,
        // Short factual answers don't need "thinking"; this keeps replies fast and cheap.
        // (Supported by gemini-2.5-flash. Remove if you switch to a model that requires thinking.)
        thinkingConfig: { thinkingBudget: 0 },
        abortSignal: abort.signal,
      },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.text;
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
    return NextResponse.json({ error: "Failed to generate an answer." }, { status: 500 });
  }
}
