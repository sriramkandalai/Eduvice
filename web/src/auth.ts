// Sign-in for EduVice (Auth.js / next-auth v5). Signing in is optional: it lets parents keep
// their chats with Marg in their account. Users, linked accounts and email sign-in tokens are
// stored in MongoDB by the adapter; sessions are signed cookies (JWT), which the password
// sign-in requires.

import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { dbName, getMongoClient } from "@/lib/mongo";
import { sendEmail } from "@/lib/email";
import { normalizeEmail, verifyPassword } from "@/lib/password";
import { checkRateLimit, visitorKey } from "@/lib/rate-limit";
import { pendingRegistrations } from "@/lib/registration";

class UnverifiedEmail extends CredentialsSignin {
  code = "unverified";
}
class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

const providers: NextAuthConfig["providers"] = [];

if (googleEnabled) {
  providers.push(
    Google({
      // Google only signs in people who own the address, so it's safe to attach Google to an
      // existing EduVice account with the same email (created by email link or password).
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

providers.push(
  // Passwordless "email me a sign-in link". Sending goes through lib/email.ts (Resend, or the
  // dev console when AUTH_RESEND_KEY isn't set).
  Resend({
    apiKey: process.env.AUTH_RESEND_KEY ?? "dev-console",
    async sendVerificationRequest({ identifier, url }) {
      await sendEmail({
        to: identifier,
        subject: "Your EduVice sign-in link",
        text: "Click the button below to sign in to EduVice. The link works once and expires in 24 hours.\n\nIf you didn't ask for this, you can ignore this email.",
        action: { label: "Sign in to EduVice", url },
      });
    },
  }),

  // Email + password. Accounts are created by /api/register and must confirm their email first.
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(credentials, request) {
      const limit = await checkRateLimit(`login:${visitorKey(request)}`);
      if (!limit.ok) throw new TooManyAttempts();

      const email = normalizeEmail(credentials?.email);
      const password = typeof credentials?.password === "string" ? credentials.password : "";
      const users = (await getMongoClient()).db(dbName()).collection("users");
      const user = email ? await users.findOne({ email }) : null;

      if (!user?.passwordHash && email) {
        // Signed up but hasn't clicked the confirmation link yet: say so, instead of "wrong password".
        const pending = await (await pendingRegistrations()).findOne({ email, expires: { $gt: new Date() } });
        if (pending && (await verifyPassword(password, pending.passwordHash))) throw new UnverifiedEmail();
      }

      const ok = await verifyPassword(password, user?.passwordHash as string | undefined);
      if (!user || !ok) return null;
      if (!user.emailVerified) throw new UnverifiedEmail();

      return {
        id: user._id.toString(),
        name: (user.name as string | null) ?? null,
        email: user.email as string,
        image: (user.image as string | null) ?? null,
      };
    },
  }),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(() => getMongoClient(), { databaseName: dbName() }),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers,
  // next-intl's middleware adds the language prefix (/signin → /en/signin).
  pages: { signIn: "/signin", error: "/signin", verifyRequest: "/signin" },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  trustHost: true,
});
