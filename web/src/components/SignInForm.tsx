"use client";

import { useId, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

type Mode = "signin" | "register";
type Notice = { kind: "info" | "error"; key: string } | null;

/** Errors Auth.js can send back in ?error=, plus our own; anything else shows a generic message. */
const KNOWN_ERRORS = new Set(["link_expired", "Verification", "OAuthAccountNotLinked", "AccessDenied", "server"]);

export function SignInForm({
  locale,
  googleEnabled,
  verified,
  initialEmail,
  error,
}: {
  locale: string;
  googleEnabled: boolean;
  verified: boolean;
  initialEmail: string;
  error?: string;
}) {
  const t = useTranslations("Account");
  const router = useRouter();
  const ids = { email: useId(), password: useId(), name: useId(), linkEmail: useId() };

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [linkEmail, setLinkEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(
    verified
      ? { kind: "info", key: "verifiedNotice" }
      : error
        ? { kind: "error", key: KNOWN_ERRORS.has(error) ? `error_${error}` : "error_generic" }
        : null,
  );
  const [sentTo, setSentTo] = useState<{ email: string; kind: "link" | "confirm" } | null>(null);

  const afterSignIn = `/${locale}/chat`;

  async function emailLink(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const res = await signIn("resend", { email: linkEmail, redirect: false, redirectTo: afterSignIn });
    setBusy(false);
    if (res?.error) setNotice({ kind: "error", key: "error_generic" });
    else setSentTo({ email: linkEmail, kind: "link" });
  }

  async function passwordSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);

    if (mode === "register") {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, locale }),
      });
      setBusy(false);
      if (res.ok) {
        setSentTo({ email, kind: "confirm" });
        return;
      }
      const { error: code } = (await res.json().catch(() => ({}))) as { error?: string };
      setNotice({ kind: "error", key: `register_${code ?? "server"}` });
      return;
    }

    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (res?.error) {
      const code = res.code === "unverified" || res.code === "rate_limited" ? res.code : "wrong_password";
      setNotice({ kind: "error", key: `signin_${code}` });
      return;
    }
    router.push("/chat");
    router.refresh();
  }

  if (sentTo) {
    return (
      <section className="flex flex-col gap-3 glass rounded-[var(--radius-card)] px-6 py-6 text-center shadow-card" aria-live="polite">
        <h2 className="text-xl font-bold">{t("checkEmailTitle")}</h2>
        <p>
          {t(sentTo.kind === "link" ? "checkEmailLink" : "checkEmailConfirm", { email: sentTo.email })}
        </p>
        <p className="text-sm text-muted">{t("checkEmailSpam")}</p>
        <button type="button" onClick={() => setSentTo(null)} className="mx-auto text-sm font-bold text-blue hover:underline">
          {t("back")}
        </button>
      </section>
    );
  }

  const input =
    "w-full field text-start";
  const primary = "btn-primary w-full px-5 py-3";

  return (
    <div className="flex flex-col gap-5">
      {notice && (
        <p
          role={notice.kind === "error" ? "alert" : "status"}
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${notice.kind === "error" ? "border border-yellow bg-cream" : "border border-blue/30 bg-blue/5"}`}
        >
          {t(notice.key)}
        </p>
      )}

      {/* Google */}
      {googleEnabled && (
        <button
          type="button"
          onClick={() => void signIn("google", { redirectTo: afterSignIn })}
          className="btn-secondary w-full gap-3 px-5 py-3 shadow-card"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path fill="var(--color-blue)" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" />
            <path fill="var(--color-blue-dark)" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
            <path fill="var(--color-blue-light)" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z" />
            <path fill="var(--color-blue)" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6Z" />
          </svg>
          {t("google")}
        </button>
      )}

      {/* Email link */}
      <form onSubmit={emailLink} className="flex flex-col gap-3 glass rounded-[var(--radius-card)] px-5 py-5 shadow-card">
        <h2 className="font-bold">{t("linkTitle")}</h2>
        <p className="text-sm">{t("linkBody")}</p>
        <label htmlFor={ids.linkEmail} className="sr-only">
          {t("email")}
        </label>
        <input
          id={ids.linkEmail}
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          value={linkEmail}
          onChange={(e) => setLinkEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          className={input}
        />
        <button type="submit" disabled={busy} className={primary}>
          {t("linkButton")}
        </button>
      </form>

      {/* Email + password */}
      <form onSubmit={passwordSubmit} className="flex flex-col gap-3 glass rounded-[var(--radius-card)] px-5 py-5 shadow-card">
        <h2 className="font-bold">{t(mode === "signin" ? "passwordTitle" : "registerTitle")}</h2>
        {mode === "register" && (
          <>
            <label htmlFor={ids.name} className="text-sm font-bold">
              {t("name")}
            </label>
            <input
              id={ids.name}
              autoComplete="name"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={input}
            />
          </>
        )}
        <label htmlFor={ids.email} className="text-sm font-bold">
          {t("email")}
        </label>
        <input
          id={ids.email}
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
        <label htmlFor={ids.password} className="text-sm font-bold">
          {t("password")}
        </label>
        <input
          id={ids.password}
          type="password"
          required
          minLength={mode === "register" ? MIN_PASSWORD_LENGTH : undefined}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
        {mode === "register" && <p className="text-xs">{t("passwordHint", { min: MIN_PASSWORD_LENGTH })}</p>}
        <button type="submit" disabled={busy} className={primary}>
          {t(mode === "signin" ? "passwordButton" : "registerButton")}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "register" : "signin");
            setNotice(null);
          }}
          className="text-sm font-bold text-blue hover:underline"
        >
          {t(mode === "signin" ? "switchToRegister" : "switchToSignin")}
        </button>
        {mode === "signin" && <p className="text-center text-xs">{t("forgotPassword")}</p>}
      </form>

      <p className="text-center text-xs text-muted">{t("guestNote")}</p>
    </div>
  );
}
