import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const body = await request.json();
  const type = body.type === "CHAMPION_BUYBACK" ? "CHAMPION_BUYBACK" : "REGISTRATION";
  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      type,
      pixReference: String(body.pixReference || "comprovante-pendente"),
      amount: 50,
      newChampionTeamId: body.newChampionTeamId ? String(body.newChampionTeamId) : null,
      status: "PENDING",
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { paymentStatus: "PENDING_APPROVAL", pixReference: payment.pixReference },
  });

  return NextResponse.json({ ok: true, payment });
}
