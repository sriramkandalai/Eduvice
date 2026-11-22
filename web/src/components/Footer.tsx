import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const LINKS = [
  { href: "/guide", key: "guide" },
  { href: "/chat", key: "chat" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
  { href: "/privacy", key: "privacy" },
  { href: "/terms", key: "terms" },
] as const;

export function Footer() {
  const t = useTranslations("Footer");
  const brand = useTranslations("Brand");

  return (
    <footer className="bg-blue-dark text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="font-display text-2xl font-extrabold tracking-tight text-yellow" lang="en">
              {brand("name")}
            </span>
            <p className="max-w-xs text-sm text-white/75">{brand("tagline")}</p>
          </div>
          <nav aria-label={t("nav")}>
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm font-semibold sm:grid-cols-3">
              {LINKS.map(({ href, key }) => (
                <li key={key}>
                  <Link href={href} className="text-white/90 hover:text-yellow">
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex flex-col gap-2 border-t border-white/15 pt-6">
          <p className="max-w-3xl text-xs leading-relaxed text-white/65">{t("disclaimer")}</p>
          <p className="text-xs text-white/55">{t("copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
