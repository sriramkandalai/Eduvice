import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";

// Phones: [logo · account] on the first row, [guide · ask · language] on the second.
// Larger screens: everything on one row, with the account at the end.
export function Navbar() {
  const t = useTranslations("Navbar");
  const brand = useTranslations("Brand");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <nav
        aria-label={t("mainNav")}
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3"
      >
        <Link href="/" aria-label={t("homeLink")} className="order-1 flex items-center gap-2">
          <Logo className="h-7 w-auto" />
          <span className="brand text-xl" lang="en">
            {brand("name")}
          </span>
        </Link>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-1 gap-y-2 sm:order-2 sm:ms-auto sm:w-auto sm:gap-x-2">
          <Link
            href="/guide"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-mist hover:text-blue"
          >
            {t("guide")}
          </Link>
          <Link href="/chat" className="btn-primary whitespace-nowrap px-4 py-2 text-sm">
            {t("chat")}
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="order-2 sm:order-3">
          <UserMenu />
        </div>
      </nav>
      <div aria-hidden="true" className="scroll-progress" />
    </header>
  );
}
