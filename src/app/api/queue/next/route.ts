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

  // Claim the next waiting patient atomically: a conditional update (status
  // still "waiting") inside a transaction means a concurrent call from a
  // second tab/click will block on the row lock and then see the row is no
  // longer "waiting", so only one request can ever claim a given patient.
  const claimedId = await prisma.$transaction(async (tx) => {
    await tx.queueEntry.updateMany({
      where: {
        assignedToId: user.doctorProfileId,
        date,
        status: "in_progress",
      },
      data: { status: "done", doneAt: new Date() },
    });

    const next = await tx.queueEntry.findFirst({
      where: {
        assignedToId: user.doctorProfileId || null,
        date,
        status: "waiting",
      },
      orderBy: { queueNumber: "asc" },
    });

    if (!next) return null;

    const claim = await tx.queueEntry.updateMany({
      where: { id: next.id, status: "waiting" },
      data: { status: "called", calledAt: new Date(), notifiedAt: new Date() },
    });

    return claim.count === 1 ? next.id : null;
  });

  if (!claimedId) {
    return NextResponse.json({ entry: null, message: "No more patients in queue" });
  }

  const updated = await prisma.queueEntry.findUniqueOrThrow({
    where: { id: claimedId },
    include: { assignedTo: { include: { user: true } } },
  });

  const message = buildQueueMessage(updated.patientName, updated.queueNumber, "called");
  await sendSms({ to: updated.patientPhone, message });

  return NextResponse.json({ entry: updated });
}
