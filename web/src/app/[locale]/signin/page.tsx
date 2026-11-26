import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignInForm } from "@/components/SignInForm";
import { Marg } from "@/components/Marg";
import { initLocale } from "@/lib/page";

type Props = {
  params: { locale: string };
  searchParams: { verified?: string; email?: string; error?: string };
};

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("signInTitle"), robots: { index: false } };
}

export default async function SignInPage({ params, searchParams }: Props) {
  const locale = initLocale(params.locale);
  const t = await getTranslations("Account");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10 sm:py-14">
      <header className="flex flex-col items-center gap-3 text-center">
        <Marg state="wave" className="h-24 w-24" />
        <h1 className="wordmark text-4xl">{t("signInTitle")}</h1>
        <p className="font-medium">{t("signInIntro")}</p>
      </header>
      <SignInForm
        locale={locale}
        googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)}
        verified={searchParams.verified === "1"}
        initialEmail={typeof searchParams.email === "string" ? searchParams.email : ""}
        error={typeof searchParams.error === "string" ? searchParams.error : undefined}
      />
    </div>
  );
}
