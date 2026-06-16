import { useState } from "react";
import { useSession } from "next-auth/react";
import { Layout } from "../components/Layout";
import Head from "next/head";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  if (status === "loading") return <p className="text-white text-center mt-10">Carregando...</p>;

  // Apenas role ADMIN pode acessar (Role não está exposta no tipo padrão do NextAuth session, 
  // mas assumimos que seja o email do admin ou uma validação de backend)
  if (!session || session.user?.email !== "admin@seu-dominio.com") {
    return (
      <Layout title="Acesso Negado">
        <h1 className="text-white text-center text-2xl mt-10">Acesso Restrito ao Administrador</h1>
      </Layout>
    );
  }

  async function handleSyncMatches() {
    setLoading(true);
    try {
      // Endpoint que seria chamado pelo Cron, agora disparado manualmente
      const res = await fetch("/api/webhooks/sports-api-sync", { method: "POST" });
      if (res.ok) toast.success("Jogos sincronizados com sucesso!");
      else toast.error("Falha ao sincronizar jogos.");
    } catch {
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Painel Admin | Bolão Copa">
      <div className="flex flex-col items-center justify-center mt-10 max-w-4xl mx-auto px-4">
        <h1 className="text-white text-3xl font-bold mb-8">Painel Administrativo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="bg-gray-800 p-6 rounded border-t-4 border-yellow-500">
            <h2 className="text-xl font-bold text-white mb-4">Sincronização de Jogos</h2>
            <p className="text-gray-300 text-sm mb-4">
              Busca dados na API Sports (api-football) e atualiza os placares e pontuações do Bolão.
            </p>
            <button
              onClick={handleSyncMatches}
              disabled={loading}
              className="bg-yellow-500 text-gray-900 px-4 py-2 rounded font-bold hover:bg-yellow-600 transition disabled:opacity-50"
            >
              {loading ? "Sincronizando..." : "Sincronizar Agora"}
            </button>
          </div>

          <div className="bg-gray-800 p-6 rounded border-t-4 border-green-500">
            <h2 className="text-xl font-bold text-white mb-4">Validação de PIX</h2>
            <p className="text-gray-300 text-sm mb-4">
              Aprove os pagamentos dos usuários para que eles entrem no ranking global.
            </p>
            <button className="bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600 transition">
              Ver Pagamentos Pendentes
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
