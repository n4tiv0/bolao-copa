import { Game } from "../../components/Game";
import { Layout } from "../../components/Layout";
import { prisma } from "../../lib/db";
import { auth } from "@/lib/auth";

export async function getServerSideProps(context) {
  const session = await auth(context.req, context.res);
  
  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }

  const { id } = context.params;

  // Verifica se o bolão existe e se o usuário participa
  const poll = await prisma.poll.findUnique({
    where: { id: String(id) },
    include: {
      participants: {
        where: { userId: session.user.id }
      }
    }
  });

  if (!poll || poll.participants.length === 0) {
    return { redirect: { destination: "/polls", permanent: false } };
  }

  // Busca as partidas ordenadas e os palpites deste usuário
  const matches = await prisma.match.findMany({
    orderBy: { date: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: {
        where: { userId: session.user.id }
      }
    }
  });

  return {
    props: {
      poll: JSON.parse(JSON.stringify(poll)),
      matches: JSON.parse(JSON.stringify(matches)),
    },
  };
}

export default function PollDetails({ poll, matches }) {
  return (
    <Layout title={`Bolão: ${poll.title}`}>
      <div className="flex flex-col mt-12 px-4 max-w-4xl mx-auto">
        <h1 className="text-white text-2xl font-bold mb-8 text-center">{poll.title}</h1>
        
        <div className="flex flex-col gap-6">
          {matches.length === 0 ? (
            <p className="text-gray-300 text-center">Nenhuma partida agendada.</p>
          ) : (
            matches.map((match) => (
              <Game key={match.id} match={match} />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
