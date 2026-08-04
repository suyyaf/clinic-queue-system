import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getTodayDate } from "@/lib/queue";
import { sendSms, buildQueueMessage } from "@/lib/sms";

export async function POST() {
  const user = await getSession();
  if (!user || user.role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = getTodayDate();

  // Mark any in_progress as done first
  await prisma.queueEntry.updateMany({
    where: {
      assignedToId: user.doctorProfileId,
      date,
      status: "in_progress",
    },
    data: { status: "done", doneAt: new Date() },
  });

  const next = await prisma.queueEntry.findFirst({
    where: {
      assignedToId: user.doctorProfileId || null,
      date,
      status: "waiting",
    },
    orderBy: { queueNumber: "asc" },
  });

  if (!next) {
    return NextResponse.json({ entry: null, message: "No more patients in queue" });
  }

  const message = buildQueueMessage(next.patientName, next.queueNumber, "called");
  await sendSms({ to: next.patientPhone, message });

  const updated = await prisma.queueEntry.update({
    where: { id: next.id },
    data: { status: "called", calledAt: new Date(), notifiedAt: new Date() },
    include: { assignedTo: { include: { user: true } } },
  });

  return NextResponse.json({ entry: updated });
}
