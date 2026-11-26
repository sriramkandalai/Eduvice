import { getRequestConfig } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";
import { isLocale, routing } from "./routing";

async function loadMessages(locale: string): Promise<AbstractIntlMessages> {
  return (await import(`../../messages/${locale}.json`)).default as AbstractIntlMessages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : routing.defaultLocale;

  let messages: AbstractIntlMessages;
  try {
    messages = await loadMessages(locale);
  } catch {
    // A missing or broken translation file should never take the site down: show English.
    console.error(`[i18n] Could not load messages/${locale}.json; falling back to English.`);
    messages = await loadMessages(routing.defaultLocale);
  }

  return { locale, messages };
});
