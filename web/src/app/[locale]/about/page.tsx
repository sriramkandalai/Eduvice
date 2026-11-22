import { getTranslations } from "next-intl/server";
import { initLocale, pageMetadata, type LocaleParams } from "@/lib/page";

export function generateMetadata({ params: { locale } }: LocaleParams) {
  return pageMetadata(locale, "aboutTitle");
}

const PRINCIPLES = [1, 2, 3, 4] as const;

export default async function AboutPage({ params }: LocaleParams) {
  initLocale(params.locale);
  const t = await getTranslations("About");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10 sm:py-14">
      <header className="flex flex-col gap-4">
        <h1 className="wordmark text-4xl sm:text-6xl">{t("title")}</h1>
        <p className="text-xl font-medium leading-relaxed">{t("lead")}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-extrabold">{t("whyTitle")}</h2>
        <p className="text-lg leading-relaxed">{t("whyBody")}</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-extrabold">{t("principlesTitle")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PRINCIPLES.map((n) => (
            <li key={n} className="rounded-2xl bg-white px-5 py-4 shadow-card">
              <h3 className="text-lg font-extrabold text-blue">{t(`principle${n}Title`)}</h3>
              <p className="mt-1">{t(`principle${n}Body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border-s-4 border-blue bg-cream px-6 py-5">
        <h2 className="text-xl font-extrabold">{t("limitsTitle")}</h2>
        <p className="leading-relaxed">{t("limitsBody")}</p>
      </section>
    </div>
  );
}
