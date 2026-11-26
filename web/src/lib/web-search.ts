// Live web answers for AP-credit questions, restricted to College Board and official college (.edu) sites.
//
// The Gemini API can't limit Google Search to certain sites, so this is enforced in two layers:
//  1. The model is told to search only with site: filters for those domains.
//  2. After answering, every sentence Gemini attributes ONLY to other domains is removed, and the
//     answer is rejected entirely if no allowed source supports it.

import type { Content, GroundingMetadata } from "@google/genai";
import type { Locale } from "@/i18n/routing";
import type { WebSource } from "./chat-protocol";
import { chatModel, getGemini } from "./gemini";
import { LANGUAGE_NAMES } from "./prompt";

/** Only these sources may support a web answer. */
export function isAllowedDomain(raw: string | undefined): boolean {
  if (!raw) return false;
  const domain = raw.trim().toLowerCase().replace(/^www\./, "");
  if (!/^[a-z0-9.-]+$/.test(domain)) return false;
  return domain === "collegeboard.org" || domain.endsWith(".collegeboard.org") || domain.endsWith(".edu");
}

const RULES = `
You are Marg, the warm and patient guide on EduVice, a website for immigrant parents learning how US schools work.
Use Google Search to answer the parent's question about college credit or placement for AP (Advanced Placement) exams.

WHERE TO SEARCH
- Use ONLY official sources: College Board (collegeboard.org, including apstudents.collegeboard.org) and official college or university websites ending in .edu.
- Put a site: filter in EVERY search query, for example "site:collegeboard.org", "site:utexas.edu", or "site:.edu".
- Ignore all other websites, such as forums, blogs, news sites, and test-prep companies.

HOW TO ANSWER
- Reply in the same language the parent wrote in. If you can't tell, reply in {{LANGUAGE}}.
- Start with a direct answer. For each college, say the minimum AP score and what credit or course it gives, if you found it.
- If the question asks broadly which colleges accept an exam, explain that each college sets its own policy, give a few examples you found on official sites, and suggest College Board's AP Credit Policy Search.
- If you can't find the answer on an official site, say so clearly. Never guess.
- Mention that policies can change each year, so families should confirm on the college's website.
- Use short, simple sentences. Keep it under 150 words. If you list items, put each on its own line starting with "- ".
- Plain text only: no bold, no headings, no markdown. Don't write URLs; the sources are shown separately.
`.trim();

export interface WebAnswer {
  text: string;
  sources: WebSource[];
  /** Google Search suggestions widget (HTML) that must be shown with grounded answers. */
  suggestionsHtml?: string;
}

/** Remove markdown the model sometimes adds despite instructions. */
function tidy(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^\s*[*•]\s+/gm, "- ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Drop every segment whose supporting sources are all outside the allowed domains.
 * Gemini reports segment positions as UTF-8 byte offsets.
 */
function filterToAllowed(text: string, gm: GroundingMetadata | undefined) {
  const chunks = gm?.groundingChunks ?? [];
  const allowed = chunks.map((c) => isAllowedDomain(c.web?.title));
  const bytes = Buffer.from(text, "utf8");
  const drop: Array<[number, number]> = [];
  const usedAllowed = new Set<number>();

  for (const support of gm?.groundingSupports ?? []) {
    const idx = support.groundingChunkIndices ?? [];
    const okIdx = idx.filter((i) => allowed[i]);
    okIdx.forEach((i) => usedAllowed.add(i));
    if (idx.length > 0 && okIdx.length === 0 && support.segment?.endIndex !== undefined) {
      drop.push([support.segment.startIndex ?? 0, support.segment.endIndex]);
    }
  }

  drop.sort((a, b) => a[0] - b[0]);
  const kept: Buffer[] = [];
  let cursor = 0;
  for (const [start, end] of drop) {
    if (start > cursor) kept.push(bytes.subarray(cursor, start));
    cursor = Math.max(cursor, end);
  }
  kept.push(bytes.subarray(cursor));

  const sources: WebSource[] = [];
  const seen = new Set<string>();
  for (const i of [...usedAllowed].sort((a, b) => a - b)) {
    const web = chunks[i]?.web;
    const domain = web?.title?.trim().toLowerCase().replace(/^www\./, "");
    if (!domain || !web?.uri || seen.has(domain)) continue;
    seen.add(domain);
    sources.push({ domain, uri: web.uri });
  }

  return { text: Buffer.concat(kept).toString("utf8"), sources, droppedSegments: drop.length };
}

/**
 * For open web answers: the sites Gemini cited (or, if it reported no per-sentence citations,
 * every site it retrieved), one entry per domain.
 */
export function citedWebSources(gm: GroundingMetadata | undefined): WebSource[] {
  const chunks = gm?.groundingChunks ?? [];
  const cited = new Set<number>();
  for (const s of gm?.groundingSupports ?? []) for (const i of s.groundingChunkIndices ?? []) cited.add(i);
  const indices = cited.size > 0 ? [...cited].sort((a, b) => a - b) : chunks.map((_, i) => i);

  const sources: WebSource[] = [];
  const seen = new Set<string>();
  for (const i of indices) {
    const web = chunks[i]?.web;
    const domain = web?.title?.trim().toLowerCase().replace(/^www\./, "");
    if (!domain || !web?.uri || seen.has(domain)) continue;
    seen.add(domain);
    sources.push({ domain, uri: web.uri });
  }
  return sources;
}

/** Returns null when no answer could be backed by College Board or an official .edu site. */
export async function answerWithWebSearch(contents: Content[], locale: Locale): Promise<WebAnswer | null> {
  const res = await getGemini().models.generateContent({
    model: chatModel(),
    contents,
    config: {
      systemInstruction: RULES.replace("{{LANGUAGE}}", LANGUAGE_NAMES[locale]),
      tools: [{ googleSearch: {} }],
      temperature: 0.2,
    },
  });

  const raw = res.text ?? "";
  const gm = res.candidates?.[0]?.groundingMetadata;
  const { text, sources, droppedSegments } = filterToAllowed(raw, gm);

  if (droppedSegments > 0) {
    console.warn(`[web-search] removed ${droppedSegments} segment(s) supported only by non-official sites`);
  }
  if (sources.length === 0 || !text.trim()) return null;

  return { text: tidy(text), sources, suggestionsHtml: gm?.searchEntryPoint?.renderedContent };
}
