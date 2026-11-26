import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/i18n/routing";

export type LocaleParams = { params: { locale: string } };

/** Validate the [locale] segment and enable static rendering for this request. */
export function initLocale(locale: string): Locale {
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  return locale;
}

type MetadataKey =
  | "guideTitle"
  | "chatTitle"
  | "aboutTitle"
  | "contactTitle"
  | "privacyTitle"
  | "termsTitle";

/** Page <title> from the Metadata namespace; the layout appends "— EduVice". */
export async function pageMetadata(locale: string, key: MetadataKey): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t(key) };
}

/** Format an ISO date (YYYY-MM-DD) for the reader's language. */
export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}
