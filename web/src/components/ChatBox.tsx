"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Marg, type MargState } from "./Marg";
import { ChatHistory, type ConversationSummary } from "./ChatHistory";
import {
  CONVERSATION_HEADER,
  MAX_HISTORY_TURNS,
  MAX_QUESTION_LENGTH,
  SOURCE_HEADER,
  decodeSource,
  splitResponse,
  type AnswerMeta,
  type ChatRequestBody,
  type ChatSource,
  type HistoryTurn,
} from "@/lib/chat-protocol";

type ErrorKey = "errorGeneric" | "errorRateLimit";
type Status = "idle" | "loading" | "streaming";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  source?: ChatSource | null;
  meta?: AnswerMeta | null;
  error?: ErrorKey;
}

class RateLimitedError extends Error {}

// Chat memory is kept only in this browser (localStorage), never on EduVice's servers.
const STORAGE_KEY = "eduvice.marg.chat.v1";
const MAX_STORED_MESSAGES = 40;

/**
 * Set to false to always show Google's search suggestions under web answers instead of behind
 * the search button. Google's grounding terms require these suggestions to be shown; confirm
 * whether a tap-to-reveal button is acceptable before launch.
 */
const COLLAPSE_SEARCH_SUGGESTIONS = true;

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadMessages(): ChatMessage[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m): m is ChatMessage =>
          typeof m === "object" &&
          m !== null &&
          typeof (m as ChatMessage).id === "string" &&
          ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
          typeof (m as ChatMessage).text === "string",
      )
      .slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    if (messages.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
  } catch {
    // Private browsing or storage disabled: the chat still works, it just isn't remembered.
  }
}

export function ChatBox() {
  const t = useTranslations("Chat");
  const locale = useLocale();
  const inputId = useId();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [greeting, setGreeting] = useState(true);
  const [slow, setSlow] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Signed-in users: chats are saved to their account instead of this device.
  const { status: authStatus } = useSession();
  const signedIn = authStatus === "authenticated";
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const importedRef = useRef(false);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      if (res.ok) setConversations(((await res.json()) as { conversations: ConversationSummary[] }).conversations);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // On sign-in: move any chat they had as a guest into their account, then load their chat list.
  useEffect(() => {
    if (authStatus !== "authenticated" || !loaded || importedRef.current) return;
    importedRef.current = true;
    const guestChat = loadMessages().filter((m) => !m.error && m.text.trim());
    saveMessages([]); // clear the device copy right away, so it's never imported twice
    void (async () => {
      if (guestChat.length > 0) {
        try {
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: guestChat }),
          });
          if (res.ok) setConversationId(((await res.json()) as { id: string }).id);
        } catch (err) {
          console.error(err);
        }
      }
      await refreshConversations();
    })();
  }, [authStatus, loaded, refreshConversations]);

  // Restore the saved conversation, and let Marg wave hello for a moment.
  useEffect(() => {
    setMessages(loadMessages());
    setLoaded(true);
    const timer = setTimeout(() => setGreeting(false), 2800);
    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, []);

  // Guests: save to this device after each completed exchange (not on every streamed chunk).
  useEffect(() => {
    if (loaded && status === "idle" && authStatus === "unauthenticated") saveMessages(messages);
  }, [messages, loaded, status, authStatus]);

  // Scroll to the newest message when one is added.
  useEffect(() => {
    if (messages.length > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // Answers that search the web can take 10+ seconds; reassure the parent.
  useEffect(() => {
    if (status !== "loading") {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  const busy = status !== "idle";
  const margState: MargState =
    status === "loading" ? "thinking" : status === "streaming" ? "talking" : greeting ? "wave" : "idle";
  const starters = t.raw("starters") as string[];

  function update(id: string, patch: Partial<ChatMessage>) {
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;

    const history: HistoryTurn[] = messages
      .filter((m) => !m.error && m.text.trim())
      .map((m) => ({ role: m.role === "user" ? ("user" as const) : ("model" as const), text: m.text }))
      .slice(-MAX_HISTORY_TURNS);

    const botId = newId();
    setMessages((ms) => [...ms, { id: newId(), role: "user", text: q }, { id: botId, role: "assistant", text: "" }]);
    setQuestion("");
    setStatus("loading");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Signed-in users' history is loaded from their account on the server.
      const body: ChatRequestBody = signedIn ? { question: q, locale, conversationId } : { question: q, locale, history };
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (res.status === 429) throw new RateLimitedError();
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const savedId = res.headers.get(CONVERSATION_HEADER);
      if (savedId) setConversationId(savedId);
      update(botId, { source: decodeSource(res.headers.get(SOURCE_HEADER)) });
      setStatus("streaming");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let raw = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        const { text: answer, meta } = splitResponse(raw);
        update(botId, { text: answer, meta });
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      if (!(err instanceof RateLimitedError)) console.error(err);
      update(botId, { error: err instanceof RateLimitedError ? "errorRateLimit" : "errorGeneric" });
    } finally {
      if (!controller.signal.aborted) {
        setStatus("idle");
        if (signedIn) void refreshConversations();
      }
    }
  }

  function newChat() {
    abortRef.current?.abort();
    setMessages([]);
    setConversationId(null);
    setStatus("idle");
    setQuestion("");
  }

  async function openConversation(id: string) {
    if (id === conversationId) return;
    abortRef.current?.abort();
    setStatus("idle");
    try {
      const res = await fetch(`/api/conversations/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const doc = (await res.json()) as { id: string; messages: ChatMessage[] };
      setMessages(doc.messages);
      setConversationId(doc.id);
    } catch (err) {
      console.error(err);
    }
  }

  async function removeConversation(id: string) {
    if (!window.confirm(t("deleteChatConfirm"))) return;
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (id === conversationId) newChat();
      await refreshConversations();
    } catch (err) {
      console.error(err);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(question);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter adds a line. Ignore Enter while an IME is composing.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void ask(question);
    }
  }

  const lastId = messages[messages.length - 1]?.id;

  return (
    <div className={signedIn ? "grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start" : "mx-auto w-full max-w-3xl"}>
      {signedIn && (
        <ChatHistory
          conversations={conversations}
          activeId={conversationId}
          onOpen={(id) => void openConversation(id)}
          onDelete={(id) => void removeConversation(id)}
          onNew={newChat}
        />
      )}
    <div className="flex min-w-0 flex-col gap-5">
      {/* Marg header */}
      <header className="flex items-center gap-4 rounded-3xl bg-white/85 px-4 py-3 shadow-card backdrop-blur sm:px-5">
        <Marg state={margState} className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="wordmark text-3xl sm:text-4xl">{t("title")}</h1>
          <p className="text-sm font-medium" aria-live="polite">
            {status === "loading" ? t(slow ? "thinkingLong" : "thinking") : t("tagline")}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={newChat}
            className="shrink-0 rounded-full border-2 border-blue-dark/30 px-3 py-1.5 text-sm font-bold hover:bg-cream"
          >
            {t("newChat")}
          </button>
        )}
      </header>

      {/* Empty state: greeting and starter questions */}
      {loaded && messages.length === 0 && (
        <section className="flex flex-col gap-4 rounded-3xl bg-cream/90 px-5 py-5 shadow-card">
          <div>
            <h2 className="text-xl font-extrabold">{t("greetingTitle")}</h2>
            <p className="mt-1">{t("greetingBody")}</p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {starters.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => void ask(s)}
                  className="rounded-full border-2 border-blue bg-white px-3 py-1.5 text-start text-sm font-bold text-blue hover:bg-blue hover:text-white"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Conversation */}
      {messages.length > 0 && (
        <ol className="flex flex-col gap-4">
          {messages.map((m) =>
            m.role === "user" ? (
              <li key={m.id} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-ee-md bg-blue px-4 py-3 text-white shadow-card">
                  {m.text}
                </p>
              </li>
            ) : (
              <AssistantMessage
                key={m.id}
                message={m}
                live={m.id === lastId && busy}
                showFollowUps={m.id === lastId && !busy}
                onAsk={(q) => void ask(q)}
              />
            ),
          )}
        </ol>
      )}
      <div ref={endRef} />

      {/* Input */}
      <form
        onSubmit={onSubmit}
        className="sticky bottom-3 z-10 flex items-end gap-2 rounded-3xl border-2 border-blue-dark/15 bg-white p-2 shadow-card"
      >
        <label htmlFor={inputId} className="sr-only">
          {t("inputLabel")}
        </label>
        <textarea
          id={inputId}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("placeholder")}
          maxLength={MAX_QUESTION_LENGTH}
          rows={2}
          className="min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-start outline-none placeholder:text-blue-dark/50"
        />
        <button
          type="submit"
          disabled={busy || !question.trim()}
          aria-label={t("submit")}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue text-white shadow-pill hover:bg-blue-dark disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 rtl:-scale-x-100" aria-hidden="true">
            <path d="M4 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
      <p className="-mt-2 text-xs text-blue-dark/80">
        {t(signedIn ? "accountNote" : "memoryNote")} {t("privacyNote")}{" "}
        {authStatus === "unauthenticated" && (
          <Link href="/signin" className="font-bold text-blue hover:underline">
            {t("signInToSave")}
          </Link>
        )}
      </p>
      <p className="text-sm text-blue-dark/80">{t("disclaimer")}</p>
    </div>
    </div>
  );
}

function AssistantMessage({
  message,
  live,
  showFollowUps,
  onAsk,
}: {
  message: ChatMessage;
  live: boolean;
  showFollowUps: boolean;
  onAsk: (q: string) => void;
}) {
  const t = useTranslations("Chat");
  const [showSuggestions, setShowSuggestions] = useState(!COLLAPSE_SEARCH_SUGGESTIONS);
  const { text, source, meta, error } = message;
  const webSources = meta?.webSources ?? [];
  const official = meta?.webKind === "official";

  return (
    <li className="flex items-start gap-2">
      <Marg state={live ? (text ? "talking" : "thinking") : "idle"} className={`mt-1 h-10 w-10 shrink-0 ${live ? "" : "marg-still"}`} />
      <div className="flex min-w-0 max-w-[92%] flex-1 flex-col gap-3">
        <div className="rounded-3xl rounded-ss-md bg-white px-4 py-3 shadow-card">
          {error ? (
            <p role="alert" className="font-medium">
              {t(error)}
            </p>
          ) : text ? (
            <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
          ) : (
            <span className="flex gap-1 py-2" aria-label={t("thinking")}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
          )}
        </div>

        {/* Guide citation */}
        {source && text && (
          <aside className="rounded-2xl border-s-4 border-blue bg-cream/95 px-4 py-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-blue">{t("sourceLabel")}</h3>
            <p className="mt-1 font-bold">{source.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-blue-dark/90">{source.text}</p>
            <Link href={`/guide/${source.slug}`} className="mt-2 inline-block text-sm font-bold text-blue hover:underline">
              {t("readMore")} <span aria-hidden="true" className="inline-block rtl:rotate-180">→</span>
            </Link>
          </aside>
        )}

        {/* Web sources + Google search suggestions behind an EduVice-styled search button */}
        {webSources.length > 0 && (
          <aside className="flex flex-col gap-2 rounded-2xl border-s-4 border-blue bg-cream/95 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="flex-1 text-xs font-bold uppercase tracking-wide text-blue">
                {t(official ? "webSourcesLabel" : "webSourcesLabelGeneral")}
              </h3>
              {meta?.suggestionsHtml && COLLAPSE_SEARCH_SUGGESTIONS && (
                <button
                  type="button"
                  onClick={() => setShowSuggestions((v) => !v)}
                  aria-expanded={showSuggestions}
                  aria-label={t("searchToggle")}
                  title={t("searchToggle")}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-blue text-yellow shadow-pill hover:bg-blue-dark aria-expanded:bg-blue-dark"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.6" />
                    <path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
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
            <p className="text-xs">{t(official ? "webNote" : "webNoteGeneral")}</p>
            {meta?.suggestionsHtml && showSuggestions && (
              // Google's grounding terms require showing these search suggestions. The HTML comes
              // from Google; it's sandboxed (no scripts) and its links open in a new tab.
              <iframe
                title={t("searchSuggestionsLabel")}
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                srcDoc={`<base target="_blank">${meta.suggestionsHtml}`}
                className="h-16 w-full rounded-xl border-0 bg-white"
              />
            )}
          </aside>
        )}

        {/* Suggested follow-up questions */}
        {showFollowUps && (meta?.followUps.length ?? 0) > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-blue-dark/80">{t("followUpsLabel")}</h3>
            <ul className="flex flex-wrap gap-2">
              {meta!.followUps.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => onAsk(q)}
                    className="rounded-full border-2 border-blue bg-white px-3 py-1.5 text-start text-sm font-bold text-blue hover:bg-blue hover:text-white"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </li>
  );
}
