/**
 * Translates UI text (messages/en.json) and the FAQ library (data/faqs/en.json) into every
 * other locale with Gemini. Run from web/:
 *
 *   npm run translate                      # fill in whatever is missing or out of date
 *   npm run translate -- --only=faqs       # just the FAQ library (or --only=messages)
 *   npm run translate -- --locale=vi       # just one language
 *   npm run translate -- --force           # re-translate everything (overwrites manual edits!)
 *
 * Messages: only keys missing from messages/<locale>.json are translated, so hand-written
 * translations are kept. FAQs: each entry stores a hash of the English text it came from, so
 * editing an English topic re-translates just that topic.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Type } from "@google/genai";
import { IntlMessageFormat } from "intl-messageformat";
import { getGemini, chatModel } from "../src/lib/gemini";
import { FAQS_EN } from "../src/lib/faqs";
import { routing, type Locale } from "../src/i18n/routing";

type Target = Exclude<Locale, "en">;

const LANGUAGE: Record<Target, string> = {
  es: "Spanish (as used by Latin American families in the US; use the respectful 'usted' form)",
  zh: "Simplified Chinese (Mandarin)",
  vi: "Vietnamese (polite, addressing parents respectfully)",
  ar: "Modern Standard Arabic (simple and clear)",
};

const GUIDELINES = `
The readers are immigrant parents in the United States who may be new to the country and may have limited formal education. Translate naturally and warmly, not word for word. Use simple, everyday words.
- Keep these unchanged: the brand name "EduVice" and the assistant's name "Marg"; phone numbers like 911 and 988; website addresses; and US program or law names (FERPA, IDEA, McKinney-Vento, Plyler v. Doe, Lau v. Nichols, Title I, Head Start, Medicaid, CHIP, FAFSA, PTA, PTO, GED, SAT, ACT, PSAT, AP).
- For school abbreviations like IEP, ESL, GPA, EL, and K-12, keep the English abbreviation (parents will see it at school) and add a short translated explanation in parentheses the first time it appears, if the English text explains it.
- Keep the meaning exact. Do not add or remove facts.
`.trim();

const ROOT = process.cwd();
const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k ?? "", v ?? "true"] as const;
  }),
);
const FORCE = args.get("force") === "true";
const ONLY = args.get("only");
const TARGETS = (routing.locales.filter((l) => l !== "en") as Target[]).filter(
  (l) => !args.has("locale") || args.get("locale") === l,
);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function generateJson<T>(prompt: string, schema: object): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await getGemini().models.generateContent({
        model: chatModel(),
        contents: prompt,
        config: { temperature: 0.2, responseMimeType: "application/json", responseSchema: schema },
      });
      return JSON.parse(res.text ?? "") as T;
    } catch (err) {
      if (attempt >= 6) throw err;
      const wait = 15_000 * attempt;
      console.warn(`  retry ${attempt} in ${wait / 1000}s: ${(err as Error).message.slice(0, 120)}`);
      await sleep(wait);
    }
  }
}

// ── Messages ────────────────────────────────────────────────────────────────

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function flatten(value: Json, prefix = "", out = new Map<string, string>()): Map<string, string> {
  if (typeof value === "string") out.set(prefix, value);
  else if (Array.isArray(value)) value.forEach((v, i) => flatten(v, prefix ? `${prefix}.${i}` : String(i), out));
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
}

function rebuild(shape: Json, values: Map<string, string>, prefix = ""): Json {
  if (typeof shape === "string") return values.get(prefix) ?? shape;
  if (Array.isArray(shape)) return shape.map((v, i) => rebuild(v, values, prefix ? `${prefix}.${i}` : String(i)));
  if (shape && typeof shape === "object")
    return Object.fromEntries(
      Object.entries(shape).map(([k, v]) => [k, rebuild(v, values, prefix ? `${prefix}.${k}` : k)]),
    );
  return shape;
}

/** Keys that are the same in every language. */
const KEEP_AS_IS = (key: string) =>
  key === "Brand.name" || key === "Chat.title" || key.startsWith("LanguageSwitcher.names.");

function placeholders(msg: string): string {
  return [...msg.matchAll(/\{\s*(\w+)/g)].map((m) => m[1]).sort().join(",");
}

function checkMessage(key: string, en: string, translated: string, locale: Target) {
  if (placeholders(en) !== placeholders(translated)) {
    throw new Error(`${locale} ${key}: placeholders changed ("${en}" → "${translated}")`);
  }
  new IntlMessageFormat(translated, locale); // throws on broken ICU syntax
}

// messages/translation-sources.json records, per locale and key, a hash of the English text each
// translation was made from, so changed English strings get re-translated.
const SOURCES_FILE = path.join(ROOT, "messages/translation-sources.json");
type SourceHashes = Record<string, Record<string, string>>;
const textHash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 12);

function readSourceHashes(): SourceHashes {
  return existsSync(SOURCES_FILE) ? (JSON.parse(readFileSync(SOURCES_FILE, "utf8")) as SourceHashes) : {};
}

async function translateMessages(locale: Target) {
  const enShape = JSON.parse(readFileSync(path.join(ROOT, "messages/en.json"), "utf8")) as Json;
  const enFlat = flatten(enShape);
  const file = path.join(ROOT, `messages/${locale}.json`);
  const existing = existsSync(file) && !FORCE ? flatten(JSON.parse(readFileSync(file, "utf8")) as Json) : new Map();
  const allHashes = readSourceHashes();
  const recorded = allHashes[locale] ?? {};
  const hashes: Record<string, string> = {};

  const result = new Map<string, string>();
  const todo: Array<[string, string]> = [];
  for (const [key, en] of enFlat) {
    const current = textHash(en);
    // A key with no recorded hash is assumed current (e.g. hand-written translations).
    const upToDate = recorded[key] === undefined || recorded[key] === current;
    if (KEEP_AS_IS(key)) result.set(key, en);
    else if (existing.has(key) && upToDate) {
      result.set(key, existing.get(key)!);
      hashes[key] = current;
    } else todo.push([key, en]);
  }
  console.log(`messages/${locale}.json: ${todo.length} strings to translate`);

  for (let i = 0; i < todo.length; i += 40) {
    const batch = Object.fromEntries(todo.slice(i, i + 40));
    const out = await generateJson<Record<string, string>>(
      `Translate the values of this JSON object from English into ${LANGUAGE[locale]}. These are labels and text for a website's user interface.
${GUIDELINES}
- Return a JSON object with exactly the same keys. Translate only the values.
- Keep ICU message syntax exactly: placeholders like {year} or {count} stay in English, and in plural forms like "{count, plural, one {# topic} other {# topics}}" keep "count", "plural", "one", "other", and "#", and translate only the words. Use only the plural categories your language needs (for example only "other" for Chinese and Vietnamese; Arabic may use zero, one, two, few, many, other).

${JSON.stringify(batch, null, 2)}`,
      { type: Type.OBJECT, properties: Object.fromEntries(Object.keys(batch).map((k) => [k, { type: Type.STRING }])), required: Object.keys(batch) },
    );
    for (const [key, en] of Object.entries(batch)) {
      const t = out[key];
      if (typeof t !== "string" || !t.trim()) throw new Error(`${locale} ${key}: missing translation`);
      checkMessage(key, en, t, locale);
      result.set(key, t);
      hashes[key] = textHash(en);
    }
    console.log(`  ${Math.min(i + 40, todo.length)}/${todo.length}`);
  }

  writeFileSync(file, `${JSON.stringify(rebuild(enShape, result), null, 2)}\n`);
  writeFileSync(SOURCES_FILE, `${JSON.stringify({ ...readSourceHashes(), [locale]: hashes }, null, 2)}\n`);
}

// ── FAQs ────────────────────────────────────────────────────────────────────

interface FaqTranslation {
  slug: string;
  title: string;
  text: string;
  /** Hash of the English title+text this was translated from. */
  sourceHash: string;
}

const hashOf = (title: string, text: string) =>
  createHash("sha256").update(`${title}\n${text}`).digest("hex").slice(0, 12);

async function translateFaqs(locale: Target) {
  const file = path.join(ROOT, `data/faqs/${locale}.json`);
  const existing = new Map<string, FaqTranslation>(
    existsSync(file) && !FORCE
      ? (JSON.parse(readFileSync(file, "utf8")) as FaqTranslation[]).map((f) => [f.slug, f])
      : [],
  );

  const todo = FAQS_EN.filter((f) => existing.get(f.slug)?.sourceHash !== hashOf(f.title, f.text));
  console.log(`data/faqs/${locale}.json: ${todo.length} topics to translate`);

  const save = () => {
    const ordered = FAQS_EN.map((f) => existing.get(f.slug)).filter((f): f is FaqTranslation => !!f);
    writeFileSync(file, `${JSON.stringify(ordered, null, 2)}\n`);
  };

  for (let i = 0; i < todo.length; i += 5) {
    const batch = todo.slice(i, i + 5).map(({ slug, title, text }) => ({ slug, title, text }));
    const out = await generateJson<Array<{ slug: string; title: string; text: string }>>(
      `Translate each item's "title" and "text" from English into ${LANGUAGE[locale]}. These are topics in a guide to US schools.
${GUIDELINES}
- Return a JSON array with the same items in the same order. Keep each "slug" exactly as given.

${JSON.stringify(batch, null, 2)}`,
      {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { slug: { type: Type.STRING }, title: { type: Type.STRING }, text: { type: Type.STRING } },
          required: ["slug", "title", "text"],
        },
      },
    );
    for (const src of batch) {
      const t = out.find((o) => o.slug === src.slug);
      if (!t?.title.trim() || !t.text.trim()) throw new Error(`${locale} ${src.slug}: missing translation`);
      existing.set(src.slug, { slug: src.slug, title: t.title.trim(), text: t.text.trim(), sourceHash: hashOf(src.title, src.text) });
    }
    save(); // save after every batch so a crash doesn't lose progress
    console.log(`  ${Math.min(i + 5, todo.length)}/${todo.length}`);
  }
  save();
}

async function main() {
  for (const locale of TARGETS) {
    if (ONLY !== "faqs") await translateMessages(locale);
    if (ONLY !== "messages") await translateFaqs(locale);
  }
  console.log("Done.");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
