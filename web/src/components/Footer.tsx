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
    <footer className="mt-16 bg-blue-dark text-cream">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
        <div className="flex flex-col gap-1">
          <span className="brand text-2xl text-yellow" lang="en">
            {brand("name")}
          </span>
          <p className="text-sm">{brand("tagline")}</p>
        </div>

        <nav aria-label={t("nav")}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
            {LINKS.map(({ href, key }) => (
              <li key={key}>
                <Link href={href} className="hover:text-yellow hover:underline">
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="max-w-3xl text-xs leading-relaxed text-cream/80">{t("disclaimer")}</p>
        <p className="text-xs text-cream/80">{t("copyright", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
