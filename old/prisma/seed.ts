import { PrismaClient } from "@prisma/client";
import { mockFixtures, getTeamFlagByCode, getTeamFullNameByCode } from "../src/lib/footballApi";

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

  console.log("✅ Seed finalizado: Apenas seleções e partidas cadastradas.");
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
