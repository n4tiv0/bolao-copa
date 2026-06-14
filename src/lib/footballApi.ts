import { prisma } from './db';
import { calculatePoints, Stage } from './rules';

// Tipos da resposta da API-Football
interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string; // "NS" (Not Started), "FT" (Full Time), "PEN" (Penalties), etc.
    };
  };
  league: {
    round: string; // Ex: "Group Stage - Group A", "Round of 16", "Quarter-finals", "Semi-finals", "Final"
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score?: {
    fulltime: {
      home: number | null;
      away: number | null;
    };
    penalty?: {
      home: number | null;
      away: number | null;
    };
  };
}

/**
 * Mapeia o round da API-Football para o nosso enum de Stage
 */
function mapRoundToStage(round: string): Stage {
  const r = round.toLowerCase();
  if (r.includes('group')) return 'GROUP';
  if (r.includes('16') || r.includes('eighth')) return 'ROUND_OF_16';
  if (r.includes('quarter')) return 'QUARTER_FINALS';
  if (r.includes('semi')) return 'SEMI_FINALS';
  if (r.includes('third') || r.includes('place')) return 'THIRD_PLACE';
  if (r.includes('final')) return 'FINAL';
  return 'GROUP';
}

/**
 * Lista de jogos locais simulados para quando não houver chave de API ativa
 */
export const mockFixtures = [
  // Rodada 1 - Grupo A
  { id: 1, homeId: 'BRA', awayId: 'CRO', stage: 'GROUP' as Stage, date: new Date('2026-06-15T15:00:00Z'), isBrazil: true, homeScore: 3, awayScore: 1, status: 'FINISHED' },
  { id: 2, homeId: 'MEX', awayId: 'CMR', stage: 'GROUP' as Stage, date: new Date('2026-06-16T15:00:00Z'), isBrazil: false, homeScore: 1, awayScore: 0, status: 'FINISHED' },
  // Rodada 2 - Grupo A
  { id: 3, homeId: 'BRA', awayId: 'MEX', stage: 'GROUP' as Stage, date: new Date('2026-06-20T15:00:00Z'), isBrazil: true, homeScore: null, awayScore: null, status: 'SCHEDULED' },
  { id: 4, homeId: 'CRO', awayId: 'CMR', stage: 'GROUP' as Stage, date: new Date('2026-06-21T15:00:00Z'), isBrazil: false, homeScore: null, awayScore: null, status: 'SCHEDULED' },
  // Rodada 3 - Grupo A
  { id: 5, homeId: 'CMR', awayId: 'BRA', stage: 'GROUP' as Stage, date: new Date('2026-06-25T15:00:00Z'), isBrazil: true, homeScore: null, awayScore: null, status: 'SCHEDULED' },
  { id: 6, homeId: 'CRO', awayId: 'MEX', stage: 'GROUP' as Stage, date: new Date('2026-06-26T15:00:00Z'), isBrazil: false, homeScore: null, awayScore: null, status: 'SCHEDULED' },
  // Oitavas de final (Exemplo)
  { id: 7, homeId: 'BRA', awayId: 'ESP', stage: 'ROUND_OF_16' as Stage, date: new Date('2026-06-30T15:00:00Z'), isBrazil: true, homeScore: null, awayScore: null, status: 'SCHEDULED' },
  { id: 8, homeId: 'ARG', awayId: 'FRA', stage: 'ROUND_OF_16' as Stage, date: new Date('2026-07-01T15:00:00Z'), isBrazil: false, homeScore: null, awayScore: null, status: 'SCHEDULED' },
  // Quartas (Exemplo)
  { id: 9, homeId: 'BRA', awayId: 'ARG', stage: 'QUARTER_FINALS' as Stage, date: new Date('2026-07-05T15:00:00Z'), isBrazil: true, homeScore: null, awayScore: null, status: 'SCHEDULED' },
  { id: 10, homeId: 'GER', awayId: 'BEL', stage: 'QUARTER_FINALS' as Stage, date: new Date('2026-07-06T15:00:00Z'), isBrazil: false, homeScore: null, awayScore: null, status: 'SCHEDULED' },
  // Semis (Exemplo)
  { id: 11, homeId: 'BRA', awayId: 'GER', stage: 'SEMI_FINALS' as Stage, date: new Date('2026-07-10T15:00:00Z'), isBrazil: true, homeScore: null, awayScore: null, status: 'SCHEDULED' },
  { id: 12, homeId: 'FRA', awayId: 'BEL', stage: 'SEMI_FINALS' as Stage, date: new Date('2026-07-11T15:00:00Z'), isBrazil: false, homeScore: null, awayScore: null, status: 'SCHEDULED' },
  // Finais
  { id: 13, homeId: 'GER', awayId: 'BEL', stage: 'THIRD_PLACE' as Stage, date: new Date('2026-07-14T15:00:00Z'), isBrazil: false, homeScore: null, awayScore: null, status: 'SCHEDULED' },
  { id: 14, homeId: 'BRA', awayId: 'FRA', stage: 'FINAL' as Stage, date: new Date('2026-07-15T15:00:00Z'), isBrazil: true, homeScore: null, awayScore: null, status: 'SCHEDULED' },
];

/**
 * Função de sincronização com o banco de dados
 */
export async function syncFootballData(): Promise<{ success: boolean; count: number; source: 'API' | 'MOCK' }> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const leagueId = process.env.WORLD_CUP_LEAGUE_ID || '1'; // Default: World Cup league ID in API-Football
  const season = process.env.WORLD_CUP_SEASON || '2026';

  let data: Array<{
    id: number;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
    date: Date;
    stage: Stage;
    status: string;
    homeWinner: boolean | null;
    awayWinner: boolean | null;
  }> = [];

  let source: 'API' | 'MOCK' = 'MOCK';

  if (apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
    try {
      const response = await fetch(
        `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'v3.football.api-sports.io',
          },
          next: { revalidate: 60 }, // Cache Next.js
        }
      );

      if (response.ok) {
        const json = await response.json();
        const apiFixtures: ApiFixture[] = json.response || [];
        
        if (apiFixtures.length > 0) {
          // Precisamos dos IDs das seleções para mapear no banco
          // Exemplo simples: API-Football fornece IDs numéricos, nós podemos mapeá-los via iniciais conhecidas ou armazenar no BD
          // Para simplificar, assumimos que os nomes das seleções podem ser mapeados pelas iniciais ou mapeados estaticamente.
          // Aqui implementamos um mapeamento seguro com base nas iniciais dos times na Copa.
          data = apiFixtures.map((f) => {
            const homeCode = getTeamCodeByName(f.teams.home.name);
            const awayCode = getTeamCodeByName(f.teams.away.name);

            return {
              id: f.fixture.id,
              homeTeamId: homeCode,
              awayTeamId: awayCode,
              homeScore: f.goals.home,
              awayScore: f.goals.away,
              date: new Date(f.fixture.date),
              stage: mapRoundToStage(f.league.round),
              status: f.fixture.status.short === 'FT' || f.fixture.status.short === 'PEN' ? 'FINISHED' : 'SCHEDULED',
              homeWinner: f.teams.home.winner,
              awayWinner: f.teams.away.winner,
            };
          });
          source = 'API';
        }
      }
    } catch (error) {
      console.error('Falha ao conectar com API-Football, utilizando fallback local...', error);
    }
  }

  // Se a API não retornou nada ou falhou, usa a simulação local (Mock)
  if (data.length === 0) {
    data = mockFixtures.map((f) => ({
      id: f.id,
      homeTeamId: f.homeId,
      awayTeamId: f.awayId,
      homeScore: f.homeScore,
      awayScore: f.awayScore,
      date: f.date,
      stage: f.stage,
      status: f.status,
      homeWinner: f.homeScore !== null && f.awayScore !== null ? (f.homeScore > f.awayScore ? true : f.homeScore < f.awayScore ? false : null) : null,
      awayWinner: f.homeScore !== null && f.awayScore !== null ? (f.awayScore > f.homeScore ? true : f.awayScore < f.homeScore ? false : null) : null,
    }));
    source = 'MOCK';
  }

  // Sincroniza os registros no banco usando Prisma Transactions para atomicidade e concorrência
  let updatedCount = 0;
  
  for (const matchInfo of data) {
    // 1. Garante que os times existem no banco para evitar violação de FK
    await prisma.team.upsert({
      where: { id: matchInfo.homeTeamId },
      update: {},
      create: {
        id: matchInfo.homeTeamId,
        name: getTeamFullNameByCode(matchInfo.homeTeamId),
        flag: getTeamFlagByCode(matchInfo.homeTeamId),
      },
    });

    await prisma.team.upsert({
      where: { id: matchInfo.awayTeamId },
      update: {},
      create: {
        id: matchInfo.awayTeamId,
        name: getTeamFullNameByCode(matchInfo.awayTeamId),
        flag: getTeamFlagByCode(matchInfo.awayTeamId),
      },
    });

    // 2. Cria ou atualiza a partida
    const match = await prisma.match.upsert({
      where: { id: matchInfo.id },
      update: {
        homeScore: matchInfo.homeScore,
        awayScore: matchInfo.awayScore,
        status: matchInfo.status,
        date: matchInfo.date,
        stage: matchInfo.stage,
      },
      create: {
        id: matchInfo.id,
        homeTeamId: matchInfo.homeTeamId,
        awayTeamId: matchInfo.awayTeamId,
        homeScore: matchInfo.homeScore,
        awayScore: matchInfo.awayScore,
        date: matchInfo.date,
        stage: matchInfo.stage,
        isBrazilMatch: matchInfo.homeTeamId === 'BRA' || matchInfo.awayTeamId === 'BRA',
        status: matchInfo.status,
      },
    });

    // 3. Regra de Eliminação: Se for mata-mata e o jogo acabou, elimina o perdedor
    if (match.status === 'FINISHED' && match.stage !== 'GROUP' && match.stage !== 'THIRD_PLACE') {
      let eliminatedTeamId: string | null = null;

      if (matchInfo.homeWinner === false || (matchInfo.homeScore !== null && matchInfo.awayScore !== null && matchInfo.homeScore < matchInfo.awayScore)) {
        eliminatedTeamId = match.homeTeamId;
      } else if (matchInfo.awayWinner === false || (matchInfo.homeScore !== null && matchInfo.awayScore !== null && matchInfo.awayScore < matchInfo.homeScore)) {
        eliminatedTeamId = match.awayTeamId;
      }

      if (eliminatedTeamId) {
        await prisma.team.update({
          where: { id: eliminatedTeamId },
          data: { eliminated: true },
        });
      }
    }

    // 4. Se a partida foi finalizada, calcula e atualiza as pontuações dos palpites
    if (match.status === 'FINISHED' && match.homeScore !== null && match.awayScore !== null) {
      const predictions = await prisma.prediction.findMany({
        where: { matchId: match.id },
      });

      for (const pred of predictions) {
        const pts = calculatePoints(
          pred.homeScore,
          pred.awayScore,
          match.homeScore,
          match.awayScore,
          match.isBrazilMatch
        );

        await prisma.prediction.update({
          where: { id: pred.id },
          data: { pointsEarned: pts },
        });
      }
    }

    updatedCount++;
  }

  // 5. Recalcula os pontos acumulados de todos os usuários
  if (updatedCount > 0) {
    const users = await prisma.user.findMany();
    for (const user of users) {
      const agg = await prisma.prediction.aggregate({
        where: { userId: user.id },
        _sum: { pointsEarned: true },
      });

      const totalPoints = agg._sum.pointsEarned || 0;

      await prisma.user.update({
        where: { id: user.id },
        data: { points: totalPoints },
      });
    }
  }

  return { success: true, count: updatedCount, source };
}

/**
 * Helpers estáticos de mapeamento de seleções
 */
export function getTeamCodeByName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('brazil') || n.includes('brasil')) return 'BRA';
  if (n.includes('croatia') || n.includes('croácia')) return 'CRO';
  if (n.includes('mexico') || n.includes('méxico')) return 'MEX';
  if (n.includes('cameroon') || n.includes('camarões')) return 'CMR';
  if (n.includes('spain') || n.includes('espanha')) return 'ESP';
  if (n.includes('netherlands') || n.includes('holanda')) return 'NED';
  if (n.includes('chile')) return 'CHI';
  if (n.includes('australia') || n.includes('austrália')) return 'AUS';
  if (n.includes('argentina')) return 'ARG';
  if (n.includes('france') || n.includes('frança')) return 'FRA';
  if (n.includes('germany') || n.includes('alemanha')) return 'GER';
  if (n.includes('belgium') || n.includes('bélgica')) return 'BEL';
  
  // Default de segurança (retorna as 3 primeiras letras maiúsculas)
  return name.slice(0, 3).toUpperCase();
}

export function getTeamFullNameByCode(code: string): string {
  const codes: Record<string, string> = {
    BRA: 'Brasil',
    CRO: 'Croácia',
    MEX: 'México',
    CMR: 'Camarões',
    ESP: 'Espanha',
    NED: 'Holanda',
    CHI: 'Chile',
    AUS: 'Austrália',
    ARG: 'Argentina',
    FRA: 'França',
    GER: 'Alemanha',
    BEL: 'Bélgica',
  };
  return codes[code] || code;
}

export function getTeamFlagByCode(code: string): string {
  const flags: Record<string, string> = {
    BRA: '🇧🇷',
    CRO: '🇭🇷',
    MEX: '🇲🇽',
    CMR: '🇨🇲',
    ESP: '🇪🇸',
    NED: '🇳🇱',
    CHI: '🇨🇱',
    AUS: '🇦🇺',
    ARG: '🇦🇷',
    FRA: '🇫🇷',
    GER: '🇩🇪',
    BEL: '🇧🇪',
  };
  return flags[code] || '🏳️';
}
