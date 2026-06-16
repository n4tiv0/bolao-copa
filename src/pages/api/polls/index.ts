import { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const session = await auth(req, res);

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const code = crypto.randomBytes(3).toString("hex").toUpperCase();

    const poll = await prisma.poll.create({
      data: {
        title,
        code,
        ownerId: session.user.id,
        participants: {
          create: {
            userId: session.user.id,
          },
        },
      },
    });

    return res.status(201).json(poll);
  }

  if (req.method === "GET") {
    const session = await auth(req, res);

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const polls = await prisma.poll.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        _count: {
          select: { participants: true },
        },
        participants: {
          select: {
            id: true,
            user: {
              select: {
                avatarUrl: true,
              },
            },
          },
          take: 4,
        },
        owner: {
          select: {
            name: true,
          },
        },
      },
    });

    return res.status(200).json({ polls });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
