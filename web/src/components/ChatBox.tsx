"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  MAX_QUESTION_LENGTH,
  SOURCE_HEADER,
  decodeSource,
  splitResponse,
  type ChatRequestBody,
  type ChatSource,
} from "@/lib/chat-protocol";

type Status = "idle" | "loading" | "streaming" | "done" | "error";
type ErrorKey = "errorEmpty" | "errorGeneric" | "errorRateLimit";

class RateLimitedError extends Error {}

export function ChatBox() {
  const t = useTranslations("Chat");
  const locale = useLocale();
  const inputId = useId();

  const [question, setQuestion] = useState("");
  // Raw response body: the answer text, then (for web answers) the sources metadata.
  const [raw, setRaw] = useState("");
  const [source, setSource] = useState<ChatSource | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<ErrorKey | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [slow, setSlow] = useState(false);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Answers that search the web can take 10+ seconds; reassure the parent.
  useEffect(() => {
    if (status !== "loading") {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  const busy = status === "loading" || status === "streaming";
  const { text: answer, meta } = splitResponse(raw);
  const webSources = meta?.webSources ?? [];
  const suggestionsHtml = meta?.suggestionsHtml ?? null;
  const official = meta?.kind === "official";

  async function ask() {
    const trimmed = question.trim();
    if (!trimmed) {
      setError("errorEmpty");
      setStatus("error");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRaw("");
    setSource(null);
    setError(null);
    setStatus("loading");

    try {
      const body: ChatRequestBody = { question: trimmed, locale };
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (res.status === 429) throw new RateLimitedError();
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      setSource(decodeSource(res.headers.get(SOURCE_HEADER)));
      setStatus("streaming");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setRaw((prev) => prev + text);
      }
      setStatus("done");
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof RateLimitedError) {
        setError("errorRateLimit");
      } else {
        console.error(err);
        setError("errorGeneric");
      }
      setStatus("error");
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter adds a line. Ignore Enter while an IME is composing.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!busy) void ask();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label htmlFor={inputId} className="font-bold">
          {t("inputLabel")}
        </label>
        <textarea
          id={inputId}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("placeholder")}
          maxLength={MAX_QUESTION_LENGTH}
          rows={3}
          className="w-full resize-y rounded-2xl border-2 border-blue-dark/30 bg-white px-4 py-3 text-start shadow-card placeholder:text-blue-dark/50 focus:border-blue"
        />
        <p className="text-sm text-blue-dark/80">{t("privacyNote")}</p>
        <button
          type="submit"
          disabled={busy}
          className="self-end rounded-full bg-blue px-6 py-2.5 font-bold text-white shadow-pill hover:bg-blue-dark disabled:opacity-60"
        >
          {t("submit")}
        </button>
      </form>

      <div aria-live="polite" className="flex flex-col gap-4">
        {status === "loading" && <p className="font-medium">{t(slow ? "thinkingLong" : "thinking")}</p>}

        {error && (
          <p role="alert" className="rounded-xl border-2 border-blue-dark bg-cream px-4 py-3 font-medium">
            {t(error)}
          </p>
        )}

        {answer && (
          <section className="rounded-2xl bg-white px-5 py-4 shadow-card">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-blue">
              {t("answerLabel")}
            </h2>
            <p className="whitespace-pre-wrap leading-relaxed">{answer}</p>
          </section>
        )}

        {webSources.length > 0 && (status === "streaming" || status === "done") && (
          <aside className="flex flex-col gap-3 rounded-2xl border-s-4 border-blue bg-cream px-5 py-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-blue">
              {t(official ? "webSourcesLabel" : "webSourcesLabelGeneral")}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {webSources.map((s) => (
                <li key={s.domain}>
                  <a
                    href={s.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                    className="inline-block rounded-full bg-white px-3 py-1 text-sm font-bold text-blue hover:underline"
                  >
                    {s.domain}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-sm">{t(official ? "webNote" : "webNoteGeneral")}</p>
            {suggestionsHtml && (
              // Google's grounding terms require showing these search suggestions. The HTML comes
              // from Google; it's sandboxed (no scripts) and its links open in a new tab.
              <iframe
                title={t("searchSuggestionsLabel")}
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                srcDoc={`<base target="_blank">${suggestionsHtml}`}
                className="h-16 w-full rounded-xl border-0 bg-white"
              />
            )}
          </aside>
        )}

        {source && (status === "streaming" || status === "done") && (
          <aside className="rounded-2xl border-s-4 border-blue bg-cream px-5 py-4">
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-blue">
              {t("sourceLabel")}
            </h2>
            <p className="mb-2 font-bold">{source.title}</p>
            <blockquote className="text-sm leading-relaxed text-blue-dark/90">{source.text}</blockquote>
            <Link
              href={`/guide/${source.slug}`}
              className="mt-3 inline-block text-sm font-bold text-blue hover:underline"
            >
              {t("readMore")} <span aria-hidden="true" className="inline-block rtl:rotate-180">→</span>
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
}
