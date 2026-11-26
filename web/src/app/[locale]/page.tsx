import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Marg } from "@/components/Marg";
import { UniversityNamesBackground } from "@/components/UniversityNamesBackground";
import { CATEGORIES, FAQS_EN } from "@/lib/faqs";
import { initLocale, type LocaleParams } from "@/lib/page";

const STEPS = [1, 2, 3] as const;

export default async function HomePage({ params }: LocaleParams) {
  initLocale(params.locale);
  const t = await getTranslations("Home");
  const tc = await getTranslations("Categories");

  return (
    <>
      <UniversityNamesBackground />
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
        <Marg state="wave" className="h-36 w-36 sm:h-44 sm:w-44" />

        <p className="rounded-full bg-cream px-4 py-1 text-sm font-bold uppercase tracking-widest">
          {t("eyebrow")}
        </p>

        <h1 className="wordmark text-5xl sm:text-7xl">{t("title")}</h1>

        <p className="max-w-xl text-lg font-medium sm:text-xl">{t("valueProp")}</p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/chat"
            className="rounded-full bg-blue px-8 py-3.5 text-lg font-bold uppercase tracking-wider text-white shadow-pill hover:bg-blue-dark"
          >
            {t("cta")}
          </Link>
          <Link
            href="/guide"
            className="rounded-full border-2 border-blue-dark px-6 py-3 font-bold hover:bg-cream"
          >
            {t("browse")}
          </Link>
        </div>
      </section>

      <section aria-labelledby="how-heading" className="bg-cream">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-14">
          <h2 id="how-heading" className="wordmark text-3xl sm:text-4xl">
            {t("howTitle")}
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((n) => (
              <li key={n} className="flex flex-col gap-2 rounded-2xl bg-white px-5 py-5 shadow-card">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue text-lg font-extrabold text-white"
                >
                  {n}
                </span>
                <h3 className="text-lg font-extrabold">{t(`step${n}Title`)}</h3>
                <p>{t(`step${n}Body`, { count: FAQS_EN.length })}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="topics-heading" className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-14">
        <h2 id="topics-heading" className="wordmark text-3xl sm:text-4xl">
          {t("topicsTitle")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <li key={c}>
              <Link
                href={`/guide#${c}`}
                className="flex h-full flex-col gap-1 rounded-2xl bg-white px-5 py-4 shadow-card transition-transform hover:-translate-y-0.5"
              >
                <span className="text-lg font-extrabold text-blue">{tc(`${c}.title`)}</span>
                <span className="text-sm">{tc(`${c}.description`)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
