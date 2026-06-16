import Image from "next/image";
import Link from "next/link";
import AvatarsImg from "../assets/people.png";

interface PollProps {
  poll: {
    id: string;
    title: string;
    code: string;
    owner: {
      name: string;
    };
    _count: {
      participants: number;
    };
  };
}

export function Poll({ poll }: PollProps) {
  return (
    <Link href={`/polls/${poll.id}`}>
      <div
        className="flex flex-col p-4 bg-gray-800 rounded border-b-2
    border-yellow-500 hover:bg-gray-600 transition-colors h-full"
      >
        <h1 className="font-bold text-lg text-white">{poll.title}</h1>
        <p className="font-normal text-sm mt-1 text-gray-400">
          Criado por {poll.owner?.name || "Desconhecido"}
        </p>
        
        <div className="mt-6 flex items-center gap-2">
          <Image src={AvatarsImg} alt="avatares" className="h-8 w-auto" />
          <span className="text-gray-200 text-sm font-bold">
            +{poll._count?.participants || 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
