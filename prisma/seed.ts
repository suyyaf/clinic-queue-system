import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);
  const receptionPassword = await bcrypt.hash("reception123", 12);
  const doctorPassword = await bcrypt.hash("doctor123", 12);

  await prisma.user.upsert({
    where: { email: "admin@clinic.com" },
    update: {},
    create: { name: "Admin", email: "admin@clinic.com", password: adminPassword, role: "admin" },
  });

  await prisma.user.upsert({
    where: { email: "reception@clinic.com" },
    update: {},
    create: { name: "Reception Staff", email: "reception@clinic.com", password: receptionPassword, role: "reception" },
  });

  await prisma.user.upsert({
    where: { email: "dr.ali@clinic.com" },
    update: {},
    create: {
      name: "Ali Hassan",
      email: "dr.ali@clinic.com",
      password: doctorPassword,
      role: "doctor",
      doctorProfile: { create: { specialty: "General Practice", roomNumber: "101" } },
    },
  });

  await prisma.user.upsert({
    where: { email: "dr.siti@clinic.com" },
    update: {},
    create: {
      name: "Siti Rahimah",
      email: "dr.siti@clinic.com",
      password: doctorPassword,
      role: "doctor",
      doctorProfile: { create: { specialty: "Pediatrics", roomNumber: "102" } },
    },
  });

  console.log("Seeded accounts:");
  console.log("  admin@clinic.com      / admin123");
  console.log("  reception@clinic.com  / reception123");
  console.log("  dr.ali@clinic.com     / doctor123");
  console.log("  dr.siti@clinic.com    / doctor123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
