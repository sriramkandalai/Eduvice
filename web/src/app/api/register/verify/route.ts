import { NextResponse } from "next/server";
import { dbName, getMongoClient } from "@/lib/mongo";
import { hashToken, pendingRegistrations } from "@/lib/registration";
import { isLocale, routing } from "@/i18n/routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Confirmation link from the sign-up email: creates the account (or adds a password to it). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const localeParam = url.searchParams.get("locale") ?? "";
  const locale = isLocale(localeParam) ? localeParam : routing.defaultLocale;
  const signin = (params: string) => NextResponse.redirect(new URL(`/${locale}/signin?${params}`, url.origin));

  try {
    const pending = await pendingRegistrations();
    const reg = token ? await pending.findOne({ tokenHash: hashToken(token), expires: { $gt: new Date() } }) : null;
    if (!reg) return signin("error=link_expired");

    const users = (await getMongoClient()).db(dbName()).collection("users");
    const existing = await users.findOne({ email: reg.email });
    if (existing) {
      // The address already has an account (e.g. from Google or an email link): add the password.
      await users.updateOne(
        { _id: existing._id },
        {
          $set: {
            passwordHash: reg.passwordHash,
            emailVerified: existing.emailVerified ?? new Date(),
            ...(existing.name ? {} : { name: reg.name }),
          },
        },
      );
    } else {
      await users.insertOne({
        name: reg.name,
        email: reg.email,
        image: null,
        emailVerified: new Date(),
        passwordHash: reg.passwordHash,
      });
    }
    await pending.deleteOne({ _id: reg._id });

    return signin(`verified=1&email=${encodeURIComponent(reg.email)}`);
  } catch (err) {
    console.error("[api/register/verify]", err);
    return signin("error=server");
  }
}
