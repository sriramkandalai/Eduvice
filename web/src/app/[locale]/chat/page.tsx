import { getTranslations } from "next-intl/server";
import { ChatBox } from "@/components/ChatBox";
import { initLocale, pageMetadata, type LocaleParams } from "@/lib/page";

export function generateMetadata({ params: { locale } }: LocaleParams) {
  return pageMetadata(locale, "chatTitle");
}

export default async function ChatPage({ params }: LocaleParams) {
  initLocale(params.locale);
  const t = await getTranslations("Chat");

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:py-12">
      <ChatBox />
      <p className="mx-auto w-full max-w-3xl text-sm text-blue-dark/80">{t("disclaimer")}</p>
    </section>
  );
}
