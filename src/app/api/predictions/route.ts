import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { savePrediction } from "@/lib/actions";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  try {
    const body = await request.json();
    const prediction = await savePrediction({
      userId: user.id,
      matchId: Number(body.matchId),
      homeScore: Number(body.homeScore),
      awayScore: Number(body.awayScore),
    });
    return NextResponse.json({ ok: true, prediction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
