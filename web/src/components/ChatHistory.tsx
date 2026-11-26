"use client";

import { useFormatter, useTranslations } from "next-intl";

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

/** Signed-in users' saved chats: a sidebar on large screens, a collapsible panel on phones. */
export function ChatHistory({
  conversations,
  activeId,
  onOpen,
  onDelete,
  onNew,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  const t = useTranslations("Chat");
  const format = useFormatter();

  const list = (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onNew}
        className="rounded-full bg-blue px-4 py-2 text-sm font-bold text-white shadow-pill hover:bg-blue-dark"
      >
        + {t("newChat")}
      </button>
      {conversations.length === 0 ? (
        <p className="px-1 text-sm text-blue-dark/80">{t("noSavedChats")}</p>
      ) : (
        <ul className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
          {conversations.map((c) => (
            <li key={c.id} className="group flex items-center gap-1">
              <button
                type="button"
                onClick={() => onOpen(c.id)}
                aria-current={c.id === activeId ? "true" : undefined}
                className="min-w-0 flex-1 rounded-xl px-3 py-2 text-start hover:bg-cream aria-[current=true]:bg-cream"
              >
                <span className="block truncate text-sm font-bold">{c.title}</span>
                <span className="block text-xs text-blue-dark/70">
                  {format.relativeTime(new Date(c.updatedAt), new Date())}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(c.id)}
                aria-label={t("deleteChat", { title: c.title })}
                title={t("deleteChat", { title: c.title })}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-blue-dark/60 hover:bg-cream hover:text-blue-dark"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <aside className="rounded-3xl bg-white/90 p-3 shadow-card lg:sticky lg:top-4">
      {/* Phones: collapsible. Large screens: always open. */}
      <details className="lg:hidden">
        <summary className="cursor-pointer px-1 py-1 font-extrabold">
          {t("yourChats")} ({conversations.length})
        </summary>
        <div className="pt-3">{list}</div>
      </details>
      <div className="hidden lg:block">
        <h2 className="mb-3 px-1 font-extrabold">{t("yourChats")}</h2>
        {list}
      </div>
    </aside>
  );
}
