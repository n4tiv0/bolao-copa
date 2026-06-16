import { Poll } from "../components/Poll";
import { Layout } from "../components/Layout";
import { prisma } from "../lib/db";
import { auth } from "@/lib/auth";

export async function getServerSideProps(context) {
  const session = await auth(context.req, context.res);
  
  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
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
      owner: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    props: {
      polls: JSON.parse(JSON.stringify(polls)),
    },
  };
}

export default function Polls({ polls }) {
  return (
    <Layout title="NLW Copa | Bolões">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12 px-4">
        {polls.length === 0 ? (
          <p className="text-gray-300 text-center col-span-full">
            Você ainda não participa de nenhum bolão.
          </p>
        ) : (
          polls.map((poll) => (
            <Poll key={poll.id} poll={poll} />
          ))
        )}
      </div>
    </Layout>
  );
}
