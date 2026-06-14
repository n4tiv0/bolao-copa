import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSessionCookie, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").toLowerCase();
  const password = String(body.password || "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 });
  }

  await setSessionCookie(signSession({ sub: user.id, role: user.role as "USER" | "ADMIN" }));
  return NextResponse.json({ ok: true, role: user.role });
}
