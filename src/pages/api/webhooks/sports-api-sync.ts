import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // O endpoint pode ser chamado via CRON (com Authorization Header) ou POST manual
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Validação simples de segurança para o Cron da Vercel
  const authHeader = req.headers.authorization;
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    req.headers["x-admin-override"] !== "true" // Mock for local admin trigger
  ) {
    return res.status(401).json({ error: "Unauthorized cron execution" });
  }

  try {
    // 1. Aqui seria feita a chamada para a api-football.com
    // const response = await fetch("https://v3.football.api-sports.io/fixtures?date=YYYY-MM-DD", { headers: { "x-apisports-key": process.env.SPORTS_API_KEY } })
    // const data = await response.json();

    console.log("Mock: Buscando dados na Sports API...");
    
    // 2. Atualizar matches no banco de dados
    // for (const fixture of data.response) {
    //   await prisma.match.update({
    //     where: { id: fixture.fixture.id },
    //     data: { homeScore: fixture.goals.home, awayScore: fixture.goals.away, status: fixture.fixture.status.short }
    //   });
    // }

    // 3. Engine de Pontuação
    // Se o jogo terminou (status FT), recalcular pontos dos usuários no ranking global
    // Isso iteraria pelos Predictions associados aos Matches atualizados e distribuiria os pontos.
    
    return res.status(200).json({ success: true, message: "Matches sync executed (mocked mode)" });
  } catch (error) {
    console.error("Cron Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
