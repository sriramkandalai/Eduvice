import type { Category } from "./faqs";

// Soft tints of the logo colors, alternating blue and yellow.
const BLUE_TINT = { accent: "rgb(35 80 181 / 0.1)", onAccent: "var(--color-blue)" };
const YELLOW_TINT = { accent: "rgb(255 208 16 / 0.3)", onAccent: "var(--color-blue-dark)" };

/** Tile tint + simple line icon for each guide category. */
export const CATEGORY_STYLE: Record<Category, { accent: string; onAccent: string; icon: string }> = {
  "getting-started": {
    ...BLUE_TINT,
    // door / entry arrow
    icon: "M4 12h11m0 0-4-4m4 4-4 4M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3",
  },
  "how-school-works": {
    ...YELLOW_TINT,
    // school building
    icon: "M3 10 12 4l9 6M5 10v9h14v-9M10 19v-5h4v5",
  },
  "learning-support": {
    ...BLUE_TINT,
    // open book
    icon: "M12 6c-2-1.5-5-2-8-1.5V18c3-.5 6 0 8 1.5m0-13.5c2-1.5 5-2 8-1.5V18c-3-.5-6 0-8 1.5m0-13.5v13.5",
  },
  "family-rights": {
    ...YELLOW_TINT,
    // shield
    icon: "M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4",
  },
  "daily-life": {
    ...BLUE_TINT,
    // clock
    icon: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  },
  "health-safety": {
    ...YELLOW_TINT,
    // heart
    icon: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z",
  },
  "high-school-college": {
    ...BLUE_TINT,
    // graduation cap
    icon: "M2 9l10-5 10 5-10 5L2 9Zm4 2.5V16c3 2 9 2 12 0v-4.5M22 9v5",
  },
};
