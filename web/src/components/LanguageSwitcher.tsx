"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const current = useLocale();
  const pathname = usePathname();

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex items-center gap-1 rounded-full bg-cream p-1"
    >
      {routing.locales.map((locale) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            hrefLang={locale}
            aria-current={active ? "true" : undefined}
            title={t(`${locale}Full`)}
            className={
              "rounded-full px-3 py-1 text-sm font-bold transition-colors " +
              (active ? "bg-blue text-white" : "text-blue-dark hover:bg-yellow")
            }
          >
            {t(locale)}
          </Link>
        );
      })}
    </div>
  );
}
