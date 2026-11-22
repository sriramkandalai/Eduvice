import { notFound } from "next/navigation";
import { initLocale, type LocaleParams } from "@/lib/page";

// Any unknown path under a locale (e.g. /es/foo) renders the localized not-found page.
export default function CatchAll({ params }: LocaleParams) {
  initLocale(params.locale);
  notFound();
}
