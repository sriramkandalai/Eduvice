import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-20 text-center">
      <Logo className="h-20 w-20" />
      <h1 className="wordmark text-4xl sm:text-5xl">{t("title")}</h1>
      <p className="text-lg font-medium">{t("body")}</p>
      <Link href="/" className="btn-primary px-6 py-3">
        {t("home")}
      </Link>
    </div>
  );
}
