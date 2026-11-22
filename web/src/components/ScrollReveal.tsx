"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scroll animations: any element with `data-reveal` fades/slides in when it enters the viewport
 * (styles in globals.css). `data-reveal-delay="120"` staggers items. Re-scans on every page change.
 * The <html class="reveal-ready"> switch is set by REVEAL_INIT_SCRIPT before first paint.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (!document.documentElement.classList.contains("reveal-ready")) return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)"));
    for (const el of elements) {
      const delay = el.dataset.revealDelay;
      if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}

/** Runs in <head>: enable reveal animations only when they can actually run. */
export const REVEAL_INIT_SCRIPT = `try{if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('reveal-ready')}}catch(e){}`;
