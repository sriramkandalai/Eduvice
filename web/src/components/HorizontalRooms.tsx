"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Marg, type MargState } from "./Marg";

export interface Room {
  /** Marg's emotion while this room is on screen */
  mood: MargState;
  content: ReactNode;
}

const WIDE = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";

/**
 * The home page's rooms. On wider screens the rooms sit side by side in a pinned strip that slides
 * sideways (the background moves right) as you scroll down, while Marg stands big in the center,
 * walks while the rooms move, and shows each room's emotion when they stop. On phones, or with
 * reduced motion, the rooms simply stack and Marg is a small companion in the corner.
 * Layout lives in globals.css (.h-rooms…).
 */
export function HorizontalRooms({ rooms }: { rooms: Room[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [mood, setMood] = useState<MargState>(rooms[0]?.mood ?? "wave");
  const [walking, setWalking] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [look, setLook] = useState(-1);

  useEffect(() => {
    const wrap = wrapRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!wrap || !viewport || !track) return;

    const mq = window.matchMedia(WIDE);
    const rtl = document.documentElement.dir === "rtl";
    const n = rooms.length;
    let frame = 0;
    let stopTimer: ReturnType<typeof setTimeout> | undefined;
    let lastProgress = -1;

    // Wide screens: scroll position → sideways position of the room strip.
    const update = () => {
      frame = 0;
      if (!mq.matches) {
        track.style.transform = "";
        return;
      }
      const rect = wrap.getBoundingClientRect();
      const scrollable = wrap.offsetHeight - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, scrollable)));
      const x = progress * (n - 1) * viewport.clientWidth;
      // The background moves right (left in right-to-left languages).
      track.style.transform = `translate3d(${rtl ? -x : x}px, 0, 0)`;

      const index = Math.round(progress * (n - 1));
      if (progress !== lastProgress && lastProgress !== -1) {
        // Marg walks the opposite way the background moves.
        setLook((progress > lastProgress ? -1 : 1) * (rtl ? -1 : 1));
        setWalking(true);
        clearTimeout(stopTimer);
        stopTimer = setTimeout(() => setWalking(false), 160);
      }
      lastProgress = progress;
      setMood(rooms[index]?.mood ?? "idle");
      setHidden(rect.bottom < window.innerHeight * 0.6);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // Phones / reduced motion: rooms stack; Marg takes the mood of the room on screen.
    const ratios = new Map<Element, number>();
    const roomEls = Array.from(track.querySelectorAll<HTMLElement>("[data-room]"));
    const roomObserver = new IntersectionObserver(
      (entries) => {
        if (mq.matches) return;
        for (const e of entries) ratios.set(e.target, e.intersectionRatio);
        let best = 0;
        let bestRatio = -1;
        roomEls.forEach((el, i) => {
          const r = ratios.get(el) ?? 0;
          if (r > bestRatio) {
            bestRatio = r;
            best = i;
          }
        });
        setMood(rooms[best]?.mood ?? "idle");
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    roomEls.forEach((el) => roomObserver.observe(el));

    const footer = document.querySelector("footer");
    const footerObserver = new IntersectionObserver(([e]) => {
      if (!mq.matches) setHidden(Boolean(e?.isIntersecting));
    });
    if (footer) footerObserver.observe(footer);

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    mq.addEventListener("change", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mq.removeEventListener("change", onScroll);
      roomObserver.disconnect();
      footerObserver.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(stopTimer);
    };
  }, [rooms]);

  return (
    <div ref={wrapRef} className="h-rooms" style={{ "--n": rooms.length } as CSSProperties}>
      {/* invisible snap points, one per room (wide screens) */}
      {rooms.map((_, i) => (
        <div key={i} aria-hidden="true" className="h-snap" style={{ "--i": i } as CSSProperties} />
      ))}
      <div ref={viewportRef} className="h-rooms-viewport">
        <div ref={trackRef} className="h-rooms-track">
          {rooms.map((room, i) => (
            <div key={i} data-room className="h-room">
              {room.content}
            </div>
          ))}
        </div>
        <div
          aria-hidden="true"
          className={`h-marg ${hidden ? "is-hidden" : ""}`}
          style={{ "--look": look } as CSSProperties}
        >
          <Marg state={walking ? "walk" : mood} className="prop-shadow h-full w-auto" />
        </div>
      </div>
    </div>
  );
}
