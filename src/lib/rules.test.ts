import { describe, it, expect } from 'vitest';
import {
  calculatePoints,
  isMatchLocked,
  isBuybackStageAllowed,
  canBuybackByDate,
  distributePrizes,
} from './rules';

describe('Motor de Regras - Pontuação', () => {
  it('deve dar 5 pontos para placar exato', () => {
    // Jogo comum
    expect(calculatePoints(2, 1, 2, 1, false)).toBe(5);
    expect(calculatePoints(0, 0, 0, 0, false)).toBe(5);
  });

  it('deve dar 3 pontos para vencedor e saldo correto, mas placar diferente', () => {
    // Aposta 2-1 (+1), Jogo 3-2 (+1) -> Vencedor Home e diferença +1
    expect(calculatePoints(2, 1, 3, 2, false)).toBe(3);
    // Aposta 1-1 (0), Jogo 2-2 (0) -> Empate e diferença 0
    expect(calculatePoints(1, 1, 2, 2, false)).toBe(3);
  });

  it('deve dar 1 ponto para vencedor correto com saldo diferente', () => {
    // Aposta 2-1 (+1), Jogo 2-0 (+2) -> Vencedor Home, mas saldo diferente
    expect(calculatePoints(2, 1, 2, 0, false)).toBe(1);
    // Aposta 3-0 (+3), Jogo 1-0 (+1) -> Vencedor Home, mas saldo diferente
    expect(calculatePoints(3, 0, 1, 0, false)).toBe(1);
  });

  it('deve dar 0 pontos para vencedor errado', () => {
    // Aposta 2-1 (Home), Jogo 1-2 (Away)
    expect(calculatePoints(2, 1, 1, 2, false)).toBe(0);
    // Aposta 1-1 (Draw), Jogo 2-1 (Home)
    expect(calculatePoints(1, 1, 2, 1, false)).toBe(0);
  });

  it('deve aplicar multiplicador de 2x para jogos do Brasil', () => {
    // Placar exato no jogo do Brasil: 5 * 2 = 10 pts
    expect(calculatePoints(2, 0, 2, 0, true)).toBe(10);
    // Saldo no jogo do Brasil: 3 * 2 = 6 pts
    expect(calculatePoints(2, 1, 3, 2, true)).toBe(6);
    // Apenas vencedor no jogo do Brasil: 1 * 2 = 2 pts
    expect(calculatePoints(2, 1, 2, 0, true)).toBe(2);
    // Erro no jogo do Brasil: 0 pts
    expect(calculatePoints(1, 0, 0, 1, true)).toBe(0);
  });
});

describe('Motor de Regras - Bloqueio de Apostas', () => {
  it('deve bloquear aposta se faltar 1 hora ou menos para o início', () => {
    const kickoff = new Date('2026-06-20T15:00:00Z');
    
    // 59 minutos antes
    const now1 = new Date('2026-06-20T14:01:00Z');
    expect(isMatchLocked(kickoff, now1)).toBe(true);

    // Na hora exata do jogo
    const now2 = new Date('2026-06-20T15:00:00Z');
    expect(isMatchLocked(kickoff, now2)).toBe(true);

    // 1 hora antes (limite)
    const now3 = new Date('2026-06-20T14:00:00Z');
    expect(isMatchLocked(kickoff, now3)).toBe(true);
  });

  it('deve permitir aposta se faltar mais de 1 hora para o início', () => {
    const kickoff = new Date('2026-06-20T15:00:00Z');
    
    // 61 minutos antes
    const now = new Date('2026-06-20T13:59:00Z');
    expect(isMatchLocked(kickoff, now)).toBe(false);
  });
});

describe('Motor de Regras - Buy-back de Campeão', () => {
  it('deve permitir recompra nas fases elegíveis', () => {
    expect(isBuybackStageAllowed('GROUP')).toBe(true);
    expect(isBuybackStageAllowed('ROUND_OF_16')).toBe(true);
    expect(isBuybackStageAllowed('QUARTER_FINALS')).toBe(true);
  });

  it('deve bloquear recompra a partir das semifinais', () => {
    expect(isBuybackStageAllowed('SEMI_FINALS')).toBe(false);
    expect(isBuybackStageAllowed('THIRD_PLACE')).toBe(false);
    expect(isBuybackStageAllowed('FINAL')).toBe(false);
  });

  it('deve validar permissão de recompra por data do primeiro jogo de semifinal', () => {
    const semiKickoff = new Date('2026-07-10T20:00:00Z');

    // Mais de 1h antes da semifinal -> Permitido
    const nowAllowed = new Date('2026-07-10T18:59:00Z');
    expect(canBuybackByDate(semiKickoff, nowAllowed)).toBe(true);

    // Menos de 1h antes da semifinal -> Bloqueado
    const nowBlocked = new Date('2026-07-10T19:01:00Z');
    expect(canBuybackByDate(semiKickoff, nowBlocked)).toBe(false);
  });
});

describe('Motor de Regras - Distribuição de Prêmios', () => {
  it('deve calcular corretamente a divisão dos potes e ranking', () => {
    // 10 participantes pagos (Total R$ 500)
    // 1 pessoa acertou o campeão
    const res = distributePrizes(10, 1);
    expect(res.totalPot).toBe(500);
    expect(res.championPot).toBe(150); // 30%
    expect(res.rankingPot).toBe(350); // 70%
    expect(res.championPrizePerUser).toBe(150);
    expect(res.firstPrize).toBe(175); // 50% de 350
    expect(res.secondPrize).toBe(105); // 30% de 350
    expect(res.thirdPrize).toBe(70); // 20% de 350
  });

  it('deve acumular o pote de campeão no ranking se ninguém acertar o campeão', () => {
    // 10 participantes pagos (Total R$ 500)
    // 0 pessoas acertaram o campeão
    const res = distributePrizes(10, 0);
    expect(res.totalPot).toBe(500);
    expect(res.championPot).toBe(0); // Acumulou
    expect(res.rankingPot).toBe(500); // 100%
    expect(res.championPrizePerUser).toBe(0);
    expect(res.firstPrize).toBe(250); // 50% de 500
    expect(res.secondPrize).toBe(150); // 30% de 500
    expect(res.thirdPrize).toBe(100); // 20% de 500
  });
});
