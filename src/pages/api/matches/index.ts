import { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await auth(req, res);

  if (!session || !session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const matches = await prisma.match.findMany({
    orderBy: {
      date: "asc",
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: {
        where: {
          userId: session.user.id,
        },
      },
    },
  });

  return res.status(200).json({
    matches: matches.map((match) => {
      return {
        ...match,
        guess: match.predictions.length > 0 ? match.predictions[0] : null,
      };
    }),
  });
}
