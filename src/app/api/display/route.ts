import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayDate } from "@/lib/queue";

export async function GET() {
  const date = getTodayDate();

  const called = await prisma.queueEntry.findMany({
    where: { date, status: { in: ["called", "in_progress"] } },
    include: { assignedTo: { include: { user: true } } },
    orderBy: { calledAt: "desc" },
    take: 5,
  });

  const waitingCount = await prisma.queueEntry.count({
    where: { date, status: "waiting" },
  });

  return NextResponse.json({ called, waitingCount });
}
