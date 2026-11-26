import type { CSSProperties } from "react";
import type { Category } from "@/lib/faqs";
import { CATEGORY_STYLE } from "@/lib/category-style";

/** Colored icon tile for a guide category. */
export function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  const { accent, onAccent, icon } = CATEGORY_STYLE[category];
  return (
    <span
      aria-hidden="true"
      className={`accent-chip ${className ?? "h-10 w-10"}`}
      style={{ "--accent": accent, "--on-accent": onAccent } as CSSProperties}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path d={icon} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
