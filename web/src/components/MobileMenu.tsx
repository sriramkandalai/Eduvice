"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";

/** Phone navigation: a "Menu" pill that opens a small paper panel. */
export function MobileMenu() {
  const t = useTranslations("Navbar");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  // Close on navigation, outside click, or Escape.
  useEffect(() => setOpen(false), [pathname]);
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="pill pill-paper shadow-sm"
      >
        {t("menu")}
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
          <path d={open ? "M3 3l10 10M13 3 3 13" : "M2 5h12M2 11h12"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div
          id="mobile-menu"
          className="absolute end-0 top-12 flex w-64 flex-col gap-3 rounded-2xl bg-paper p-4 text-charcoal shadow-2xl"
        >
          <Link href="/guide" className="font-display text-xl font-bold">
            {t("guide")}
          </Link>
          <Link href="/chat" className="font-display text-xl font-bold">
            {t("chat")}
          </Link>
          <div className="flex items-center justify-between gap-2 border-t border-charcoal/10 pt-3">
            <LanguageSwitcher />
            <UserMenu />
          </div>
        </div>
      )}
    </div>
  );
}
