import { LegalPage } from "@/components/LegalPage";
import { initLocale, pageMetadata, type LocaleParams } from "@/lib/page";

export function generateMetadata({ params: { locale } }: LocaleParams) {
  return pageMetadata(locale, "termsTitle");
}

export default function TermsPage({ params }: LocaleParams) {
  const locale = initLocale(params.locale);
  return <LegalPage namespace="Terms" locale={locale} />;
}
