import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { FAQS_EN, getFaq, getFaqs } from "@/lib/faqs";
import { initLocale } from "@/lib/page";
import { roomTheme, tiltFor } from "@/lib/room-theme";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Marg } from "@/components/Marg";
import { RoomProp } from "@/components/RoomProp";

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

// A topic as a room: the category's wall with the title, the answer pinned below as a big paper
// note, then Marg and related topics.
export default async function TopicPage({ params }: Props) {
  const locale = initLocale(params.locale);
  const faq = getFaq(locale, params.slug);
  if (!faq) notFound();

  const t = await getTranslations("Guide");
  const tc = await getTranslations("Categories");
  const theme = roomTheme(faq.category);
  const related = getFaqs(locale)
    .filter((f) => f.category === faq.category && f.slug !== faq.slug)
    .slice(0, 3);

  return (
    <div className="scenes">
      {/* ── The topic's room ── */}
      <section className={`scene !min-h-[78svh] ${theme.wall}`}>
        <div className={`scene-floor ${theme.floor ?? ""}`} />
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pb-[calc(var(--floor)+1rem)] pt-28 sm:pt-36">
          <nav aria-label={t("breadcrumb")} data-reveal>
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/guide" className="pill pill-paper shadow-sm">
                  {t("backToGuide")}
                </Link>
              </li>
              <li aria-hidden="true" className="opacity-60 rtl:rotate-180">
                ›
              </li>
              <li>
                <Link href={`/guide#${faq.category}`} className="pill pill-paper gap-2 shadow-sm">
                  <CategoryIcon category={faq.category} className="h-5 w-5 rounded-md [&_svg]:h-3.5 [&_svg]:w-3.5" />
                  {tc(`${faq.category}.title`)}
                </Link>
              </li>
            </ol>
          </nav>
          <h1
            lang={faq.isFallback ? "en" : undefined}
            className="font-display text-[clamp(2.6rem,6.5vw,5.5rem)] font-bold leading-[1.02] tracking-tight lg:max-w-[80%]"
            data-reveal
            data-reveal-delay="100"
          >
            {faq.title}
            <span className={theme.dot}>.</span>
          </h1>
          <p className={`serif-accent text-2xl italic ${theme.muted}`} data-reveal data-reveal-delay="180">
            {tc(`${faq.category}.description`)}
          </p>
        </div>
        <RoomProp prop={theme.prop} />
      </section>

      {/* ── The answer, pinned as a big note ── */}
      <div className="bg-paper">
        <div className="mx-auto -mt-[14vh] flex max-w-3xl flex-col gap-12 px-6 pb-20">
          <article
            lang={faq.isFallback ? "en" : undefined}
            className="note relative z-10 bg-white p-7 sm:p-10"
            style={{ "--tilt": "-0.8deg" } as CSSProperties}
            data-reveal="scale"
            data-reveal-delay="200"
          >
            {faq.isFallback && (
              <p lang={locale} className="mb-5 rounded-lg bg-yellow/40 px-4 py-3 text-sm font-medium">
                {t("translationNote")}
              </p>
            )}
            <p className="text-lg leading-relaxed text-charcoal sm:text-xl sm:leading-relaxed">{faq.text}</p>
          </article>

          {/* Ask Marg */}
          <aside className="relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl bg-blue px-6 py-8 text-center text-paper sm:flex-row sm:text-start" data-reveal>
            <Marg state="wave" className="h-24 w-24 shrink-0" />
            <div className="flex flex-1 flex-col gap-1">
              <h2 className="font-display text-2xl font-bold tracking-tight">{t("askTitle")}</h2>
              <p className="text-paper/85">{t("askBody")}</p>
            </div>
            <Link href="/chat" className="pill pill-yellow shrink-0 px-6 py-3">
              {t("askCta")} <span aria-hidden="true" className="rtl:rotate-180">→</span>
            </Link>
          </aside>

          {related.length > 0 && (
            <section aria-labelledby="related-heading" className="flex flex-col gap-6">
              <h2 id="related-heading" className="mega text-4xl text-charcoal sm:text-5xl" data-reveal>
                {t("related")}
                <span className="text-blue">.</span>
              </h2>
              <ul className="grid gap-8 sm:grid-cols-3">
                {related.map((r, i) => (
                  <li key={r.slug} data-reveal data-reveal-delay={String(i * 110)}>
                    <Link
                      href={`/guide/${r.slug}`}
                      lang={r.isFallback ? "en" : undefined}
                      className="note relative flex h-full flex-col gap-2 bg-white p-5"
                      style={{ "--tilt": tiltFor(i + 1) } as CSSProperties}
                    >
                      <span className="font-display text-lg font-bold leading-snug tracking-tight text-charcoal">{r.title}</span>
                      <span aria-hidden="true" className="mt-auto inline-block text-blue rtl:rotate-180">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
