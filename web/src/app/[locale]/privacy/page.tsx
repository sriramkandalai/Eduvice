import { LegalPage } from "@/components/LegalPage";
import { initLocale, pageMetadata, type LocaleParams } from "@/lib/page";

export function generateMetadata({ params: { locale } }: LocaleParams) {
  return pageMetadata(locale, "privacyTitle");
}

export default function PrivacyPage({ params }: LocaleParams) {
  const locale = initLocale(params.locale);
  return <LegalPage namespace="Privacy" locale={locale} />;
}
