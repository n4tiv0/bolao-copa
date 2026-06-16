import { useState } from "react";
import toast from "react-hot-toast";

interface GameProps {
  match: {
    id: number;
    date: string;
    homeTeam: { name: string; code: string };
    awayTeam: { name: string; code: string };
    predictions: Array<{ homeScore: number; awayScore: number }>;
  };
}

export function Game({ match }: GameProps) {
  const existingPrediction = match.predictions?.[0];
  const [homeScore, setHomeScore] = useState(existingPrediction?.homeScore?.toString() || "");
  const [awayScore, setAwayScore] = useState(existingPrediction?.awayScore?.toString() || "");
  const [loading, setLoading] = useState(false);

  const isPast = new Date(match.date) < new Date();

  async function handleConfirmGuess() {
    if (!homeScore || !awayScore) {
      toast.error("Preencha o placar de ambos os times!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/guesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, homeScore, awayScore }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      toast.success("Palpite salvo com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar palpite.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="p-4 bg-gray-800 grid justify-center border-b-2
    border-yellow-500 text-center items-center gap-4 rounded w-full"
    >
      <div className="mb-1 gap-1 grid">
        <strong className="font-bold text-white">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </strong>
        <p className="text-sm text-gray-400">
          {new Date(match.date).toLocaleString()}
        </p>
      </div>

      <div className="flex justify-between items-center w-full">
        <div className="flex gap-2 items-center flex-1 justify-end">
          <input
            type="number"
            min="0"
            max="20"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            disabled={isPast}
            className="bg-gray-900 w-16 h-10 rounded border
            border-gray-600 text-gray-200 p-2 text-center disabled:opacity-50"
          />
          <span className="text-white font-bold uppercase w-10 text-left ml-2">{match.homeTeam.code || match.homeTeam.name.substring(0,3)}</span>
        </div>

        <p className="text-gray-400 mx-4 font-bold text-xl">X</p>

        <div className="flex gap-2 items-center flex-1 justify-start">
          <span className="text-white font-bold uppercase w-10 text-right mr-2">{match.awayTeam.code || match.awayTeam.name.substring(0,3)}</span>
          <input
            type="number"
            min="0"
            max="20"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            disabled={isPast}
            className="bg-gray-900 w-16 h-10 rounded border
            border-gray-600 text-gray-200 p-2 text-center disabled:opacity-50"
          />
        </div>
      </div>

      {!isPast && (
        <button
          onClick={handleConfirmGuess}
          disabled={loading}
          className="bg-green-500 w-full rounded text-sm font-semibold py-3 text-white
        hover:bg-green-600 transition-colors disabled:opacity-50 mt-2"
        >
          {loading ? "SALVANDO..." : "CONFIRMAR PALPITE"}
        </button>
      )}
      {isPast && (
        <p className="text-yellow-500 font-bold text-sm mt-2">TEMPO ESGOTADO</p>
      )}
    </div>
  );
}
