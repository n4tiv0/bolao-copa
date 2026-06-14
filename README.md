# Bolao da Copa do Mundo

Aplicativo web responsivo para administrar um bolao da Copa do Mundo com Next.js App Router, TypeScript, TailwindCSS, Prisma e PostgreSQL.

## Portas locais

- App Next.js: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

## Credenciais seed

- Admin: `admin@bolao.local` / `admin123`
- Usuario demo: `ana@bolao.local` / `bolao123`
- Usuario pendente Pix: `carla@bolao.local` / `bolao123`

## Rodar localmente

```bash
cp .env.example .env
npm install
npx prisma db push
npm run prisma:seed
npm run dev
```

## Rodar com Docker

```bash
docker compose up --build
```

O container do app executa `prisma db push` e o seed antes de iniciar o servidor.

## Regras implementadas

- Inscricao fixa de R$ 50 por participante, com `paid` e status de Pix.
- Palpites bloqueados no backend exatamente 1 hora antes do horario oficial do jogo.
- Pontuacao: 5 pontos por placar exato, 3 por vencedor mais saldo, 1 por vencedor/empate.
- Peso 2x obrigatorio para jogos do Brasil.
- Premiacao: pote de campeao e ranking Top 3; se ninguem acertar o campeao, o pote acumula no ranking.
- Buy-back de campeao por R$ 50 ate as quartas quando a selecao escolhida for eliminada.
- Bloqueio permanente de troca a partir das semifinais.
- Sync de jogos por API-Football via env, com fallback mock local para desenvolvimento.
- Maquina de eliminacao em mata-mata marca selecoes eliminadas e habilita repescagem.

## Comandos uteis

```bash
npm test
npm run lint
npm run build
npm run db:push
```
