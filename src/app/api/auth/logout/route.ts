import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (token) {
    await deleteSession(token);
    cookieStore.delete("session_token");
  }
  return NextResponse.json({ ok: true });
}
