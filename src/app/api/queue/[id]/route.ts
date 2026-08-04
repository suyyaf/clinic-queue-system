import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendSms, buildQueueMessage } from "@/lib/sms";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();

  const entry = await prisma.queueEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};

  if (body.status) {
    updates.status = body.status;
    if (body.status === "called") updates.calledAt = new Date();
    if (body.status === "done" || body.status === "no_show") updates.doneAt = new Date();
  }

  if (body.assignedToId !== undefined) updates.assignedToId = body.assignedToId;
  if (body.notes !== undefined) updates.notes = body.notes;

  if (body.sendNotification || body.status === "called") {
    const type = body.status === "called" ? "called" : "reminder";
    const message = buildQueueMessage(entry.patientName, entry.queueNumber, type);
    await sendSms({ to: entry.patientPhone, message });
    updates.notifiedAt = new Date();
  }

  const updated = await prisma.queueEntry.update({
    where: { id },
    data: updates,
    include: { assignedTo: { include: { user: true } } },
  });

  return NextResponse.json({ entry: updated });
}
