import { Type, ThinkingLevel } from "@google/genai";
import { getGemini } from "./gemini";
import { envOr } from "./env";

/** Small, fast model used only to decide whether a question needs a live web search. */
export function routerModel(): string {
  return envOr("GEMINI_ROUTER_MODEL", "gemini-3.5-flash-lite");
}

const ROUTER_PROMPT = `
You route questions for a website that helps immigrant parents understand US schools.
Decide whether answering the question requires looking up a SPECIFIC college's or university's policy on credit or placement for AP (Advanced Placement) exams, or finding WHICH colleges give credit for a particular AP exam or score. Abbreviations count (for example "APCSA" = AP Computer Science A, "AP Calc BC", "APUSH").

Answer {"webSearch": true} only in that case.
Answer {"webSearch": false} for everything else, including general questions like "what are AP classes", "are AP classes worth it", how college applications work, the SAT, paying for college, or any other school topic.

Decide based on the CURRENT question. An earlier question may be given only as context, so you can understand short follow-ups (after an AP-credit question, "what about Texas A&M?" is also an AP-credit question). If the current question is about a different topic, answer false even if the earlier question was about AP credit.
`.trim();

/**
 * Returns true when the question needs a live search of College Board / official college sites.
 * `previous` is the parent's earlier question, used only to understand follow-ups.
 * Fails closed (false) on any error, so the normal guide-based answer still works.
 */
export async function needsWebSearch(question: string, previous?: string): Promise<boolean> {
  try {
    const res = await getGemini().models.generateContent({
      model: routerModel(),
      contents: previous
        ? `Earlier question (context only): ${previous.slice(0, 500)}\n\nCurrent question: ${question}`
        : `Current question: ${question}`,
      config: {
        systemInstruction: ROUTER_PROMPT,
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { webSearch: { type: Type.BOOLEAN } },
          required: ["webSearch"],
        },
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
    const parsed = JSON.parse(res.text ?? "{}") as { webSearch?: unknown };
    return parsed.webSearch === true;
  } catch (err) {
    console.error("[router] falling back to guide-only answer:", err);
    return false;
  }
}
