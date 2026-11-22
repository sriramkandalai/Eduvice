import { getTranslations } from "next-intl/server";
import { CONTACT_EMAIL } from "@/config/site";
import { initLocale, pageMetadata, type LocaleParams } from "@/lib/page";

export function generateMetadata({ params: { locale } }: LocaleParams) {
  return pageMetadata(locale, "contactTitle");
}

export default async function ContactPage({ params }: LocaleParams) {
  initLocale(params.locale);
  const t = await getTranslations("Contact");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:py-14">
      <header className="flex flex-col gap-4">
        <h1 className="wordmark text-4xl sm:text-6xl">{t("title")}</h1>
        <p className="text-xl font-medium leading-relaxed">{t("lead")}</p>
      </header>

      <div className="flex flex-col gap-1 rounded-2xl bg-white px-6 py-5 shadow-card">
        <span className="text-xs font-bold uppercase tracking-wide text-blue">{t("emailLabel")}</span>
        <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr" className="text-start text-2xl font-bold break-all hover:underline">
          {CONTACT_EMAIL}
        </a>
      </div>

      <p className="rounded-2xl border border-line border-s-4 border-s-blue bg-white px-6 py-4 leading-relaxed">{t("note")}</p>
    </div>
  );
}
