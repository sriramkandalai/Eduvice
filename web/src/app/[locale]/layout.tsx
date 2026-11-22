import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Inter, Noto_Sans_Arabic, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { REVEAL_INIT_SCRIPT, ScrollReveal } from "@/components/ScrollReveal";
import { getDirection, isLocale, routing } from "@/i18n/routing";
import "../globals.css";

// Inter (body) and Plus Jakarta Sans (headings) both cover Latin and Vietnamese.
// Arabic gets Noto Sans Arabic (not preloaded); Chinese uses the system CJK font.
const inter = Inter({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-jakarta",
  display: "swap",
});

const arabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["500", "700", "800"],
  variable: "--font-arabic",
  display: "swap",
  preload: false,
});

type Props = {
  children: ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: Omit<Props, "children">): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: { default: t("title"), template: "%s — EduVice" },
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params: { locale } }: Props) {
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      suppressHydrationWarning // the reveal script adds a class before React hydrates
      lang={locale}
      dir={getDirection(locale)}
      className={`${inter.variable} ${jakarta.variable} ${arabic.variable}`}
    >
      <head>
        {/* eslint-disable-next-line react/no-danger -- tiny static script, must run before paint */}
        <script dangerouslySetInnerHTML={{ __html: REVEAL_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col font-sans text-ink antialiased">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <ScrollReveal />
            <Navbar />
            <main className="flex-1 pb-20 has-[.band-blue.isolate]:pb-0">{children}</main>
            <Footer />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
