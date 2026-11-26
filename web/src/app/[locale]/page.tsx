import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/Logo";

export default function HomePage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = useTranslations("Home");

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
      <Logo className="h-28 w-auto sm:h-36" />

      <p className="rounded-full bg-cream px-4 py-1 text-sm font-bold uppercase tracking-widest">
        {t("eyebrow")}
      </p>

      <h1 className="wordmark text-5xl sm:text-7xl">{t("title")}</h1>

      <p className="max-w-xl text-lg font-medium sm:text-xl">{t("valueProp")}</p>

      <Link
        href="/chat"
        className="mt-2 rounded-full bg-blue px-8 py-3.5 text-lg font-bold uppercase tracking-wider text-white shadow-pill hover:bg-blue-dark"
      >
        {t("cta")}
      </Link>
    </section>
  );
}
