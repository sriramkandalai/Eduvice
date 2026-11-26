import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // zh = Simplified Chinese
  locales: ["en", "es", "zh", "vi", "ar"],
  defaultLocale: "en",
});

export type Locale = (typeof routing.locales)[number];

export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

// Right-to-left locales. Add e.g. "fa" or "ur" here if they are introduced.
const RTL_LOCALES: readonly string[] = ["ar"];

export function getDirection(locale: string): "ltr" | "rtl" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}
