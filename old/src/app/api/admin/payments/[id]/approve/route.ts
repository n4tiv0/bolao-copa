import { NextResponse } from "next/server";
import { approvePayment } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const params = await context.params;
    const payment = await approvePayment(params.id);
    return NextResponse.json({ ok: true, payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ error: message }, { status: message === "ADMIN_REQUIRED" ? 403 : 400 });
  }
}
