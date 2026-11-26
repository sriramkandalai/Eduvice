import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navbar() {
  const t = useTranslations("Navbar");
  const brand = useTranslations("Brand");

  return (
    <header className="border-b-4 border-blue-dark/15 bg-yellow">
      <nav
        aria-label={t("mainNav")}
        className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3"
      >
        <Link href="/" aria-label={t("homeLink")} className="flex items-center gap-2">
          <Logo className="h-9 w-auto" />
          <span className="wordmark text-2xl sm:text-3xl">{brand("name")}</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="hidden rounded-full bg-blue px-4 py-2 text-sm font-bold text-white hover:bg-blue-dark sm:inline-block"
          >
            {t("chat")}
          </Link>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
