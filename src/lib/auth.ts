import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

const COOKIE_NAME = "bolao_session";

type SessionPayload = {
  sub: string;
  role: "USER" | "ADMIN";
};

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, process.env.AUTH_SECRET || "dev-secret-change-me", {
    expiresIn: "7d",
  });
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(
      token,
      process.env.AUTH_SECRET || "dev-secret-change-me"
    ) as SessionPayload;

    return prisma.user.findUnique({
      where: { id: payload.sub },
      include: { championTeam: true },
    });
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("ADMIN_REQUIRED");
  }
  return user;
}
