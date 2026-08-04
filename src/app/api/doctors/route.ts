import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const doctors = await prisma.doctorProfile.findMany({
    where: { user: { active: true } },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json({ doctors });
}
