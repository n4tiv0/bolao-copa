import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "@/lib/getServerSession";
import { prisma } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req);
  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { matchId } = req.body;
  if (!matchId) return res.status(400).json({ error: "Match ID required" });

  const match = await prisma.match.findUnique({
    where: { id: Number(matchId) },
    include: { homeTeam: true, awayTeam: true },
  });

  if (!match) return res.status(404).json({ error: "Match not found" });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "AI Services temporarily disabled (Missing API Key)" });
  }

  try {
    // Integração real com a API do Gemini via @google/genai ou Vercel AI SDK
    // import { GoogleGenAI } from "@google/genai";
    // const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // const response = await ai.models.generateContent({
    //   model: 'gemini-2.5-flash',
    //   contents: `Gere uma análise rápida com dicas para o jogo ${match.homeTeam.name} vs ${match.awayTeam.name}.`,
    // });
    
    // const insight = response.text;

    return res.status(200).json({ 
      insight: `Mock: Historicamente, ${match.homeTeam.name} possui uma vantagem tática contra ${match.awayTeam.name}. Recomendação de palpite: 2-1.`
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate insight" });
  }
}
