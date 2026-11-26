import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";
import { UserMenu } from "./UserMenu";

// Floating navigation: paper pills over the page (inspired by human-md.ai).
// Phones: [Home] … [Ask Marg] [Menu]. Larger screens: everything inline.
export function Navbar() {
  const t = useTranslations("Navbar");

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div aria-hidden="true" className="scroll-progress !top-0 !bottom-auto" />
      <nav aria-label={t("mainNav")} className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="pill pill-paper pointer-events-auto shadow-sm">
          {t("home")}
        </Link>

        <div className="pointer-events-auto flex items-center gap-2">
          <Link href="/guide" className="pill pill-paper hidden shadow-sm sm:inline-flex">
            {t("guide")}
          </Link>
          <Link href="/chat" className="pill pill-yellow whitespace-nowrap shadow-sm ring-1 ring-charcoal/20">
            {t("chat")}
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <LanguageSwitcher />
            <UserMenu />
          </div>
          <div className="sm:hidden">
            <MobileMenu />
          </div>
        </div>
      </nav>
    </header>
  );
}
