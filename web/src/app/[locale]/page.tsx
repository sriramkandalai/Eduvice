import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Marg } from "@/components/Marg";
import { CategoryIcon } from "@/components/CategoryIcon";
import { UniversityNamesBackground } from "@/components/UniversityNamesBackground";
import { CATEGORIES, FAQS_EN } from "@/lib/faqs";
import { routing } from "@/i18n/routing";
import { initLocale, type LocaleParams } from "@/lib/page";

const STEPS = [1, 2, 3] as const;

// The whole home page is one royal-blue canvas (like the coming-soon page is one yellow canvas),
// with college names scrolling faintly behind everything. Content sits on white cards; yellow is
// the accent.
export default async function HomePage({ params }: LocaleParams) {
  initLocale(params.locale);
  const t = await getTranslations("Home");
  const tc = await getTranslations("Categories");
  const highlight = (chunks: ReactNode) => <span className="marker">{chunks}</span>;

  return (
    <div className="band-blue relative isolate bg-blue text-white">
      <UniversityNamesBackground />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col items-start gap-6">
          <p className="eyebrow" data-reveal>
            {t("eyebrow")}
          </p>
          <h1 className="wordmark text-5xl sm:text-6xl lg:text-7xl" data-reveal data-reveal-delay="80">
            {t.rich("title", { hl: highlight })}
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl" data-reveal data-reveal-delay="160">
            {t("valueProp")}
          </p>
          <div className="flex flex-wrap items-center gap-3" data-reveal data-reveal-delay="240">
            <Link href="/chat" className="btn-accent px-6 py-3 text-base">
              {t("cta")}
              <span aria-hidden="true" className="rtl:rotate-180">→</span>
            </Link>
            <Link href="/guide" className="btn-ghost px-6 py-3 text-base">
              {t("browse")}
            </Link>
          </div>
          <ul
            className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-sm font-medium text-white/85"
            data-reveal
            data-reveal-delay="320"
          >
            {[
              t("statTopics", { count: FAQS_EN.length }),
              t("statLanguages", { count: routing.locales.length }),
              t("statFree"),
            ].map((label) => (
              <li key={label} className="flex items-center gap-2">
                <Check />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Chat preview */}
        <div data-reveal="scale" data-reveal-delay="200">
          <div
            className="float mx-auto w-full max-w-md overflow-hidden rounded-[1.25rem] bg-white text-ink shadow-[0_30px_60px_-20px_rgb(10_20_60_/_0.6)]"
            aria-hidden="true"
          >
            <div className="flex items-center gap-3 border-b border-line bg-mist px-5 py-3">
              <Marg state="wave" className="h-11 w-11" />
              <div>
                <p className="font-display font-bold">Marg</p>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow" />
                  {t("previewStatus")}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 p-5">
              <p className="ms-auto max-w-[85%] rounded-2xl rounded-ee-md bg-blue px-4 py-2.5 text-sm text-white">
                {t("previewQuestion")}
              </p>
              <div className="max-w-[90%] rounded-2xl rounded-ss-md border border-line bg-white px-4 py-3 text-sm leading-relaxed">
                {t("previewAnswer")}
              </div>
              <p className="text-xs font-semibold text-muted">{t("previewSource")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-20">
        <h2 id="how-heading" className="wordmark text-3xl sm:text-4xl" data-reveal>
          {t("howTitle")}
        </h2>
        <ol className="grid gap-5 sm:grid-cols-3">
          {STEPS.map((n, i) => (
            <li
              key={n}
              className="flex flex-col gap-3 rounded-[1.25rem] bg-white p-6 text-ink shadow-card-lg"
              data-reveal
              data-reveal-delay={String(i * 120)}
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow font-display text-lg font-bold text-blue-dark"
              >
                {n}
              </span>
              <h3 className="font-display text-lg font-bold">{t(`step${n}Title`)}</h3>
              <p className="leading-relaxed text-muted">{t(`step${n}Body`, { count: FAQS_EN.length })}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Topics */}
      <section aria-labelledby="topics-heading" className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4" data-reveal>
          <h2 id="topics-heading" className="wordmark text-3xl sm:text-4xl">
            {t("topicsTitle")}
          </h2>
          <Link href="/guide" className="text-sm font-bold text-yellow hover:underline">
            {t("browse")} <span aria-hidden="true" className="inline-block rtl:rotate-180">→</span>
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c, i) => (
            <li key={c} data-reveal data-reveal-delay={String((i % 3) * 90)}>
              <Link
                href={`/guide#${c}`}
                className="card-hover flex h-full items-start gap-4 rounded-[1.25rem] bg-white p-5 text-ink shadow-card-lg"
              >
                <CategoryIcon category={c} className="h-11 w-11 shrink-0" />
                <span className="flex flex-col gap-1">
                  <span className="font-display font-bold">{tc(`${c}.title`)}</span>
                  <span className="text-sm leading-relaxed text-muted">{tc(`${c}.description`)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Closing call to action — yellow panel on the blue */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div
          className="flex flex-col items-center gap-6 rounded-[1.75rem] bg-yellow px-6 py-10 text-center text-blue-dark shadow-card-lg sm:flex-row sm:px-10 sm:text-start"
          data-reveal="scale"
        >
          <Marg state="wave" className="h-28 w-28 shrink-0 sm:h-32 sm:w-32" />
          <div className="flex flex-1 flex-col gap-2">
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t("finalTitle")}</h2>
            <p className="text-lg text-blue-dark/80">{t("finalBody")}</p>
          </div>
          <Link href="/chat" className="btn-primary px-7 py-3.5 text-base">
            {t("cta")}
            <span aria-hidden="true" className="rtl:rotate-180">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="var(--color-yellow)" />
      <path d="M6 10.5 8.5 13 14 7.5" fill="none" stroke="var(--color-blue-dark)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
