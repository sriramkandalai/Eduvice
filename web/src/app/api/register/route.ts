import { NextResponse } from "next/server";
import { dbName, getMongoClient } from "@/lib/mongo";
import { hashPassword, isValidPassword, normalizeEmail } from "@/lib/password";
import { REGISTRATION_TTL_MS, newToken, pendingRegistrations } from "@/lib/registration";
import { sendEmail } from "@/lib/email";
import { checkRateLimit, visitorKey } from "@/lib/rate-limit";
import { isLocale, routing } from "@/i18n/routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Create an email + password account. Nothing is created until the person clicks the
 * confirmation link we email them (see ./verify/route.ts), which proves they own the address.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) || null : null;
  const locale = typeof body.locale === "string" && isLocale(body.locale) ? body.locale : routing.defaultLocale;
  if (!email) return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  if (!isValidPassword(body.password)) return NextResponse.json({ error: "weak_password" }, { status: 400 });

  try {
    const limit = await checkRateLimit(`register:${visitorKey(req)}`);
    if (!limit.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

    const users = (await getMongoClient()).db(dbName()).collection("users");
    const existing = await users.findOne({ email });
    if (existing?.passwordHash) return NextResponse.json({ error: "exists" }, { status: 409 });

    const { token, tokenHash } = newToken();
    const pending = await pendingRegistrations();
    await pending.updateOne(
      { email },
      {
        $set: {
          email,
          name,
          passwordHash: await hashPassword(body.password),
          tokenHash,
          expires: new Date(Date.now() + REGISTRATION_TTL_MS),
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    const origin = process.env.AUTH_URL?.replace(/\/$/, "") || new URL(req.url).origin;
    await sendEmail({
      to: email,
      subject: "Confirm your EduVice account",
      text: `${name ? `Hi ${name},\n\n` : ""}Please confirm your email address to finish creating your EduVice account. The link expires in 24 hours.\n\nIf you didn't sign up for EduVice, you can ignore this email.`,
      action: {
        label: "Confirm my email",
        url: `${origin}/api/register/verify?token=${token}&locale=${locale}`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/register]", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
