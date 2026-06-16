import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.team.createMany({
    data: [
      { id: 'BRA', name: 'Brasil', flag: '🇧🇷', group: 'G' },
      { id: 'SRB', name: 'Sérvia', flag: '🇷🇸', group: 'G' },
      { id: 'SUI', name: 'Suíça', flag: '🇨🇭', group: 'G' },
      { id: 'CMR', name: 'Camarões', flag: '🇨🇲', group: 'G' },
    ],
    skipDuplicates: true,
  });

  const match1 = await prisma.match.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      date: new Date('2022-11-24T19:00:00.000Z'),
      homeTeamId: 'BRA',
      awayTeamId: 'SRB',
      stage: 'GROUP',
      isBrazilMatch: true,
      status: 'FINISHED',
      homeScore: 2,
      awayScore: 0,
    },
  });

  const match2 = await prisma.match.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      date: new Date('2026-06-16T16:00:00.000Z'), // Jogo futuro
      homeTeamId: 'BRA',
      awayTeamId: 'SUI',
      stage: 'GROUP',
      isBrazilMatch: true,
      status: 'SCHEDULED',
    },
  });

  console.log('Seed executed: created teams and matches.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
