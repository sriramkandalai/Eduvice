import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { FAQS_EN, getFaq, getFaqs } from "@/lib/faqs";
import { initLocale } from "@/lib/page";

type Props = { params: { locale: string; slug: string } };

export function generateStaticParams() {
  return FAQS_EN.map((f) => ({ slug: f.slug }));
}

export function generateMetadata({ params: { locale, slug } }: Props): Metadata {
  const faq = isLocale(locale) ? getFaq(locale, slug) : undefined;
  if (!faq) return {};
  const description = faq.text.length > 160 ? `${faq.text.slice(0, 157).trimEnd()}…` : faq.text;
  return { title: faq.title, description };
}

export default async function TopicPage({ params }: Props) {
  const locale = initLocale(params.locale);
  const faq = getFaq(locale, params.slug);
  if (!faq) notFound();

  const t = await getTranslations("Guide");
  const tc = await getTranslations("Categories");
  const related = getFaqs(locale)
    .filter((f) => f.category === faq.category && f.slug !== faq.slug)
    .slice(0, 4);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:py-14">
      <nav aria-label={t("breadcrumb")}>
        <ol className="flex flex-wrap items-center gap-2 text-sm font-bold">
          <li>
            <Link href="/guide" className="hover:underline">
              {t("backToGuide")}
            </Link>
          </li>
          <li aria-hidden="true" className="rtl:rotate-180">
            ›
          </li>
          <li>
            <Link href={`/guide#${faq.category}`} className="hover:underline">
              {tc(`${faq.category}.title`)}
            </Link>
          </li>
        </ol>
      </nav>

      <article lang={faq.isFallback ? "en" : undefined} className="flex flex-col gap-5">
        <h1 className="wordmark text-4xl leading-tight sm:text-5xl">{faq.title}</h1>
        {faq.isFallback && (
          <p lang={locale} className="rounded-xl bg-cream px-4 py-3 text-sm font-medium">
            {t("translationNote")}
          </p>
        )}
        <p className="rounded-2xl bg-white px-6 py-5 text-lg leading-relaxed shadow-card">{faq.text}</p>
      </article>

      <aside className="flex flex-col items-start gap-3 rounded-2xl bg-blue px-6 py-5 text-white">
        <h2 className="text-xl font-extrabold">{t("askTitle")}</h2>
        <p className="font-medium">{t("askBody")}</p>
        <Link
          href="/chat"
          className="rounded-full bg-yellow px-5 py-2 font-bold text-blue-dark hover:bg-cream"
        >
          {t("askCta")}
        </Link>
      </aside>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="flex flex-col gap-3">
          <h2 id="related-heading" className="text-xl font-extrabold">
            {t("related")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/guide/${r.slug}`}
                  lang={r.isFallback ? "en" : undefined}
                  className="flex h-full items-center rounded-2xl bg-cream px-5 py-3 font-bold hover:bg-white"
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
