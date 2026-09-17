import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayDate } from "@/lib/queue";
import { getNextQueueNumber } from "@/lib/queue-server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { sendSms } from "@/lib/sms";

const schema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(7).max(20),
  doctorId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  if (!(await rateLimit(`register:${ip}`, 20, 60 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Too many attempts, try again later" },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, phone, doctorId } = parsed.data;
  const date = getTodayDate();

  // Prevent duplicate registration on same day with same phone
  const existing = await prisma.queueEntry.findFirst({
    where: {
      patientPhone: phone,
      date,
      status: { in: ["waiting", "called", "in_progress"] },
    },
  });

  if (existing) {
    return NextResponse.json(
      {
        error: "This phone number already has an active queue entry today",
        queueNumber: existing.queueNumber,
        status: existing.status,
      },
      { status: 409 }
    );
  }

  const queueNumber = await getNextQueueNumber();

  const entry = await prisma.queueEntry.create({
    data: {
      queueNumber,
      patientName: name.trim(),
      patientPhone: phone.trim(),
      assignedToId: doctorId || null,
      date,
    },
  });

  const queueStr = String(entry.queueNumber).padStart(3, "0");
  sendSms({
    to: entry.patientPhone,
    message: `Hi ${entry.patientName}, you are registered at the clinic. Your queue number is #${queueStr}. We will SMS you when it's your turn.`,
  }).catch(() => {});

  return NextResponse.json({
    queueNumber: entry.queueNumber,
    id: entry.id,
    patientName: entry.patientName,
  });
}
