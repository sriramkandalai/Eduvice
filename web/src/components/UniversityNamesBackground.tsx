"use client";

import { useEffect, useRef } from "react";

// The home page background: tilted rows of US college names scrolling in alternating directions,
// the same look as the coming-soon page (root index.html). Purely decorative (aria-hidden); the
// names are proper nouns, so they aren't translated.
const UNIVERSITIES = [
  "Harvard University", "Stanford University", "MIT", "Yale University", "Princeton University",
  "Columbia University", "University of Chicago", "Duke University", "Caltech", "Johns Hopkins University",
  "Northwestern University", "Brown University", "Cornell University", "Dartmouth College", "Rice University",
  "Vanderbilt University", "UC Berkeley", "UCLA", "University of Michigan", "University of Texas at Austin",
  "Georgia Tech", "University of Virginia", "UNC Chapel Hill", "Carnegie Mellon University", "NYU",
  "University of Florida", "Ohio State University", "Penn State", "Purdue University", "University of Washington",
  "University of Wisconsin", "Texas A&M University", "Arizona State University", "University of Southern California", "Boston University",
  "Emory University", "Notre Dame", "Georgetown University", "Tufts University", "Wake Forest University",
  "Williams College", "Amherst College", "Swarthmore College", "Pomona College", "Bowdoin College",
  "Middlebury College", "Carleton College", "Davidson College", "Colby College", "Hamilton College",
  "Grinnell College", "Oberlin College", "Reed College", "Kenyon College", "Bates College",
  "Harvey Mudd College", "Vassar College", "Wellesley College", "Smith College", "Haverford College",
  "Colgate University", "Bucknell University", "Lehigh University", "Villanova University", "Gonzaga University",
  "Baylor University", "Clemson University", "Auburn University", "University of Alabama", "University of Oregon",
  "University of Utah", "University of Colorado Boulder", "University of Iowa", "Iowa State University", "Kansas State University",
  "University of Nebraska", "Rutgers University", "University of Maryland", "Virginia Tech", "University of Georgia",
  "Howard University", "Spelman College", "Morehouse College", "Tuskegee University", "Xavier University",
  "Berea College", "Deep Springs College", "Whitman College", "St. Olaf College", "Macalester College",
  "Furman University", "Rhodes College", "Trinity University", "Santa Clara University", "Pepperdine University",
  "Creighton University", "Drake University", "Butler University", "Elon University", "Marquette University",
  "University of Hawaii", "University of Alaska", "University of Vermont", "University of Maine", "University of Montana",
  "Montana State University", "Boise State University", "University of Wyoming", "New Mexico State", "UT Dallas",
  "Collin College", "Southern Methodist University", "TCU", "Texas Tech University", "University of Houston",
];

const ROW_COUNT = 14;
const PER_ROW = Math.ceil(UNIVERSITIES.length / ROW_COUNT) + 6;
const SIZES = ["1.6rem", "2.6rem", "2rem", "3.2rem", "1.8rem", "2.4rem"];

/** Deterministic shuffle (same on server and browser, so hydration matches). */
function shuffled<T>(items: readonly T[], seed: number): T[] {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  return items.map((v) => [rand(), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

const ROWS = Array.from({ length: ROW_COUNT }, (_, r) => ({
  outline: r % 3 === 1,
  speed: `${70 + (r % 4) * 18}s`,
  reverse: r % 2 === 1,
  size: SIZES[r % SIZES.length]!,
  names: shuffled(UNIVERSITIES, r + 1).slice(0, PER_ROW),
}));

export function UniversityNamesBackground() {
  const bgRef = useRef<HTMLDivElement>(null);

  // Subtle parallax on mouse move, as on the coming-soon page.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      if (bgRef.current) bgRef.current.style.transform = `rotate(-8deg) translate(${x * -24}px, ${y * -24}px)`;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="uni-bg-layer" aria-hidden="true">
      <div ref={bgRef} className="uni-bg">
        {ROWS.map((row, r) => (
          <div
            key={r}
            className={`uni-row${row.outline ? " uni-row--outline" : ""}`}
            style={{
              ["--speed" as string]: row.speed,
              ["--dir" as string]: row.reverse ? "reverse" : "normal",
              ["--size" as string]: row.size,
            }}
          >
            {/* Duplicated so the -50% scroll loops seamlessly. */}
            {[...row.names, ...row.names].map((name, i) => (
              <span key={i}>{name}</span>
            ))}
          </div>
        ))}
      </div>
      <div className="uni-glow" />
    </div>
  );
}
