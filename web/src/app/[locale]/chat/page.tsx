import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ChatBox } from "@/components/ChatBox";

export default function ChatPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = useTranslations("Chat");

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:py-14">
      <header className="flex flex-col gap-2">
        <h1 className="wordmark text-4xl sm:text-5xl">{t("title")}</h1>
        <p className="text-lg font-medium">{t("intro")}</p>
      </header>

      <ChatBox />

      <p className="text-sm text-blue-dark/80">{t("disclaimer")}</p>
    </section>
  );
}
