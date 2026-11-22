import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { dbName, getMongoClient } from "@/lib/mongo";
import { deleteAllConversations } from "@/lib/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Permanently delete the signed-in user's account, linked sign-in methods, and all saved chats. */
export async function DELETE() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !ObjectId.isValid(userId)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const db = (await getMongoClient()).db(dbName());
    const _id = new ObjectId(userId);
    const user = await db.collection("users").findOne({ _id });
    await deleteAllConversations(userId);
    await db.collection("accounts").deleteMany({ userId: _id });
    await db.collection("sessions").deleteMany({ userId: _id });
    if (user?.email) {
      await db.collection("verification_tokens").deleteMany({ identifier: user.email });
      await db.collection("pending_registrations").deleteMany({ email: user.email });
    }
    await db.collection("users").deleteOne({ _id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/account]", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
