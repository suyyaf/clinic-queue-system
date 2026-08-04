import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getTodayDate } from "@/lib/queue";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") || getTodayDate();
  const doctorId = req.nextUrl.searchParams.get("doctorId");

  const where: Record<string, unknown> = { date };

  if (user.role === "doctor") {
    where.assignedToId = user.doctorProfileId || null;
  } else if (doctorId) {
    where.assignedToId = doctorId === "unassigned" ? null : doctorId;
  }

  const entries = await prisma.queueEntry.findMany({
    where,
    include: { assignedTo: { include: { user: true } } },
    orderBy: [{ queueNumber: "asc" }],
  });

  return NextResponse.json({ entries });
}
