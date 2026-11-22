// The FAQ library: one JSON file per language in data/faqs/. English (en.json) is the
// source of truth and the only file that is embedded for search. Other languages are
// translations with the same slugs (see scripts/translate.ts).

import en from "../../data/faqs/en.json";

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
