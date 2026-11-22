import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFaqsByCategory } from "@/lib/faqs";
import { CategoryIcon } from "@/components/CategoryIcon";
import { pageMetadata, initLocale, type LocaleParams } from "@/lib/page";

export function generateMetadata({ params: { locale } }: LocaleParams) {
  return pageMetadata(locale, "guideTitle");
}

export default async function GuidePage({ params }: LocaleParams) {
  const locale = initLocale(params.locale);
  const t = await getTranslations("Guide");
  const tc = await getTranslations("Categories");
  const groups = getFaqsByCategory(locale);
  const total = groups.reduce((n, g) => n + g.faqs.length, 0);

  return (
    <>
    <header className="band-blue bg-blue text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-12 sm:py-16">
        <p className="eyebrow self-start" data-reveal>
          {t("topicCount", { count: total })}
        </p>
        <h1 className="wordmark text-4xl sm:text-6xl" data-reveal data-reveal-delay="80">
          {t("title")}
        </h1>
        <p className="max-w-3xl text-lg text-white/85" data-reveal data-reveal-delay="160">
          {t("intro")}
        </p>
        <nav aria-label={t("title")} className="pt-2" data-reveal data-reveal-delay="240">
          <ul className="flex flex-wrap gap-2">
            {groups.map(({ category }) => (
              <li key={category}>
                <a href={`#${category}`} className="btn-ghost px-4 py-1.5 text-sm">
                  {tc(`${category}.title`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12 sm:py-14">

      {groups.map(({ category, faqs }) => (
        <section key={category} id={category} aria-labelledby={`${category}-heading`} className="scroll-mt-24">
          <div className="mb-4 flex items-center gap-3" data-reveal>
            <CategoryIcon category={category} className="h-11 w-11 shrink-0" />
            <div className="flex flex-col">
              <h2 id={`${category}-heading`} className="font-display text-2xl font-bold tracking-tight">
                {tc(`${category}.title`)}
              </h2>
              <p className="text-muted">{tc(`${category}.description`)}</p>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {faqs.map((faq, i) => (
              <li key={faq.slug} data-reveal data-reveal-delay={String((i % 3) * 70)}>
                <Link
                  href={`/guide/${faq.slug}`}
                  lang={faq.isFallback ? "en" : undefined}
                  className="glass card-hover flex h-full items-center rounded-2xl px-5 py-4 font-semibold shadow-card"
                >
                  {faq.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
    </>
  );
}
