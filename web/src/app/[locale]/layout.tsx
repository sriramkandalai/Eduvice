import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Be_Vietnam_Pro, Luckiest_Guy, Noto_Sans_Arabic, Poppins } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { getDirection, isLocale, routing } from "@/i18n/routing";
import "../globals.css";

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const luckiest = Luckiest_Guy({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-luckiest",
  display: "swap",
});

// Poppins and Luckiest Guy have no Vietnamese or Arabic glyphs, so those languages get
// matching fonts (see globals.css). Not preloaded, so other languages don't download them.
// Chinese uses the device's system font.
const vietnamese = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["500", "700", "800"],
  variable: "--font-vietnamese",
  display: "swap",
  preload: false,
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
    <html lang={locale} dir={getDirection(locale)} className={`${poppins.variable} ${luckiest.variable} ${vietnamese.variable} ${arabic.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans text-blue-dark antialiased">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
