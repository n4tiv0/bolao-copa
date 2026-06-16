import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Users, RefreshCw, HandHeart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const adminUser = await requireAdmin().catch(() => null);
  if (!adminUser) redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <main className="min-h-screen bg-[#020617] text-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between glass-panel p-6 rounded-2xl border border-white/5">
          <div>
            <p className="text-xs text-[#22c55e] uppercase tracking-widest font-bold mb-1">Acesso Restrito</p>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f7d46a] to-[#d6a129]">Painel de Administração</h1>
            <p className="text-slate-400 text-sm mt-1">Visão geral do bolão, pagamentos e status do servidor.</p>
          </div>
          <Link href="/dashboard" className="mt-4 md:mt-0 inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10">
            <ArrowLeft size={16} /> Meu Painel (Visão Normal)
          </Link>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 shadow-xl">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6"><Users size={20} className="text-[#22c55e]" /> Gestão de Participantes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-4 font-semibold uppercase text-xs tracking-wider">Usuário</th>
                    <th className="pb-4 font-semibold uppercase text-xs tracking-wider">E-mail</th>
                    <th className="pb-4 font-semibold uppercase text-xs tracking-wider">Inscrição</th>
                    <th className="pb-4 font-semibold uppercase text-xs tracking-wider text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 font-medium text-white">{u.name || 'Sem Nome'}</td>
                      <td className="py-4 text-slate-400">{u.email}</td>
                      <td className="py-4">
                        {u.paid ? (
                           <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">Validado</span>
                        ) : (
                           <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">Pix Pendente</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           {!u.paid && (
                             <button className="text-xs bg-[#d6a129] text-black font-bold px-3 py-1.5 rounded-lg transition-all hover:brightness-110">
                               Aprovar Pix
                             </button>
                           )}
                           <button className="text-xs bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1">
                             <HandHeart size={14} /> Personificar
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">Nenhum participante entrou no bolão ainda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="space-y-6">
            <section className="glass-panel p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col gap-4">
               <div className="w-12 h-12 rounded-xl bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e] mb-2">
                 <RefreshCw size={24} />
               </div>
               <div>
                 <h2 className="text-xl font-bold">Atualizar Jogos</h2>
                 <p className="text-sm text-slate-400 mt-2 leading-relaxed">Puxe os resultados e novos jogos diretamente da API-Football oficial. Isso irá computar os pontos de todo mundo automaticamente.</p>
               </div>
               <button className="mt-2 w-full rounded-xl bg-slate-800 border border-slate-700 py-3.5 text-sm font-semibold hover:bg-slate-700 hover:border-slate-600 transition-all text-white">
                 Sincronizar Agora
               </button>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
