import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // zh = Simplified Chinese. Indian languages: hi Hindi, bn Bengali, te Telugu, mr Marathi,
  // ta Tamil, gu Gujarati, kn Kannada, ml Malayalam, pa Punjabi (Gurmukhi script).
  locales: ["en", "es", "zh", "vi", "hi", "bn", "te", "mr", "ta", "gu", "kn", "ml", "pa"],
  defaultLocale: "en",
});

export type Locale = (typeof routing.locales)[number];

export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

// Right-to-left locales. None today; the layout already supports RTL if one is added.
const RTL_LOCALES: readonly string[] = [];

export function getDirection(locale: string): "ltr" | "rtl" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}
