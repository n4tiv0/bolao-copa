# 🏆 O Maior Bolão do Mundo

Bem-vindo ao **Bolão da Copa**, um sistema escalável, completo e premium desenvolvido em Next.js para gerenciamento de bolões privados e globais de campeonatos de futebol. 

Este documento serve como manual de uso para o Usuário Final e para o Administrador do Sistema. Se você é um programador, leia o arquivo `DEVELOPER_MANUAL.md`.

---

## 👩‍💻 Testando Localmente

Para rodar este aplicativo no seu próprio computador e testar suas funcionalidades:

1. Abra o terminal na raiz do projeto (`bolao-copa`).
2. Garanta que você possua o arquivo `.env` configurado com suas chaves de banco de dados (Supabase) e Google (Auth).
3. Execute o comando:
   ```bash
   npm run dev
   ```
4. O Next.js iniciará a interface na porta padrão (normalmente `http://localhost:3000`). Acesse pelo seu navegador.

---

## ⚽ Manual do Usuário Final

A experiência do usuário foi projetada para ser simples e engajadora:

1. **Autenticação Simples:** Na tela inicial, clique no botão vermelho **"ENTRAR COM GOOGLE"**. Você fará login instantâneo e seguro sem precisar criar uma senha.
2. **Dashboard Global:** Ao logar, a tela inicial exibirá estatísticas em tempo real (Total de Usuários, Palpites e Bolões rolando no sistema).
3. **Criando um Bolão Privado:** Se você quer jogar só com seus amigos ou família, digite um nome na tela inicial e clique em **"CRIAR MEU BOLÃO"**. Você receberá um **Código de 6 dígitos**.
4. **Entrando em um Bolão:** Tem o código de um amigo? Vá na seção de Bolões, clique em "Buscar por código" e digite-o.
5. **Dando Palpites:** Na página de Palpites (Guesses), você verá os jogos futuros. Basta colocar o placar e salvar! Você não pode mudar o palpite depois que o jogo começa.
6. **IA Mágica (Insights):** Com dúvidas? Um botão mágico ("Ver Dica da Inteligência Artificial") avalia o histórico das equipes (via Google Gemini) e te dá a melhor sugestão matemática de placar.

---

## 👑 Manual do Administrador

Para gerenciar o aplicativo em Produção (Vercel):

1. **Acessando o Painel Admin:** Logue com a sua conta Google registrada como Administradora e acesse a URL secreta `/admin`.
2. **Sincronização Automática (Webhooks/Cron):** 
   - A plataforma foi desenhada para buscar os placares reais das partidas automaticamente todos os dias. 
   - No painel Admin, há um botão de **"Sincronizar Agora"** para forçar a coleta de dados e atualizar imediatamente as pontuações e o ranking de todos os usuários.
3. **Validação de PIX:**
   - Usuários do bolão Global (Premiação Ouro) precisam pagar a cota via Pix para ter os palpites computados. O painel exibirá os recibos enviados para o Admin checar na conta e liberar o jogador.

---

## 🚀 Publicando na Vercel (Passo a Passo Ouro)

Este repositório foi construído já como um Monolito Next.js para ter compatibilidade impecável com a Vercel.

1. Faça o commit e push do seu código para o GitHub:
   ```bash
   git add .
   git commit -m "feat: lancamento oficial do bolao monolito"
   git push origin main
   ```
2. Acesse `vercel.com` e clique em **Add New > Project**.
3. Selecione este repositório do GitHub.
4. Na aba de **Environment Variables** (Variáveis de Ambiente), você **precisa colar** todas as suas chaves críticas antes do primeiro deploy:
   - `DATABASE_URL` (Supabase Postgres Transaction Pooler)
   - `AUTH_SECRET` (Uma chave aleatória super segura para criptografar os cookies)
   - `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET` (Do console do Google Cloud)
   - `SPORTS_API_KEY` (Sua licença do api-sports.io)
   - `GEMINI_API_KEY` (Sua chave do Google AI Studio)
   - `CRON_SECRET` (Crie uma senha forte qualquer, você usará para proteger a rota de automação).
5. Clique em **Deploy**! A Vercel vai instalar os pacotes, rodar `npx prisma generate` (que deixamos pronto no `postinstall`) e colocar no ar.
6. **Para automatizar as pontuações**, vá na Vercel, nas configurações do projeto, aba "Cron Jobs", ou adicione um `vercel.json` dizendo para bater na rota `/api/webhooks/sports-api-sync` enviando o seu `CRON_SECRET` no cabeçalho Authorization todo dia à meia-noite!
