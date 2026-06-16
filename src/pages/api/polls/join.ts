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

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  const poll = await prisma.poll.findUnique({
    where: {
      code,
    },
    include: {
      participants: {
        where: {
          userId: session.user.id,
        },
      },
    },
  });

  if (!poll) {
    return res.status(404).json({ error: "Poll not found" });
  }

  if (poll.participants.length > 0) {
    return res.status(400).json({ error: "You already joined this poll" });
  }

  await prisma.participant.create({
    data: {
      pollId: poll.id,
      userId: session.user.id,
    },
  });

  return res.status(201).json({ message: "Joined successfully" });
}
