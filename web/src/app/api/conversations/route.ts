import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createConversation, listConversations, sanitizeMessages } from "@/lib/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List the signed-in user's saved chats (newest first). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ conversations: await listConversations(session.user.id) });
}

/** Save a chat the person had as a guest into their account, right after they sign in. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const messages = sanitizeMessages(body.messages);
  const firstQuestion = messages.find((m) => m.role === "user")?.text;
  if (!firstQuestion) return NextResponse.json({ error: "empty" }, { status: 400 });

  const id = await createConversation(session.user.id, firstQuestion, messages);
  return NextResponse.json({ id });
}
