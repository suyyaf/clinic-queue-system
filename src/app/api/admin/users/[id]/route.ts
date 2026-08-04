import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.name) updates.name = body.name;
  if (body.active !== undefined) updates.active = body.active;
  if (body.password) updates.password = await hashPassword(body.password);

  const updated = await prisma.user.update({
    where: { id },
    data: updates,
    include: { doctorProfile: true },
  });

  if (body.specialty !== undefined || body.roomNumber !== undefined) {
    await prisma.doctorProfile.updateMany({
      where: { userId: id },
      data: {
        ...(body.specialty !== undefined ? { specialty: body.specialty } : {}),
        ...(body.roomNumber !== undefined ? { roomNumber: body.roomNumber } : {}),
      },
    });
  }

  return NextResponse.json({ user: updated });
}
