import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CategoryIcon } from "@/components/CategoryIcon";
import { HorizontalRooms } from "@/components/HorizontalRooms";
import { UniversityNamesBackground } from "@/components/UniversityNamesBackground";
import { BookStool, Chalkboard, FloorLamp, SchoolDesk } from "@/components/SceneProps";
import { CATEGORIES, FAQS_EN } from "@/lib/faqs";
import { initLocale, type LocaleParams } from "@/lib/page";

// The home page is a sequence of "rooms" (inspired by human-md.ai): colored wall, sand floor,
// props on the floor. On wider screens the rooms slide sideways past Marg, who stands big in the
// center (HorizontalRooms). Each room keeps its middle-bottom clear for him.

const NOTE_TILTS = ["-3deg", "2deg", "-1.5deg"];
const POLAROID_TILTS = ["-3deg", "2deg", "-1deg", "3deg", "-2deg", "1.5deg", "-2.5deg"];
// Topics flank Marg on wide screens: four cards on the start side, three on the end side.
const POLAROID_PLACES = [
  "md:col-start-1 md:row-start-1",
  "md:col-start-2 md:row-start-1",
  "md:col-start-1 md:row-start-2",
  "md:col-start-2 md:row-start-2",
  "md:col-start-4 md:row-start-1",
  "md:col-start-5 md:row-start-1",
  "md:col-start-4 md:row-start-2",
];

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
      <HorizontalRooms
        rooms={[
          {
            mood: "wave",
            content: (
              // ── Room 1: blue wall, the wordmark, a lamp and a stool of books ──
              <section className="scene bg-blue text-paper" aria-labelledby="hero-title">
                <UniversityNamesBackground />
                <div className="scene-floor" />
                <h1 id="hero-title" className="sr-only">
                  {tb("name")} — {t("heroLine1")}
                </h1>
                <p
                  aria-hidden="true"
                  className="hero-lift mega absolute inset-x-0 top-[24vh] text-center text-[clamp(4.2rem,15vw,14rem)] text-paper sm:top-[11vh]"
                  lang="en"
                >
                  EduVice<span className="text-yellow">.</span>
                  <span className="serif-accent text-[0.82em] italic">org</span>
                </p>
                <BookStool className="prop-shadow absolute bottom-[calc(var(--floor)*0.42)] end-[20vw] hidden h-[30vh] w-auto lg:block" />
                <FloorLamp className="prop-shadow absolute bottom-[calc(var(--floor)*0.34)] end-[4vw] hidden h-[62vh] w-auto sm:block" />
                {/* captions on the floor, start side */}
                <div className="absolute inset-x-0 bottom-0 flex h-[var(--floor)] flex-col justify-center px-6 text-charcoal md:max-w-[38vw] md:ps-[5vw] md:pe-0">
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
                <p className="corner-label absolute bottom-4 end-6 hidden text-charcoal/70 sm:block">{t("cornerRight")}</p>
              </section>
            ),
          },
          {
            mood: "happy",
            content: (
              // ── Room 2: yellow wall, the story ──
              <section className="scene bg-yellow text-charcoal">
                <div className="scene-floor" />
                <div className="px-6 pt-28 md:max-w-[40vw] md:ps-[6vw] md:pt-32">
                  <h2 className="font-display text-[clamp(2.2rem,4.2vw,4rem)] font-semibold leading-[1.04] tracking-tight">
                    <span className="block">{words(t("storyLead"), 0)}</span>
                    <span className="block text-charcoal/45">{words(t("storyFollow"), 300)}</span>
                  </h2>
                  <p className="mt-5 text-lg leading-relaxed text-charcoal/80" data-reveal data-reveal-delay="500">
                    {t("storyBody")}
                  </p>
                </div>
                <Chalkboard className="parallax-slow absolute end-[5vw] top-[20%] hidden h-[28vh] w-auto lg:block" />
                <SchoolDesk className="prop-shadow absolute bottom-[calc(var(--floor)*0.3)] start-[8vw] hidden h-[16vh] w-auto md:block" />
              </section>
            ),
          },
          {
            mood: "thinking",
            content: (
              // ── Room 3: dark room, three pinned notes above Marg ──
              <section className="scene bg-charcoal text-paper" aria-labelledby="how-heading">
                <div className="scene-floor !bg-paper/10" />
                <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-[calc(var(--floor)+2rem)] pt-28">
                  <h2 id="how-heading" className="mega text-[clamp(2.8rem,6vw,5.5rem)]" data-reveal>
                    {t("notesTitle")}
                    <span className="text-yellow">.</span>
                  </h2>
                  <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
                    {[1, 2, 3].map((n, i) => (
                      <li
                        key={n}
                        className="note relative flex flex-col gap-2 p-5"
                        style={{ "--tilt": NOTE_TILTS[i] } as CSSProperties}
                        data-reveal
                        data-reveal-delay={String(i * 140)}
                      >
                        <span className="font-mono text-sm tracking-widest text-charcoal/60">0{n}</span>
                        <h3 className="font-display text-xl font-bold tracking-tight">{t(`step${n}Title`)}</h3>
                        <p className="text-sm leading-relaxed text-charcoal/75">{t(`step${n}Body`, { count: FAQS_EN.length })}</p>
                      </li>
                    ))}
                  </ol>
                </div>
                <FloorLamp className="absolute bottom-[calc(var(--floor)*0.34)] start-[5vw] hidden h-[40vh] w-auto opacity-90 sm:block" />
              </section>
            ),
          },
          {
            mood: "surprised",
            content: (
              // ── Room 4: paper wall, topics as polaroids on both sides of Marg ──
              <section className="scene bg-paper text-charcoal" aria-labelledby="topics-heading">
                <div className="scene-floor" />
                <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pb-8 pt-28 md:pt-24">
                  <div data-reveal>
                    <h2 id="topics-heading" className="mega text-[clamp(2.6rem,6vw,5.5rem)]">
                      {t("topicsTitle")}
                      <span className="text-blue">.</span>
                    </h2>
                    <p className="serif-accent mt-1 text-2xl italic text-charcoal/70">{t("topicsSub")}</p>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-[1fr_1fr_30vw_1fr_1fr]">
                    {CATEGORIES.map((c, i) => (
                      <li key={c} className={POLAROID_PLACES[i]} data-reveal="scale" data-reveal-delay={String((i % 4) * 90)}>
                        <Link
                          href={`/guide#${c}`}
                          className="polaroid flex h-full flex-col gap-2"
                          style={{ "--tilt": POLAROID_TILTS[i % POLAROID_TILTS.length] } as CSSProperties}
                        >
                          <span className={`relative flex h-24 items-center justify-center overflow-hidden rounded-[2px] md:h-20 lg:h-24 ${i % 2 ? "bg-yellow" : "bg-blue"}`}>
                            <span className="absolute inset-x-0 bottom-0 h-[30%] bg-sand" />
                            <CategoryIcon category={c} className="relative h-12 w-12 bg-paper shadow-lg" />
                          </span>
                          <span className="px-1">
                            <span className="serif-accent block text-lg italic leading-tight">{tc(`${c}.title`)}</span>
                            <span className="mt-1 block text-xs leading-snug text-charcoal/65">{tc(`${c}.description`)}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ),
          },
          {
            mood: "wave",
            content: (
              // ── Room 5: blue wall, ask Marg ──
              <section className="scene bg-blue text-paper" aria-labelledby="ask-heading">
                <div className="scene-floor" />
                <div className="mx-auto grid max-w-7xl items-start gap-10 px-6 pb-[calc(var(--floor)+2rem)] pt-28 md:grid-cols-[1fr_30vw_1fr] md:pt-32">
                  <div className="flex flex-col items-start gap-5">
                    <h2 id="ask-heading" className="mega text-[clamp(3rem,7vw,6.5rem)]" data-reveal>
                      {t("askTitle")}
                    </h2>
                    <p className="text-xl text-paper/85" data-reveal data-reveal-delay="120">
                      {t("askBody")}
                    </p>
                    <Link href="/chat" className="pill pill-yellow px-7 py-3.5 text-base" data-reveal data-reveal-delay="240">
                      {t("cta")} <span aria-hidden="true" className="rtl:rotate-180">→</span>
                    </Link>
                  </div>
                  <div
                    className="relative rotate-2 rounded-xl bg-white p-5 text-ink shadow-2xl md:col-start-3"
                    data-reveal="scale"
                    data-reveal-delay="200"
                    aria-hidden="true"
                  >
                    <p className="ms-auto max-w-[90%] rounded-2xl rounded-ee-md bg-blue px-4 py-2.5 text-sm text-white">
                      {t("previewQuestion")}
                    </p>
                    <div className="mt-3 rounded-2xl rounded-ss-md border border-line px-4 py-3 text-sm leading-relaxed">
                      {t("previewAnswer")}
                    </div>
                    <p className="corner-label mt-3 text-muted">{t("previewSource")}</p>
                  </div>
                </div>
                <BookStool className="prop-shadow absolute bottom-[calc(var(--floor)*0.4)] start-[5vw] hidden h-[20vh] w-auto lg:block" />
              </section>
            ),
          },
        ]}
      />
    </div>
  );
}
