import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { mockFixtures, getTeamFlagByCode, getTeamFullNameByCode } from "../src/lib/footballApi";
import { calculatePoints } from "../src/lib/rules";

const prisma = new PrismaClient();

const teamIds = ["BRA", "CRO", "MEX", "CMR", "ESP", "ARG", "FRA", "GER", "BEL"];

async function main() {
  for (const id of teamIds) {
    await prisma.team.upsert({
      where: { id },
      update: {},
      create: {
        id,
        name: getTeamFullNameByCode(id),
        flag: getTeamFlagByCode(id),
        eliminated: id === "CRO",
      },
    });
  }

  for (const match of mockFixtures) {
    await prisma.match.upsert({
      where: { id: match.id },
      update: {
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        status: match.status,
        date: match.date,
      },
      create: {
        id: match.id,
        homeTeamId: match.homeId,
        awayTeamId: match.awayId,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        date: match.date,
        stage: match.stage,
        isBrazilMatch: match.isBrazil,
        status: match.status,
      },
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@bolao.local" },
    update: {},
    create: {
      name: "Organizador",
      email: "admin@bolao.local",
      password: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
      paid: true,
      paymentStatus: "PAID",
      championTeamId: "BRA",
    },
  });

  const participants = [
    ["Ana Souza", "ana@bolao.local", "BRA", true],
    ["Bruno Lima", "bruno@bolao.local", "ARG", true],
    ["Carla Reis", "carla@bolao.local", "CRO", false],
  ] as const;

  for (const [name, email, championTeamId, paid] of participants) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        password: await bcrypt.hash("bolao123", 10),
        role: "USER",
        paid,
        paymentStatus: paid ? "PAID" : "PENDING_APPROVAL",
        pixReference: paid ? "seed-approved" : "seed-pending",
        championTeamId,
      },
    });

    await prisma.championPick.upsert({
      where: { id: `${user.id}-initial` },
      update: {},
      create: {
        id: `${user.id}-initial`,
        userId: user.id,
        teamId: championTeamId,
      },
    });

    if (!paid) {
      await prisma.payment.create({
        data: {
          userId: user.id,
          type: "REGISTRATION",
          pixReference: "PIX-COMPROVANTE-CARLA",
          status: "PENDING",
          amount: 50,
        },
      });
    }
  }

  await prisma.championPick.upsert({
    where: { id: `${admin.id}-initial` },
    update: {},
    create: { id: `${admin.id}-initial`, userId: admin.id, teamId: "BRA" },
  });

  const ana = await prisma.user.findUniqueOrThrow({ where: { email: "ana@bolao.local" } });
  const match = await prisma.match.findUniqueOrThrow({ where: { id: 1 } });
  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: ana.id, matchId: match.id } },
    update: {},
    create: {
      userId: ana.id,
      matchId: match.id,
      homeScore: 3,
      awayScore: 1,
      pointsEarned: calculatePoints(3, 1, match.homeScore!, match.awayScore!, match.isBrazilMatch),
    },
  });
  await prisma.user.update({ where: { id: ana.id }, data: { points: 10 } });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
