"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function UserMenu() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status === "loading") return <span className="h-9 w-9" aria-hidden="true" />;

  if (!session?.user) {
    return (
      <Link href="/signin" className="pill pill-paper whitespace-nowrap shadow-sm">
        {t("signIn")}
      </Link>
    );
  }

  const { name, email, image } = session.user;
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();

  async function deleteAccount() {
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      try {
        localStorage.removeItem("eduvice.marg.chat.v1");
      } catch {
        // ignore
      }
      await signOut({ redirectTo: `/${locale}` });
    } catch (err) {
      console.error(err);
      window.alert(t("deleteFailed"));
      setDeleting(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("menuLabel")}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-blue text-sm font-extrabold text-yellow"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- small avatar from Google; no optimization needed
          <img src={image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="glass absolute end-0 top-11 z-50 flex w-64 flex-col gap-1 rounded-2xl p-2 shadow-card"
        >
          <div className="px-3 py-2">
            {name && <p className="truncate font-bold">{name}</p>}
            <p className="truncate text-sm text-muted" dir="ltr">
              {email}
            </p>
          </div>
          <Link
            href="/chat"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="rounded-xl px-3 py-2 text-start text-sm font-bold hover:bg-mist"
          >
            {t("myChats")}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => void signOut({ redirectTo: `/${locale}` })}
            className="rounded-xl px-3 py-2 text-start text-sm font-bold hover:bg-mist"
          >
            {t("signOut")}
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={deleting}
            onClick={() => void deleteAccount()}
            className="rounded-xl px-3 py-2 text-start text-xs font-bold text-muted hover:bg-mist disabled:opacity-50"
          >
            {t("deleteAccount")}
          </button>
        </div>
      )}
    </div>
  );
}
