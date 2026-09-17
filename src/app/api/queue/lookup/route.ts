import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayDate } from "@/lib/queue";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  if (!(await rateLimit(`lookup:${ip}`, 30, 15 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Too many attempts, try again later" },
      { status: 429 }
    );
  }

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
