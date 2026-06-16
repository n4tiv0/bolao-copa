# Developer Manual - Bolão da Copa (Monolito Next.js)

Este documento detalha a arquitetura técnica, como contribuir para o projeto e os fluxos de dados principais do sistema.

## Arquitetura: De Fastify + Next.js para um Monolito Next.js 15
O projeto originalmente utilizava um frontend em Next.js 13 e um backend separado em Fastify. Para otimizar o deployment na Vercel e facilitar a autenticação (NextAuth), **todo o código backend foi migrado para o Next.js via API Routes (`/src/pages/api/*`)**.
O antigo diretório `server/` foi **deletado**.
A pasta `old/` contém o código do Bolão antigo como referência histórica e para consulta de lógica legada.

### Tecnologias Core
*   **Framework:** Next.js 15 (Pages Router para UI atual, App Router liberado para novas APIs e Auth).
*   **Database ORM:** Prisma (v6).
*   **Autenticação:** NextAuth.js v5 (Google Provider via `@auth/prisma-adapter`).
*   **Banco de Dados:** Supabase PostgreSQL com Transaction Pooler (Porta 6543).
*   **Integração de IA:** Gemini API.

---

## Como Rodar Localmente

1. **Instale as dependências:**
   O projeto agora requer TypeScript v5+ e Node.js v18+.
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configure o `.env`:**
   Copie `.env.example` para `.env` (se existir) e garanta que os seguintes campos estão preenchidos:
   ```env
   # Transaction Pooler do Supabase para suportar serverless/Vercel
   DATABASE_URL="postgresql://postgres.xxx:senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   
   # NextAuth
   AUTH_SECRET="seu-segredo-aqui"
   AUTH_GOOGLE_ID="sua-client-id"
   AUTH_GOOGLE_SECRET="sua-client-secret"
   
   # APIs Externas
   SPORTS_API_KEY="api-sports-key"
   GEMINI_API_KEY="sua-gemini-key"
   CRON_SECRET="segredo-para-o-cron"
   ```

3. **Inicie o Servidor:**
   Não é mais necessário rodar o backend e o frontend separados. Um único comando inicia tudo:
   ```bash
   npm run dev
   ```

4. **Gerenciamento de Banco (Prisma):**
   Ao fazer alterações em `prisma/schema.prisma`, execute:
   ```bash
   npx prisma migrate dev --name <sua-alteracao>
   npx prisma generate
   ```

---

## Fluxos e APIs Internas

Todos os endpoints estão em `src/pages/api/` e `src/app/api/`.
Para testar chamadas via Postman, certifique-se de extrair o `__Secure-authjs.session-token` (ou testar via Browser).

*   `POST /api/polls` - Cria um bolão privado.
*   `POST /api/polls/join` - Entra em um bolão privado com um código de convite.
*   `GET /api/matches` - Retorna os jogos e o palpite atual do usuário logado.
*   `POST /api/guesses` - Salva ou atualiza um palpite (Upsert) antes da data do jogo.
*   `POST /api/webhooks/sports-api-sync` - Rota protegida por `CRON_SECRET` para puxar dados reais, atualizar placares de `Match` e engatilhar recalculo de `Prediction`s.
*   `POST /api/ai/insights` - Envia `matchId` para o Gemini devolver uma dica de palpite.

---

## Deploy Vercel (CI/CD)

O projeto está 100% otimizado para Vercel.
1. **Build Command:** `next build`
2. **Install Command:** `npm install`
3. **Environment Variables:** Lembre-se de adicionar todas as chaves de API (Auth, Supabase, Gemini, Sports) no painel da Vercel.
4. **Vercel Cron Jobs:** Adicione um arquivo `vercel.json` na raiz se quiser ativar o `/api/webhooks/sports-api-sync` automaticamente.
