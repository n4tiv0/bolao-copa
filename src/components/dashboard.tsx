"use client";

import { useMemo, useState } from "react";
import {
  BadgeDollarSign,
  CalendarClock,
  Check,
  Crown,
  Gauge,
  Lock,
  LogIn,
  Medal,
  ReceiptText,
  ShieldCheck,
  Trophy,
  UserRound,
} from "lucide-react";
import { isMatchLocked } from "@/lib/rules";

type Team = { id: string; name: string; flag: string; eliminated: boolean };
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  paid: boolean;
  paymentStatus: string;
  points: number;
  championTeam?: Team | null;
};
type Match = {
  id: number;
  date: Date | string;
  stage: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  isBrazilMatch: boolean;
  homeTeam: Team;
  awayTeam: Team;
};
type Payment = {
  id: string;
  type: string;
  amount: number;
  pixReference: string;
  user: User;
};
type Prizes = {
  totalPot: number;
  championPot: number;
  rankingPot: number;
  firstPrize: number;
  secondPrize: number;
  thirdPrize: number;
  championPrizePerUser: number;
};

const tabs = [
  { key: "jogos", label: "Jogos", icon: CalendarClock },
  { key: "ranking", label: "Ranking", icon: Medal },
  { key: "campeao", label: "Campeao", icon: Crown },
  { key: "admin", label: "Admin", icon: ShieldCheck },
] as const;

export function Dashboard({
  currentUser,
  matches,
  users,
  teams,
  pendingPayments,
  prizes,
  buybackEligible,
}: {
  currentUser: User | null;
  matches: Match[];
  users: User[];
  teams: Team[];
  pendingPayments: Payment[];
  prizes: Prizes;
  buybackEligible: boolean;
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("jogos");
  const [notice, setNotice] = useState("Pronto para a proxima rodada");
  const nextBrazilMatch = useMemo(
    () => matches.find((match) => match.isBrazilMatch && match.status !== "FINISHED"),
    [matches]
  );

  async function loginDemo(email = "admin@bolao.local", password = "admin123") {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setNotice(res.ok ? "Sessao iniciada" : "Falha no login");
    if (res.ok) window.location.reload();
  }

  async function savePrediction(matchId: number) {
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, homeScore: 2, awayScore: 1 }),
    });
    setNotice(res.ok ? "Palpite salvo com seguranca" : (await res.json()).error);
  }

  async function approvePayment(id: string) {
    const res = await fetch(`/api/admin/payments/${id}/approve`, { method: "POST" });
    setNotice(res.ok ? "Pagamento aprovado" : "Aprovacao bloqueada");
    if (res.ok) window.location.reload();
  }

  async function syncApi() {
    const res = await fetch("/api/admin/sync", { method: "POST" });
    const data = await res.json();
    setNotice(res.ok ? `Sync ${data.source}: ${data.count} jogos` : data.error);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_28%),linear-gradient(135deg,#0f172a,#020617_62%)] pb-24 md:pb-0">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-4 md:px-6 md:py-6">
        <aside className="glass-panel sticky top-6 hidden h-[calc(100vh-48px)] w-72 shrink-0 rounded-lg p-5 md:block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#d6a129] text-[#020617]">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Bolao</p>
              <h1 className="text-xl font-semibold text-slate-50">Copa do Mundo</h1>
            </div>
          </div>
          <nav className="mt-8 space-y-2">
            {tabs.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`tap-feedback flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm ${
                  tab === item.key
                    ? "bg-[#d6a129] text-[#020617]"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-8 rounded-md border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[#f7d46a]">Status</p>
            <p className="mt-2 text-sm text-slate-300">{notice}</p>
          </div>
        </aside>

        <section className="w-full space-y-5">
          <header className="glass-panel rounded-lg p-4 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-[#22c55e]">Dark mode first</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-50 md:text-4xl">
                  Operacao do bolao
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Taxa fixa de R$ 50, palpites bloqueados no servidor 1h antes
                  do jogo e ranking com peso dobrado para Brasil.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!currentUser ? (
                  <>
                    <button onClick={() => loginDemo()} className="tap-feedback inline-flex items-center gap-2 rounded-md bg-[#d6a129] px-4 py-3 text-sm font-semibold text-[#020617]">
                      <LogIn size={17} /> Entrar admin
                    </button>
                    <button onClick={() => loginDemo("ana@bolao.local", "bolao123")} className="tap-feedback inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100">
                      <UserRound size={17} /> Entrar demo
                    </button>
                  </>
                ) : (
                  <div className="rounded-md border border-white/10 px-4 py-3 text-sm text-slate-300">
                    {currentUser.name} · {currentUser.paid ? "Pago" : "Aguardando Pix"}
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={BadgeDollarSign} label="Arrecadado" value={money(prizes.totalPot)} />
            <Metric icon={Trophy} label="Campeao" value={money(prizes.championPot)} />
            <Metric icon={Medal} label="Ranking Top 3" value={money(prizes.rankingPot)} />
            <Metric icon={Gauge} label="Proximo Brasil" value={nextBrazilMatch ? `${nextBrazilMatch.homeTeam.id} x ${nextBrazilMatch.awayTeam.id}` : "Finalizado"} />
          </div>

          {tab === "jogos" && (
            <section className="grid gap-4 lg:grid-cols-2">
              {matches.map((match) => (
                <article key={match.id} className={`glass-panel rounded-lg p-4 ${match.isBrazilMatch ? "gold-glow" : ""}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{stageName(match.stage)}</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-50">
                        {match.homeTeam.flag} {match.homeTeam.name} <span className="text-slate-500">vs</span> {match.awayTeam.flag} {match.awayTeam.name}
                      </h3>
                    </div>
                    <span className={`rounded-md px-2 py-1 text-xs ${match.status === "FINISHED" ? "bg-[#22c55e]/15 text-[#22c55e]" : "bg-white/5 text-slate-300"}`}>
                      {match.status === "FINISHED" ? `${match.homeScore} x ${match.awayScore}` : dateShort(match.date)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-md border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      {isMatchLocked(new Date(match.date)) ? <Lock size={16} /> : <Check size={16} className="text-[#22c55e]" />}
                      {isMatchLocked(new Date(match.date)) ? "Bloqueado" : "Palpites abertos"}
                    </div>
                    <button onClick={() => savePrediction(match.id)} className="tap-feedback rounded-md bg-[#d6a129] px-3 py-2 text-sm font-semibold text-[#020617]">
                      Salvar 2x1
                    </button>
                  </div>
                </article>
              ))}
            </section>
          )}

          {tab === "ranking" && (
            <section className="glass-panel rounded-lg p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Classificacao</h3>
                <span className="text-sm text-slate-400">50% · 30% · 20%</span>
              </div>
              <div className="space-y-3">
                {users.map((user, index) => (
                  <div key={user.id} className={`relative flex items-center justify-between rounded-md border border-white/10 p-3 ${index < 3 ? "top-three gold-glow" : "bg-white/[0.03]"}`}>
                    <div className="relative flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-sm font-bold">{index + 1}</span>
                      <div>
                        <p className="font-medium text-slate-50">{user.name}</p>
                        <p className="text-sm text-slate-400">Campeao: {user.championTeam?.name || "pendente"}</p>
                      </div>
                    </div>
                    <strong className="relative text-[#f7d46a]">{user.points} pts</strong>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "campeao" && (
            <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
              <div className="glass-panel rounded-lg p-4">
                <h3 className="text-xl font-semibold">Palpite de campeao</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {teams.map((team) => (
                    <div key={team.id} className={`rounded-md border p-3 ${team.eliminated ? "border-red-400/25 bg-red-500/10 text-slate-500" : "border-white/10 bg-white/[0.03]"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{team.flag} {team.name}</span>
                        {team.eliminated && <span className="text-xs text-red-300">Eliminada</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-panel rounded-lg p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-[#f7d46a]">Repescagem</p>
                <h3 className="mt-2 text-xl font-semibold">{buybackEligible ? "Elegivel para buy-back" : "Sem recompra ativa"}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Recompra de R$ 50 permitida ate as quartas se a selecao escolhida for eliminada. A partir das semifinais, a escolha trava.
                </p>
              </div>
            </section>
          )}

          {tab === "admin" && (
            <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
              <div className="glass-panel rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Comprovantes Pix</h3>
                  <button onClick={syncApi} className="tap-feedback rounded-md border border-[#22c55e]/40 px-3 py-2 text-sm text-[#22c55e]">Sincronizar jogos</button>
                </div>
                <div className="mt-4 space-y-3">
                  {pendingPayments.length === 0 && <p className="text-sm text-slate-400">Nenhum comprovante pendente.</p>}
                  {pendingPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] p-3">
                      <div>
                        <p className="font-medium">{payment.user.name}</p>
                        <p className="text-sm text-slate-400">{payment.type} · {payment.pixReference}</p>
                      </div>
                      <button onClick={() => approvePayment(payment.id)} className="tap-feedback rounded-md bg-[#d6a129] px-3 py-2 text-sm font-semibold text-[#020617]">Aprovar</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-panel rounded-lg p-4">
                <ReceiptText className="text-[#f7d46a]" />
                <h3 className="mt-3 text-xl font-semibold">Auditoria</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Aprovar Pix ativa `paid`, registra pagamentos de inscricao e aplica buy-back de campeao em transacao.
                </p>
              </div>
            </section>
          )}
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#020617]/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {tabs.map((item) => (
            <button key={item.key} onClick={() => setTab(item.key)} className={`tap-feedback flex flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px] ${tab === item.key ? "bg-[#d6a129] text-[#020617]" : "text-slate-400"}`}>
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="glass-panel rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <Icon size={18} className="text-[#f7d46a]" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateShort(value: Date | string) {
  return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function stageName(stage: string) {
  return {
    GROUP: "Fase de grupos",
    ROUND_OF_16: "Oitavas",
    QUARTER_FINALS: "Quartas",
    SEMI_FINALS: "Semifinais",
    THIRD_PLACE: "Terceiro lugar",
    FINAL: "Final",
  }[stage] || stage;
}
