import { CATEGORIES, type Category } from "./faqs";

/** Wall colors for the "rooms" design (see globals.css .scene). */
export interface RoomTheme {
  /** wall background + main text color */
  wall: string;
  /** secondary text */
  muted: string;
  /** the accent dot after headings */
  dot: string;
  /** paper notes on this wall */
  note: string;
  /** floor override for dark rooms */
  floor?: string;
  /** which prop stands on this room's floor */
  prop: "lamp" | "desk" | "stool" | "marg" | "chalkboard";
}

const THEMES: RoomTheme[] = [
  { wall: "bg-blue text-paper", muted: "text-paper/75", dot: "text-yellow", note: "bg-paper", prop: "lamp" },
  { wall: "bg-paper text-charcoal", muted: "text-charcoal/65", dot: "text-blue", note: "bg-white", prop: "desk" },
  { wall: "bg-charcoal text-paper", muted: "text-paper/70", dot: "text-yellow", note: "bg-paper", floor: "!bg-paper/10", prop: "marg" },
  { wall: "bg-yellow text-charcoal", muted: "text-charcoal/65", dot: "text-blue", note: "bg-paper", prop: "stool" },
  { wall: "bg-blue text-paper", muted: "text-paper/75", dot: "text-yellow", note: "bg-paper", prop: "chalkboard" },
  { wall: "bg-paper text-charcoal", muted: "text-charcoal/65", dot: "text-blue", note: "bg-white", prop: "marg" },
  { wall: "bg-charcoal text-paper", muted: "text-paper/70", dot: "text-yellow", note: "bg-paper", floor: "!bg-paper/10", prop: "lamp" },
];

export function roomTheme(category: Category): RoomTheme {
  return THEMES[CATEGORIES.indexOf(category) % THEMES.length]!;
}

/** Slight, stable tilt for a card at position i. */
export function tiltFor(i: number): string {
  const tilts = ["-2.5deg", "1.5deg", "-1deg", "2.5deg", "-1.5deg", "1deg", "-2deg", "2deg"];
  return tilts[i % tilts.length]!;
}
