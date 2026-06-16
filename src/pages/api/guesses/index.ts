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

  const { matchId, homeScore, awayScore } = req.body;

  if (!matchId || homeScore === undefined || awayScore === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const match = await prisma.match.findUnique({
    where: { id: Number(matchId) },
  });

  if (!match) {
    return res.status(404).json({ error: "Match not found" });
  }

  if (match.date < new Date()) {
    return res.status(400).json({ error: "Match already started" });
  }

  const prediction = await prisma.prediction.upsert({
    where: {
      userId_matchId: {
        userId: session.user.id,
        matchId: match.id,
      },
    },
    update: {
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
    },
    create: {
      userId: session.user.id,
      matchId: match.id,
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
    },
  });

  return res.status(201).json(prediction);
}
