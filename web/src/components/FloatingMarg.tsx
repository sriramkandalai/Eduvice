"use client";

import { useEffect, useState } from "react";
import { Marg, type MargState } from "./Marg";

/**
 * Marg stays in place while the home page's rooms scroll behind him. Each room declares
 * `data-marg="wave|idle|thinking|talking"`; Marg takes the mood of the room that fills most of
 * the screen. He leans a little while you scroll, and steps away when the footer arrives.
 */
export function FloatingMarg() {
  const [state, setState] = useState<MargState>("wave");
  const [moving, setMoving] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const rooms = Array.from(document.querySelectorAll<HTMLElement>("[data-marg]"));
    const ratios = new Map<Element, number>();

    const roomObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) ratios.set(e.target, e.intersectionRatio);
        let best: HTMLElement | null = null;
        let bestRatio = 0;
        for (const room of rooms) {
          const r = ratios.get(room) ?? 0;
          if (r > bestRatio) {
            bestRatio = r;
            best = room;
          }
        }
        const next = best?.dataset.marg as MargState | undefined;
        if (next) setState(next);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    rooms.forEach((r) => roomObserver.observe(r));

    const footer = document.querySelector("footer");
    const footerObserver = new IntersectionObserver(([e]) => setHidden(Boolean(e?.isIntersecting)), {
      threshold: 0.02,
    });
    if (footer) footerObserver.observe(footer);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      setMoving(true);
      clearTimeout(timer);
      timer = setTimeout(() => setMoving(false), 220);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      roomObserver.disconnect();
      footerObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div aria-hidden="true" className={`floating-marg ${moving ? "is-moving" : ""} ${hidden ? "is-hidden" : ""}`}>
      <Marg state={state} className="prop-shadow h-full w-auto" />
    </div>
  );
}
