import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteConversation, getConversation } from "@/lib/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const conversation = await getConversation(session.user.id, params.id);
  if (!conversation) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(conversation);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const deleted = await deleteConversation(session.user.id, params.id);
  return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "not_found" }, { status: 404 });
}
