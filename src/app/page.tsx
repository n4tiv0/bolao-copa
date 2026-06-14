import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canUserBuyback, getPrizeSnapshot } from "@/lib/actions";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [user, matches, users, teams, payments, prizes] = await Promise.all([
    getCurrentUser(),
    prisma.match.findMany({
      orderBy: { date: "asc" },
      include: { homeTeam: true, awayTeam: true, predictions: true },
    }),
    prisma.user.findMany({
      orderBy: [{ points: "desc" }, { name: "asc" }],
      include: { championTeam: true },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.payment.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { user: true },
    }),
    getPrizeSnapshot("BRA"),
  ]);

  const buybackEligible = user ? await canUserBuyback(user.id) : false;

  return (
    <Dashboard
      currentUser={user}
      matches={matches}
      users={users}
      teams={teams}
      pendingPayments={payments}
      prizes={prizes}
      buybackEligible={buybackEligible}
    />
  );
}
