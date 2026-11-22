import { getTranslations } from "next-intl/server";
import { LEGAL_UPDATED } from "@/config/site";
import { formatDate } from "@/lib/page";
import type { Locale } from "@/i18n/routing";

interface Section {
  heading: string;
  body: string;
}

/** Shared layout for the Privacy and Terms pages; content comes from messages/<locale>.json. */
export async function LegalPage({ namespace, locale }: { namespace: "Privacy" | "Terms"; locale: Locale }) {
  const t = await getTranslations(namespace);
  const sections = t.raw("sections") as Section[];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:py-14">
      <header className="flex flex-col gap-3">
        <h1 className="wordmark text-4xl sm:text-6xl">{t("title")}</h1>
        <p className="text-sm font-bold text-blue-dark/80">{t("updated", { date: formatDate(LEGAL_UPDATED, locale) })}</p>
        <p className="text-lg font-medium leading-relaxed">{t("intro")}</p>
      </header>

      <div className="flex flex-col gap-6 rounded-2xl bg-white px-6 py-6 shadow-card">
        {sections.map((s) => (
          <section key={s.heading} className="flex flex-col gap-2">
            <h2 className="text-xl font-extrabold">{s.heading}</h2>
            <p className="leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
