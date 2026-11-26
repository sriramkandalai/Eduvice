import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFaqsByCategory } from "@/lib/faqs";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Marg } from "@/components/Marg";
import { BookStool } from "@/components/SceneProps";
import { RoomProp } from "@/components/RoomProp";
import { roomTheme, tiltFor } from "@/lib/room-theme";
import { pageMetadata, initLocale, type LocaleParams } from "@/lib/page";

export function generateMetadata({ params: { locale } }: LocaleParams) {
  return pageMetadata(locale, "guideTitle");
}

// The School Guide as a series of rooms (same design as the home page): a yellow entrance room,
// then one room per category with its topics pinned to the wall as paper notes.
export default async function GuidePage({ params }: LocaleParams) {
  const locale = initLocale(params.locale);
  const t = await getTranslations("Guide");
  const tc = await getTranslations("Categories");
  const groups = getFaqsByCategory(locale);
  const total = groups.reduce((n, g) => n + g.faqs.length, 0);

  return (
    <div className="scenes">
      {/* ── Entrance room ── */}
      <section className="scene bg-yellow text-charcoal">
        <div className="scene-floor" />
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 pb-[calc(var(--floor)+1rem)] pt-28 sm:pt-36">
          <p className="corner-label text-charcoal/70" data-reveal>
            {t("topicCount", { count: total })}
          </p>
          <h1 className="mega text-[clamp(3.6rem,11vw,10rem)]" data-reveal data-reveal-delay="80">
            {t("title")}
            <span className="text-blue">.</span>
          </h1>
          <p className="serif-accent max-w-2xl text-2xl italic leading-snug text-charcoal/75 sm:text-3xl" data-reveal data-reveal-delay="160">
            {t("intro")}
          </p>
          {/* category shortcuts */}
          <nav aria-label={t("title")} className="pt-2 lg:max-w-[62%]" data-reveal data-reveal-delay="260">
            <ul className="flex flex-wrap gap-2">
              {groups.map(({ category }) => (
                <li key={category}>
                  <a href={`#${category}`} className="pill pill-paper shadow-sm">
                    {tc(`${category}.title`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <BookStool className="prop-shadow parallax-slow absolute bottom-[calc(var(--floor)*0.55)] end-[22vw] hidden h-[26vh] w-auto lg:block" />
        <Marg state="wave" className="prop-shadow absolute bottom-[calc(var(--floor)*0.5)] end-[6vw] hidden h-[30vh] w-auto md:block" />
      </section>

      {/* ── One room per category ── */}
      {groups.map(({ category, faqs }) => {
        const theme = roomTheme(category);
        return (
          <section
            key={category}
            id={category}
            aria-labelledby={`${category}-heading`}
            // Content rooms get a fixed, shallow floor (a % floor would be huge in tall rooms).
            style={{ "--floor": "9rem" } as CSSProperties}
            className={`scene !min-h-0 scroll-mt-0 ${theme.wall}`}
          >
            <div className={`scene-floor ${theme.floor ?? ""}`} />
            <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-[calc(var(--floor)+2rem)] pt-28 sm:pt-32">
              <div className="flex items-start gap-4" data-reveal>
                <CategoryIcon category={category} className="mt-2 h-12 w-12 shrink-0 bg-paper shadow-md" />
                <div>
                  <h2 id={`${category}-heading`} className="mega text-[clamp(2.6rem,7vw,6rem)]">
                    {tc(`${category}.title`)}
                    <span className={theme.dot}>.</span>
                  </h2>
                  <p className={`serif-accent mt-2 text-2xl italic ${theme.muted}`}>{tc(`${category}.description`)}</p>
                </div>
              </div>

              <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:pe-[14vw]">
                {faqs.map((faq, i) => (
                  <li key={faq.slug} data-reveal data-reveal-delay={String((i % 3) * 110)}>
                    <Link
                      href={`/guide/${faq.slug}`}
                      lang={faq.isFallback ? "en" : undefined}
                      className={`note relative flex h-full flex-col gap-2 p-5 ${theme.note}`}
                      style={{ "--tilt": tiltFor(i) } as CSSProperties}
                    >
                      <span className="font-mono text-xs tracking-widest text-charcoal/50">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display text-xl font-bold leading-snug tracking-tight">{faq.title}</span>
                      <span className="mt-auto pt-2 text-sm font-semibold text-blue">
                        <span aria-hidden="true" className="inline-block rtl:rotate-180">→</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <RoomProp prop={theme.prop} />
          </section>
        );
      })}
    </div>
  );
}
