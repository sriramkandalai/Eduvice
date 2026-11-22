import { Type, ThinkingLevel } from "@google/genai";
import type { Locale } from "@/i18n/routing";
import { getGemini } from "./gemini";
import { LANGUAGE_NAMES } from "./prompt";
import { routerModel } from "./router";

/**
 * Suggest up to 3 short follow-up questions the parent might ask next.
 * Runs after the answer has streamed, so it never delays the answer. Returns [] on any error.
 */
export async function suggestFollowUps(question: string, answer: string, locale: Locale): Promise<string[]> {
  if (!answer.trim()) return [];
  try {
    const res = await getGemini().models.generateContent({
      model: routerModel(),
      contents: `PARENT'S QUESTION:\n${question}\n\nANSWER THEY GOT:\n${answer.slice(0, 3000)}`,
      config: {
        systemInstruction: `Suggest 3 short follow-up questions this parent might naturally ask next, written as the parent would type them (first person, e.g. "How do I…?").
- Write them in the same language as the parent's question. If unclear, use ${LANGUAGE_NAMES[locale]}.
- Each under 70 characters, simple everyday words, and different from each other.
- Make them useful next steps, not repeats of what the answer already said.`,
        temperature: 0.5,
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
    const parsed: unknown = JSON.parse(res.text ?? "[]");
    return Array.isArray(parsed)
      ? parsed
          .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
          .map((q) => q.trim().slice(0, 120))
          .slice(0, 3)
      : [];
  } catch (err) {
    console.error("[followups]", err);
    return [];
  }
}
