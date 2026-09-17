import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export type Role = "admin" | "reception" | "doctor";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  doctorProfileId?: string;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({ data: { userId, token, expiresAt } });
  return token;
}

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { doctorProfile: true } } },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (!session.user.active) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as Role,
    doctorProfileId: session.user.doctorProfile?.id,
  };
}

export async function deleteSession(token: string) {
  await prisma.session.delete({ where: { token } }).catch(() => {});
}
