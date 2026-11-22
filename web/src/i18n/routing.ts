import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
});

export type Locale = (typeof routing.locales)[number];

export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

// Add right-to-left locales here (e.g. "ar", "fa", "ur") when they are introduced.
const RTL_LOCALES: readonly string[] = [];

export function getDirection(locale: string): "ltr" | "rtl" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}
