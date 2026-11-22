"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  MAX_QUESTION_LENGTH,
  SOURCE_HEADER,
  decodeSource,
  type ChatRequestBody,
  type ChatSource,
} from "@/lib/chat-protocol";

type Status = "idle" | "loading" | "streaming" | "done" | "error";
type ErrorKey = "errorEmpty" | "errorGeneric";

export function ChatBox() {
  const t = useTranslations("Chat");
  const locale = useLocale();
  const inputId = useId();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [source, setSource] = useState<ChatSource | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<ErrorKey | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const busy = status === "loading" || status === "streaming";

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

    setAnswer("");
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
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      setSource(decodeSource(res.headers.get(SOURCE_HEADER)));
      setStatus("streaming");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setAnswer((prev) => prev + text);
      }
      setStatus("done");
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error(err);
      setError("errorGeneric");
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
        <button
          type="submit"
          disabled={busy}
          className="self-end rounded-full bg-blue px-6 py-2.5 font-bold text-white shadow-pill hover:bg-blue-dark disabled:opacity-60"
        >
          {t("submit")}
        </button>
      </form>

      <div aria-live="polite" className="flex flex-col gap-4">
        {status === "loading" && <p className="font-medium">{t("thinking")}</p>}

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

        {source && (status === "streaming" || status === "done") && (
          <aside className="rounded-2xl border-s-4 border-blue bg-cream px-5 py-4">
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-blue">
              {t("sourceLabel")}
            </h2>
            <p className="mb-2 font-bold">{source.title}</p>
            <blockquote className="text-sm leading-relaxed text-blue-dark/90">{source.text}</blockquote>
          </aside>
        )}
      </div>
    </div>
  );
}
