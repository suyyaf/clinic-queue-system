import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayDate } from "@/lib/queue";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "Phone required" }, { status: 400 });
  }

  const date = getTodayDate();

  const entry = await prisma.queueEntry.findFirst({
    where: { patientPhone: phone.trim(), date },
    include: { assignedTo: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!entry) {
    return NextResponse.json({ entry: null });
  }

  // Count how many are ahead in the queue
  const aheadCount = await prisma.queueEntry.count({
    where: {
      date,
      status: "waiting",
      queueNumber: { lt: entry.queueNumber },
      assignedToId: entry.assignedToId || undefined,
    },
  });

  return NextResponse.json({
    entry: {
      id: entry.id,
      queueNumber: entry.queueNumber,
      patientName: entry.patientName,
      status: entry.status,
      doctor: entry.assignedTo?.user?.name || null,
      aheadCount,
      createdAt: entry.createdAt,
    },
  });
}
