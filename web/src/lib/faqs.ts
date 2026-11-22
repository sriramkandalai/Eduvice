// The FAQ library: one JSON file per language in data/faqs/. English (en.json) is the
// source of truth and the only file that is embedded for search. Other languages are
// translations with the same slugs (see scripts/translate.ts).

import en from "../../data/faqs/en.json";
import type { Locale } from "@/i18n/routing";

export const CATEGORIES = [
  "getting-started",
  "how-school-works",
  "learning-support",
  "family-rights",
  "daily-life",
  "health-safety",
  "high-school-college",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Faq {
  slug: string;
  category: Category;
  title: string;
  text: string;
}

/** A FAQ as shown to a reader, with a flag for whether it fell back to English. */
export interface LocalizedFaq extends Faq {
  isFallback: boolean;
}

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

function validate(raw: unknown, label: string): Faq[] {
  if (!Array.isArray(raw)) throw new Error(`${label}: expected an array`);
  return raw.map((item: unknown, i) => {
    const f = item as Record<string, unknown>;
    if (
      typeof f.slug !== "string" ||
      typeof f.title !== "string" ||
      typeof f.text !== "string" ||
      typeof f.category !== "string" ||
      !isCategory(f.category)
    ) {
      throw new Error(`${label}: invalid entry at index ${i}`);
    }
    return { slug: f.slug, category: f.category, title: f.title, text: f.text };
  });
}

export const FAQS_EN: readonly Faq[] = validate(en, "data/faqs/en.json");

type TranslationMap = Record<string, { title: string; text: string }>;

function toTranslationMap(raw: unknown, label: string): TranslationMap {
  if (!Array.isArray(raw)) throw new Error(`${label}: expected an array`);
  const map: TranslationMap = {};
  for (const item of raw as Array<Record<string, unknown>>) {
    if (typeof item.slug === "string" && typeof item.title === "string" && typeof item.text === "string") {
      map[item.slug] = { title: item.title, text: item.text };
    }
  }
  return map;
}

/**
 * Translations, keyed by locale. Each file only needs `slug`, `title` and `text`;
 * category always comes from English. Missing topics fall back to English.
 * Add a line here for each data/faqs/<locale>.json file.
 */
const TRANSLATIONS: Partial<Record<Locale, TranslationMap>> = {};

function localize(faq: Faq, locale: Locale): LocalizedFaq {
  if (locale === "en") return { ...faq, isFallback: false };
  const t = TRANSLATIONS[locale]?.[faq.slug];
  return t ? { ...faq, ...t, isFallback: false } : { ...faq, isFallback: true };
}

export function getFaqs(locale: Locale): LocalizedFaq[] {
  return FAQS_EN.map((f) => localize(f, locale));
}

export function getFaq(locale: Locale, slug: string): LocalizedFaq | undefined {
  const faq = FAQS_EN.find((f) => f.slug === slug);
  return faq ? localize(faq, locale) : undefined;
}

export function getFaqsByCategory(locale: Locale): Array<{ category: Category; faqs: LocalizedFaq[] }> {
  const all = getFaqs(locale);
  return CATEGORIES.map((category) => ({ category, faqs: all.filter((f) => f.category === category) }));
}
