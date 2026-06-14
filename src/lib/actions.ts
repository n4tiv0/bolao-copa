import { prisma } from "./db";
import {
  canBuybackByDate,
  calculatePoints,
  distributePrizes,
  isMatchLocked,
} from "./rules";

export async function savePrediction(params: {
  userId: string;
  matchId: number;
  homeScore: number;
  awayScore: number;
}) {
  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user?.paid) throw new Error("PAYMENT_REQUIRED");

  const match = await prisma.match.findUnique({ where: { id: params.matchId } });
  if (!match) throw new Error("MATCH_NOT_FOUND");
  if (isMatchLocked(match.date)) throw new Error("MATCH_LOCKED");

  return prisma.$transaction(async (tx) => {
    return tx.prediction.upsert({
      where: { userId_matchId: { userId: params.userId, matchId: params.matchId } },
      create: params,
      update: {
        homeScore: params.homeScore,
        awayScore: params.awayScore,
      },
    });
  });
}

export async function approvePayment(paymentId: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "APPROVED" },
    });

    if (payment.type === "REGISTRATION") {
      await tx.user.update({
        where: { id: payment.userId },
        data: { paid: true, paymentStatus: "PAID" },
      });
    }

    if (payment.type === "CHAMPION_BUYBACK" && payment.newChampionTeamId) {
      await tx.championPick.updateMany({
        where: { userId: payment.userId, active: true },
        data: { active: false },
      });
      await tx.championPick.create({
        data: {
          userId: payment.userId,
          teamId: payment.newChampionTeamId,
          paymentId: payment.id,
          buyback: true,
        },
      });
      await tx.user.update({
        where: { id: payment.userId },
        data: { championTeamId: payment.newChampionTeamId },
      });
    }

    return payment;
  });
}

export async function recomputeFinishedMatch(matchId: number) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { predictions: true },
  });
  if (!match || match.status !== "FINISHED" || match.homeScore === null || match.awayScore === null) {
    return { updated: 0 };
  }

  await prisma.$transaction(
    match.predictions.map((prediction) =>
      prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          pointsEarned: calculatePoints(
            prediction.homeScore,
            prediction.awayScore,
            match.homeScore!,
            match.awayScore!,
            match.isBrazilMatch
          ),
        },
      })
    )
  );

  const users = await prisma.user.findMany({ select: { id: true } });
  for (const user of users) {
    const aggregate = await prisma.prediction.aggregate({
      where: { userId: user.id },
      _sum: { pointsEarned: true },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { points: aggregate._sum.pointsEarned || 0 },
    });
  }

  return { updated: match.predictions.length };
}

export async function getPrizeSnapshot(championTeamId = "BRA") {
  const paid = await prisma.user.count({ where: { paid: true } });
  const correctChampionCount = await prisma.user.count({
    where: { paid: true, championTeamId },
  });
  return distributePrizes(paid, correctChampionCount);
}

export async function canUserBuyback(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { championTeam: true },
  });
  const firstSemi = await prisma.match.findFirst({
    where: { stage: "SEMI_FINALS" },
    orderBy: { date: "asc" },
  });

  return Boolean(
    user?.championTeam?.eliminated &&
      canBuybackByDate(firstSemi?.date ?? null)
  );
}
