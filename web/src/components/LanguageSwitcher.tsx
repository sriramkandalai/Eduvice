"use client";

import { useId, useTransition, type ChangeEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

// A native <select> works well with screen readers, keyboards, and phones, and scales to many languages.
export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const current = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const id = useId();
  const [pending, startTransition] = useTransition();

  function onChange(e: ChangeEvent<HTMLSelectElement>) {
    const locale = e.target.value as Locale;
    // usePathname() returns the real path without the locale (e.g. /guide/school-buses),
    // so the reader stays on the same page in the new language.
    startTransition(() => router.replace(pathname, { locale }));
  }

  return (
    <div className="flex items-center">
      <label htmlFor={id} className="sr-only">
        {t("label")}
      </label>
      <select
        id={id}
        value={current}
        onChange={onChange}
        disabled={pending}
        className="cursor-pointer rounded-full border-2 border-blue-dark/20 bg-cream py-1.5 ps-3 pe-8 text-sm font-bold text-blue-dark disabled:opacity-60"
      >
        {routing.locales.map((locale) => (
          <option key={locale} value={locale} lang={locale}>
            {t(`names.${locale}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
