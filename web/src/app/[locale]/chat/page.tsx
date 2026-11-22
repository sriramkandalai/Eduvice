import { ChatBox } from "@/components/ChatBox";
import { initLocale, pageMetadata, type LocaleParams } from "@/lib/page";

export function generateMetadata({ params: { locale } }: LocaleParams) {
  return pageMetadata(locale, "chatTitle");
}

export default function ChatPage({ params }: LocaleParams) {
  initLocale(params.locale);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <ChatBox />
    </section>
  );
}
