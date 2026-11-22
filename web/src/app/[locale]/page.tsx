import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Marg } from "@/components/Marg";
import { CategoryIcon } from "@/components/CategoryIcon";
import { UniversityNamesBackground } from "@/components/UniversityNamesBackground";
import { BookStool, Chalkboard, FloorLamp, SchoolDesk } from "@/components/SceneProps";
import { CATEGORIES, FAQS_EN } from "@/lib/faqs";
import { initLocale, type LocaleParams } from "@/lib/page";

// The home page is a sequence of full-screen "rooms" (inspired by human-md.ai): a colored wall,
// a sand floor, props standing on it, typewriter captions, and scroll-driven motion.

const NOTE_TILTS = ["-3deg", "2deg", "-1.5deg"];
const POLAROID_TILTS = ["-3deg", "2deg", "-1deg", "3deg", "-2deg", "1.5deg", "-2.5deg"];

export default async function HomePage({ params }: LocaleParams) {
  initLocale(params.locale);
  const t = await getTranslations("Home");
  const tc = await getTranslations("Categories");
  const tb = await getTranslations("Brand");

  const words = (text: string, from: number, className?: string) =>
    text.split(" ").map((w, i) => (
      <span key={`${w}-${i}`} className={`inline-block ${className ?? ""}`} data-reveal data-reveal-delay={String(from + i * 60)}>
        {w}&nbsp;
      </span>
    ));

  return (
    <div className="scenes">
      {/* ── Room 1: blue wall, the wordmark, Marg between a stool of books and a lamp ── */}
      <section className="scene bg-blue text-paper" aria-labelledby="hero-title">
        <UniversityNamesBackground />
        <div className="scene-floor" />

        <h1 id="hero-title" className="sr-only">
          {tb("name")} — {t("heroLine1")}
        </h1>
        <p
          aria-hidden="true"
          className="hero-lift mega absolute inset-x-0 top-[24vh] text-center text-[clamp(4.2rem,16vw,15rem)] text-paper sm:top-[12vh]"
          lang="en"
        >
          EduVice<span className="text-yellow">.</span>
          <span className="serif-accent text-[0.82em] italic">org</span>
        </p>

        <BookStool className="prop-shadow parallax-slow absolute bottom-[calc(var(--floor)*0.42)] start-[3vw] hidden h-[34vh] w-auto sm:block" />
        <FloorLamp className="prop-shadow absolute bottom-[calc(var(--floor)*0.34)] end-[4vw] hidden h-[64vh] w-auto sm:block" />
        <Marg
          state="wave"
          className="prop-shadow absolute bottom-[calc(var(--floor)*0.92)] end-[50%] h-[24vh] w-auto translate-x-1/2 rtl:-translate-x-1/2 sm:bottom-[calc(var(--floor)*0.32)] sm:end-[24vw] sm:h-[40vh] sm:translate-x-0 sm:rtl:translate-x-0"
        />

        {/* captions on the floor */}
        <div className="absolute inset-x-0 bottom-0 flex h-[var(--floor)] flex-col justify-center px-6 text-charcoal sm:px-[22vw]">
          <ul className="typewriter text-xs sm:text-sm">
            <li data-reveal>{t("heroLine1")}</li>
            <li data-reveal data-reveal-delay="120">{t("heroLine2")}</li>
            <li data-reveal data-reveal-delay="240">{t("heroLine3")}</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2" data-reveal data-reveal-delay="360">
            <Link href="/chat" className="pill pill-dark">
              {t("cta")} <span aria-hidden="true" className="rtl:rotate-180">→</span>
            </Link>
            <Link href="/guide" className="pill pill-paper">
              {t("browse")}
            </Link>
          </div>
        </div>
        <p className="corner-label absolute bottom-4 start-6 hidden text-charcoal/70 sm:block">{t("cornerLeft")}</p>
        <p className="corner-label absolute bottom-4 end-6 hidden text-charcoal/70 sm:block">{t("cornerRight")}</p>
      </section>

      {/* ── Room 2: yellow wall, the story ── */}
      <section className="scene bg-yellow text-charcoal">
        <div className="scene-floor" />
        <div className="mx-auto max-w-6xl px-6 pt-28 sm:pt-32">
          <h2 className="font-display text-[clamp(2.4rem,6vw,5rem)] font-semibold leading-[1.02] tracking-tight lg:max-w-[62%]">
            <span className="block">{words(t("storyLead"), 0)}</span>
            <span className="block text-charcoal/45">{words(t("storyFollow"), 300)}</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-charcoal/80" data-reveal data-reveal-delay="500">
            {t("storyBody")}
          </p>
        </div>
        <Chalkboard className="parallax-slow absolute end-[6vw] top-[26%] hidden h-[28vh] w-auto lg:block" />
        <SchoolDesk className="prop-shadow absolute bottom-[calc(var(--floor)*0.36)] end-[8vw] hidden h-[24vh] w-auto md:block" />
        <Marg className="prop-shadow absolute bottom-[calc(var(--floor)*0.3)] start-[8vw] h-[26vh] w-auto sm:start-[14vw] md:start-auto md:end-[36vw]" />
      </section>

      {/* ── Room 3: dark room, three pinned notes ── */}
      <section className="scene bg-charcoal text-paper" aria-labelledby="how-heading">
        <div className="scene-floor !bg-paper/10" />
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-[calc(var(--floor)+3rem)] pt-28 sm:pt-32">
          <h2 id="how-heading" className="mega text-[clamp(3rem,8vw,7rem)]" data-reveal>
            {t("notesTitle")}
            <span className="text-yellow">.</span>
          </h2>
          <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {[1, 2, 3].map((n, i) => (
              <li
                key={n}
                className="note relative flex flex-col gap-3 p-6"
                style={{ "--tilt": NOTE_TILTS[i] } as CSSProperties}
                data-reveal
                data-reveal-delay={String(i * 140)}
              >
                <span className="font-mono text-sm tracking-widest text-charcoal/60">0{n}</span>
                <h3 className="font-display text-2xl font-bold tracking-tight">{t(`step${n}Title`)}</h3>
                <p className="leading-relaxed text-charcoal/75">{t(`step${n}Body`, { count: FAQS_EN.length })}</p>
              </li>
            ))}
          </ol>
        </div>
        <FloorLamp className="absolute bottom-[calc(var(--floor)*0.34)] start-[5vw] hidden h-[46vh] w-auto opacity-90 sm:block" />
        <Marg state="thinking" className="prop-shadow absolute bottom-[calc(var(--floor)*0.3)] end-[10vw] h-[24vh] w-auto" />
      </section>

      {/* ── Room 4: paper wall, topics as polaroids ── */}
      <section className="scene bg-paper text-charcoal" aria-labelledby="topics-heading">
        <div className="scene-floor" />
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-[calc(var(--floor)*0.5)] pt-28 sm:pt-32">
          <div data-reveal>
            <h2 id="topics-heading" className="mega text-[clamp(3rem,8vw,7rem)]">
              {t("topicsTitle")}
              <span className="text-blue">.</span>
            </h2>
            <p className="serif-accent mt-2 text-2xl italic text-charcoal/70 sm:text-3xl">{t("topicsSub")}</p>
          </div>
          <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.map((c, i) => (
              <li key={c} data-reveal="scale" data-reveal-delay={String((i % 4) * 90)}>
                <Link
                  href={`/guide#${c}`}
                  className="polaroid flex h-full flex-col gap-3"
                  style={{ "--tilt": POLAROID_TILTS[i % POLAROID_TILTS.length] } as CSSProperties}
                >
                  {/* a tiny room */}
                  <span className={`relative flex h-28 items-center justify-center overflow-hidden rounded-[2px] sm:h-36 ${i % 2 ? "bg-yellow" : "bg-blue"}`}>
                    <span className="absolute inset-x-0 bottom-0 h-[30%] bg-sand" />
                    <CategoryIcon category={c} className="relative h-14 w-14 bg-paper shadow-lg" />
                  </span>
                  <span className="px-1">
                    <span className="serif-accent block text-xl italic leading-tight">{tc(`${c}.title`)}</span>
                    <span className="mt-1 block text-xs leading-snug text-charcoal/65">{tc(`${c}.description`)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Room 5: blue wall, ask Marg ── */}
      <section className="scene bg-blue text-paper" aria-labelledby="ask-heading">
        <div className="scene-floor" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-[calc(var(--floor)+2rem)] pt-28 sm:pt-32 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-5">
            <h2 id="ask-heading" className="mega text-[clamp(3.5rem,10vw,8.5rem)]" data-reveal>
              {t("askTitle")}
            </h2>
            <p className="max-w-md text-xl text-paper/85" data-reveal data-reveal-delay="120">
              {t("askBody")}
            </p>
            <Link href="/chat" className="pill pill-yellow px-7 py-3.5 text-base" data-reveal data-reveal-delay="240">
              {t("cta")} <span aria-hidden="true" className="rtl:rotate-180">→</span>
            </Link>
          </div>
          <div className="relative rotate-2 rounded-xl bg-white p-5 text-ink shadow-2xl" data-reveal="scale" data-reveal-delay="200" aria-hidden="true">
            <p className="ms-auto max-w-[85%] rounded-2xl rounded-ee-md bg-blue px-4 py-2.5 text-sm text-white">
              {t("previewQuestion")}
            </p>
            <div className="mt-3 max-w-[90%] rounded-2xl rounded-ss-md border border-line px-4 py-3 text-sm leading-relaxed">
              {t("previewAnswer")}
            </div>
            <p className="corner-label mt-3 text-muted">{t("previewSource")}</p>
          </div>
        </div>
        <Marg state="wave" className="prop-shadow absolute bottom-[calc(var(--floor)*0.3)] start-[6vw] h-[22vh] w-auto" />
        <BookStool className="prop-shadow absolute bottom-[calc(var(--floor)*0.4)] end-[6vw] hidden h-[22vh] w-auto sm:block" />
      </section>
    </div>
  );
}
