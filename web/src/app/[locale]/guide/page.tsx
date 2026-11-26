import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFaqsByCategory } from "@/lib/faqs";
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
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:py-14">
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="wordmark text-4xl sm:text-6xl">{t("title")}</h1>
        <p className="text-lg font-medium">{t("intro")}</p>
        <p className="text-sm font-bold uppercase tracking-wide text-blue">{t("topicCount", { count: total })}</p>
      </header>

      <nav aria-label={t("title")}>
        <ul className="flex flex-wrap gap-2">
          {groups.map(({ category }) => (
            <li key={category}>
              <a
                href={`#${category}`}
                className="inline-block rounded-full bg-cream px-4 py-1.5 text-sm font-bold hover:bg-white"
              >
                {tc(`${category}.title`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {groups.map(({ category, faqs }) => (
        <section key={category} id={category} aria-labelledby={`${category}-heading`} className="scroll-mt-6">
          <div className="mb-4 flex flex-col gap-1">
            <h2 id={`${category}-heading`} className="text-2xl font-extrabold">
              {tc(`${category}.title`)}
            </h2>
            <p className="font-medium text-blue-dark/80">{tc(`${category}.description`)}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {faqs.map((faq) => (
              <li key={faq.slug}>
                <Link
                  href={`/guide/${faq.slug}`}
                  lang={faq.isFallback ? "en" : undefined}
                  className="flex h-full items-center rounded-2xl bg-white px-5 py-4 font-bold shadow-card transition-transform hover:-translate-y-0.5 hover:text-blue"
                >
                  {faq.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
