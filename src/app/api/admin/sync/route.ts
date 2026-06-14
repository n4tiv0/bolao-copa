import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { syncFootballData } from "@/lib/footballApi";

export async function POST() {
  try {
    await requireAdmin();
    return NextResponse.json(await syncFootballData());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ error: message }, { status: message === "ADMIN_REQUIRED" ? 403 : 500 });
  }
}
