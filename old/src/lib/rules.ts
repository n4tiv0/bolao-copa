/**
 * Regras de Negócio do Bolão da Copa
 */

// Estágios da Copa do Mundo
export type Stage =
  | 'GROUP'
  | 'ROUND_OF_16'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'THIRD_PLACE'
  | 'FINAL';

/**
 * 6. Motor de Regras:
 * - 5 pts: placar exato (ex: apostou 2x1, jogo foi 2x1)
 * - 3 pts: vencedor + saldo de gols (ex: apostou 2x1, jogo foi 3x2 ou apostou 1x1 e foi 2x2)
 * - 1 pt: apenas vencedor ou empate sem acertar saldo (ex: apostou 2x1, jogo foi 1x0 ou apostou 0x0 e foi 1x1)
 * - 0 pts: errou o resultado
 * - Multiplicador de 2x obrigatório para todos os jogos do Brasil.
 */
export function calculatePoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
  isBrazilMatch: boolean
): number {
  let points = 0;

  const predDiff = predHome - predAway;
  const actualDiff = actualHome - actualAway;

  const predOutcome = Math.sign(predDiff); // 1: Home wins, -1: Away wins, 0: Draw
  const actualOutcome = Math.sign(actualDiff);

  if (predHome === actualHome && predAway === actualAway) {
    // Placar exato
    points = 5;
  } else if (predOutcome === actualOutcome && predDiff === actualDiff) {
    // Vencedor e diferença de gols (ex: 2-1 e 3-2; ou empate diferente ex: 1-1 e 2-2)
    points = 3;
  } else if (predOutcome === actualOutcome) {
    // Apenas acertou o vencedor ou empate, mas errou o saldo/gols
    points = 1;
  } else {
    points = 0;
  }

  // Multiplicador do Brasil
  if (isBrazilMatch) {
    points *= 2;
  }

  return points;
}

/**
 * 2. Bloqueio de apostas:
 * Bloqueia exatamente 1 hora antes do início do jogo.
 */
export function isMatchLocked(kickoffTime: Date, now: Date = new Date()): boolean {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  return kickoffTime.getTime() - now.getTime() <= ONE_HOUR_MS;
}

/**
 * 4. Regras do Buy-back de Campeão:
 * - Permitido até as quartas de final.
 * - Bloqueado permanentemente a partir do início das semifinais.
 * - Ocorre quando o campeão selecionado foi eliminado.
 */
export function isBuybackStageAllowed(currentStage: Stage): boolean {
  const lockedStages: Stage[] = ['SEMI_FINALS', 'THIRD_PLACE', 'FINAL'];
  return !lockedStages.includes(currentStage);
}

/**
 * Verifica se a recompra de campeão pode ser realizada com base na data do primeiro jogo da semifinal.
 * Bloqueia se o primeiro jogo da semifinal estiver a menos de 1 hora de começar (ou já começou).
 */
export function canBuybackByDate(
  firstSemiKickoff: Date | null,
  now: Date = new Date()
): boolean {
  if (!firstSemiKickoff) {
    return true; // Se não houver data de semifinal cadastrada ainda, assume permitido
  }
  const ONE_HOUR_MS = 60 * 60 * 1000;
  return firstSemiKickoff.getTime() - now.getTime() > ONE_HOUR_MS;
}

/**
 * 3. Prêmios:
 * - Prêmio de Campeão (chute do campeão correto)
 * - Prêmio de Ranking (top 3 por pontos)
 * - Se ninguém acertar o campeão, o prêmio de campeão acumula no prêmio do ranking.
 *
 * Taxa de inscrição: R$ 50 por participante.
 * Exemplo de cálculo de divisão de prêmios:
 * - Arrecadação total = total de usuários pagos * 50
 * - Digamos que 30% vai para o campeão (R$ 15 por usuário) e 70% vai para o ranking (R$ 35 por usuário)
 * - Distribuição do ranking (Top 3): 1º lugar (50%), 2º lugar (30%), 3º lugar (20%)
 */
export function distributePrizes(
  totalParticipantsPaid: number,
  correctChampionCount: number
) {
  const FEE = 50.0;
  const totalPot = totalParticipantsPaid * FEE;

  // Divisão: 30% Campeão, 70% Ranking
  let championPot = totalPot * 0.3;
  let rankingPot = totalPot * 0.7;

  if (correctChampionCount === 0) {
    // Acumula
    rankingPot += championPot;
    championPot = 0;
  }

  // Divisão do Top 3
  const firstPrize = rankingPot * 0.5;
  const secondPrize = rankingPot * 0.3;
  const thirdPrize = rankingPot * 0.2;

  const championPrizePerUser = correctChampionCount > 0 ? championPot / correctChampionCount : 0;

  return {
    totalPot,
    championPot,
    rankingPot,
    firstPrize,
    secondPrize,
    thirdPrize,
    championPrizePerUser,
  };
}
