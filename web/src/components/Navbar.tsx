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
        className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3"
      >
        <Link href="/" aria-label={t("homeLink")} className="flex items-center gap-2">
          <Logo className="h-9 w-auto" />
          <span className="wordmark brand text-2xl sm:text-3xl" lang="en">
            {brand("name")}
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
          <Link href="/guide" className="whitespace-nowrap text-sm font-bold hover:underline">
            {t("guide")}
          </Link>
          <Link
            href="/chat"
            className="whitespace-nowrap rounded-full bg-blue px-3 py-2 text-sm font-bold text-white hover:bg-blue-dark sm:px-4"
          >
            {t("chat")}
          </Link>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
