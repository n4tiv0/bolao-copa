import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LogOut, Trophy, CalendarClock, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UserDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  // Fetch matches
  const matches = await prisma.match.findMany({
    orderBy: { date: "asc" },
    include: { homeTeam: true, awayTeam: true },
  });

  // Calculate ranking conceptually
  const usersWithMorePoints = await prisma.user.count({
    where: { points: { gt: user.points } }
  });
  const rankingPosition = usersWithMorePoints + 1;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_28%),linear-gradient(135deg,#0f172a,#020617_62%)] pb-24 md:pb-0 text-slate-50">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:px-6">
        
        {/* Header */}
        <header className="glass-panel flex items-center justify-between rounded-2xl p-6 shadow-xl border border-white/5">
          <div>
            <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">Área do Palpiteiro</p>
            <h1 className="text-2xl font-bold mt-1">Olá, {user.name?.split(' ')[0] || 'Usuário'}!</h1>
          </div>
          <div className="flex items-center gap-3">
             {user.role === "ADMIN" && (
                <Link href="/admin" className="tap-feedback rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 px-4 py-2 text-sm font-semibold text-[#22c55e] flex items-center gap-2 hover:bg-[#22c55e]/20 transition-all">
                  <ShieldCheck size={16} /> Admin
                </Link>
             )}
             <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
               <button type="submit" className="tap-feedback rounded-lg bg-white/5 px-4 py-2 text-sm text-slate-300 flex items-center gap-2 hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
                 <LogOut size={16} /> Sair
               </button>
             </form>
          </div>
        </header>

        {/* User Stats Card */}
        <section className="grid gap-6 sm:grid-cols-2">
           <div className="glass-panel rounded-2xl p-6 relative overflow-hidden shadow-lg border border-white/5 group hover:border-[#f7d46a]/30 transition-all">
             <div className="absolute right-[-20px] top-[-20px] text-[#f7d46a]/5 group-hover:text-[#f7d46a]/10 transition-all group-hover:rotate-12 group-hover:scale-110">
               <Trophy size={140} />
             </div>
             <p className="text-sm text-slate-400">Meus Pontos Acumulados</p>
             <p className="mt-2 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#f7d46a] to-[#d6a129]">{user.points}</p>
             <div className="mt-6 inline-flex items-center gap-2 bg-black/30 rounded-full px-3 py-1">
               <span className="text-sm font-semibold text-slate-300">🏆 Sua Posição: <span className="text-white">{rankingPosition}º Lugar</span></span>
             </div>
           </div>

           <div className="glass-panel rounded-2xl p-6 shadow-lg border border-white/5">
             <p className="text-sm text-slate-400">Status da Inscrição (R$ 50)</p>
             {user.paid ? (
               <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/30 px-5 py-2 text-[#22c55e] font-semibold text-sm">
                 <ShieldCheck size={16} /> Inscrição Ativa e Validada
               </div>
             ) : (
               <div className="mt-4">
                 <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/20 px-5 py-2 text-red-400 font-semibold text-sm">
                   Aguardando Pagamento Pix
                 </div>
                 <p className="mt-4 text-xs text-slate-400 leading-relaxed">
                   Seus palpites ficarão salvos, mas não contarão pontos oficiais no ranking até que o organizador confirme o recebimento do seu Pix.
                 </p>
               </div>
             )}
           </div>
        </section>

        {/* Matches */}
        <section className="glass-panel rounded-2xl p-6 mt-2 border border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><CalendarClock size={20} className="text-[#d6a129]" /> Próximos Jogos</h2>
            <span className="text-xs text-slate-500 uppercase tracking-widest hidden sm:inline-block">Preencha com antecedência</span>
          </div>
          
          <div className="space-y-4">
             {matches.length === 0 ? (
               <div className="text-center py-8 text-slate-500 border border-dashed border-white/10 rounded-xl">
                 Nenhum jogo configurado no sistema ainda.
               </div>
             ) : null}
             
             {matches.map(match => (
               <div key={match.id} className="rounded-xl border border-white/5 bg-black/20 p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-black/30 transition-all">
                 <div className="flex-1">
                   <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
                     {new Date(match.date).toLocaleDateString('pt-BR')} às {new Date(match.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {match.stage}
                   </p>
                   <div className="mt-3 flex items-center gap-4 text-xl font-bold">
                      <span className="flex items-center gap-2">{match.homeTeam.flag} {match.homeTeam.name}</span>
                      <span className="text-slate-600 font-normal text-base">vs</span>
                      <span className="flex items-center gap-2">{match.awayTeam.flag} {match.awayTeam.name}</span>
                   </div>
                 </div>
                 <div className="shrink-0 flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                    <input type="number" min="0" max="20" placeholder="-" className="w-14 h-12 rounded-lg bg-[#020617] border border-white/10 text-center text-xl font-bold text-white focus:outline-none focus:border-[#d6a129] focus:ring-1 focus:ring-[#d6a129] transition-all" />
                    <span className="text-slate-500 font-medium">X</span>
                    <input type="number" min="0" max="20" placeholder="-" className="w-14 h-12 rounded-lg bg-[#020617] border border-white/10 text-center text-xl font-bold text-white focus:outline-none focus:border-[#d6a129] focus:ring-1 focus:ring-[#d6a129] transition-all" />
                    <button className="ml-2 bg-[#d6a129] text-black font-bold px-5 py-3 rounded-lg tap-feedback hover:brightness-110 transition-all shadow-md">
                      Salvar
                    </button>
                 </div>
               </div>
             ))}
          </div>
        </section>

      </div>
    </main>
  );
}
