import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  Bricolage_Grotesque,
  Cutive_Mono,
  Inter,
  Instrument_Serif,
  Noto_Sans_Bengali,
  Noto_Sans_Devanagari,
  Mukta_Vaani,
  Noto_Sans_Gurmukhi,
  Noto_Sans_Kannada,
  Noto_Sans_Malayalam,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
} from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { REVEAL_INIT_SCRIPT, ScrollReveal } from "@/components/ScrollReveal";
import { getDirection, isLocale, routing } from "@/i18n/routing";
import "../globals.css";

// Bricolage Grotesque (display), Inter (body), Instrument Serif (accent) and Cutive Mono
// (typewriter captions). Each Indian script gets its own font (Noto Sans, or Mukta Vaani for Gujarati) (not preloaded, so it only
// downloads for readers of that language); Chinese uses the system CJK font. Instrument Serif and
// Cutive Mono have no Vietnamese glyphs, so globals.css falls back for vi.
const inter = Inter({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-bricolage",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const mono = Cutive_Mono({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-typewriter",
  display: "swap",
});

// (next/font needs literal options, so each font is written out.)
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400", "500", "700", "800"], variable: "--font-devanagari", display: "swap", preload: false }); // hi, mr
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], weight: ["400", "500", "700", "800"], variable: "--font-bengali", display: "swap", preload: false });
const telugu = Noto_Sans_Telugu({ subsets: ["telugu"], weight: ["400", "500", "700", "800"], variable: "--font-telugu", display: "swap", preload: false });
const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], weight: ["400", "500", "700", "800"], variable: "--font-tamil", display: "swap", preload: false });
// Gujarati uses Mukta Vaani: Google serves Noto Sans Gujarati in a format next/font can't bundle.
const gujarati = Mukta_Vaani({ subsets: ["gujarati"], weight: ["400", "500", "700", "800"], variable: "--font-gujarati", display: "swap", preload: false });
const kannada = Noto_Sans_Kannada({ subsets: ["kannada"], weight: ["400", "500", "700", "800"], variable: "--font-kannada", display: "swap", preload: false });
const malayalam = Noto_Sans_Malayalam({ subsets: ["malayalam"], weight: ["400", "500", "700", "800"], variable: "--font-malayalam", display: "swap", preload: false });
const gurmukhi = Noto_Sans_Gurmukhi({ subsets: ["gurmukhi"], weight: ["400", "500", "700", "800"], variable: "--font-gurmukhi", display: "swap", preload: false }); // pa
const INDIC_FONT_VARS = [devanagari, bengali, telugu, tamil, gujarati, kannada, malayalam, gurmukhi]
  .map((f) => f.variable)
  .join(" ");

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
      className={`${inter.variable} ${bricolage.variable} ${serif.variable} ${mono.variable} ${INDIC_FONT_VARS}`}
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
            <main className="flex-1 pt-20 pb-20 has-[.scenes]:pt-0 has-[.scenes]:pb-0">{children}</main>
            <Footer />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
