// ============================================
// FSRS ALGORITHM - Free Spaced Repetition Scheduler
// ============================================
// 
// CONSTITUIÇÃO SYNAPSE Ω v10.x
// Lei I: Performance | Lei IV: Aprendizado Ótimo
//
// Algoritmo FSRS v5 extraído para reutilização
// Antes: Lógica duplicada em SmartFlashcardSystem.tsx
// Depois: Módulo centralizado importável
//
// @module lib/algorithms/fsrs
// ============================================

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface FlashcardState {
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
  lastReview?: Date;
  dueDate?: Date;
}

export interface FSRSResult {
  interval: number;
  stability: number;
  difficulty: number;
  newState: FlashcardState['state'];
  dueDate: Date;
}

// FSRS Parameters (Free Spaced Repetition Scheduler)
// Baseados em pesquisa científica de retenção ótima
export const FSRS_PARAMS = {
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
  requestRetention: 0.9,
  maximumInterval: 36500,
  initialStability: [0.4, 0.6, 2.4, 5.8], // Again, Hard, Good, Easy
} as const;

const RATING_MAP: Record<Rating, number> = { 
  again: 1, 
  hard: 2, 
  good: 3, 
  easy: 4 
};

/**
 * Calcula o próximo intervalo de revisão baseado no algoritmo FSRS v5
 * 
 * @param card - Estado atual do flashcard
 * @param rating - Classificação do usuário (again/hard/good/easy)
 * @returns Novo intervalo, estabilidade e dificuldade
 * 
 * @example
 * const result = calculateNextInterval(card, 'good');
 * // result.interval = 7 (dias)
 * // result.stability = 2.4
 * // result.difficulty = 5.0
 */
export function calculateNextInterval(
  card: FlashcardState, 
  rating: Rating
): { interval: number; stability: number; difficulty: number } {
  const grade = RATING_MAP[rating];
  
  let newStability = card.stability;
  let newDifficulty = card.difficulty;
  
  if (card.state === 'new') {
    // Card novo: usar estabilidade inicial baseada no rating
    newStability = FSRS_PARAMS.initialStability[grade - 1];
    newDifficulty = Math.min(10, Math.max(1, 5 - (grade - 3)));
  } else {
    // Card existente: aplicar fórmula FSRS
    const retrievability = Math.exp(-card.elapsedDays / card.stability);
    const stabilityFactor = Math.exp(FSRS_PARAMS.w[8]) * 
      (11 - newDifficulty) * 
      Math.pow(card.stability, -FSRS_PARAMS.w[9]) * 
      (Math.exp(FSRS_PARAMS.w[10] * (1 - retrievability)) - 1);
    
    if (rating === 'again') {
      // Lapso: reduzir estabilidade
      newStability = Math.min(
        card.stability, 
        FSRS_PARAMS.w[11] * 
        Math.pow(newDifficulty, -FSRS_PARAMS.w[12]) * 
        (Math.pow(card.stability + 1, FSRS_PARAMS.w[13]) - 1)
      );
    } else {
      // Sucesso: aumentar estabilidade
      const hardPenalty = rating === 'hard' ? FSRS_PARAMS.w[15] : 1;
      const easyBonus = rating === 'easy' ? FSRS_PARAMS.w[16] : 1;
      newStability = card.stability * (1 + stabilityFactor * hardPenalty * easyBonus);
    }
    
    // Atualizar dificuldade
    const difficultyDelta = FSRS_PARAMS.w[6] * (grade - 3);
    newDifficulty = Math.min(10, Math.max(1, newDifficulty - difficultyDelta));
  }
  
  // Calcular intervalo
  const desiredRetention = FSRS_PARAMS.requestRetention;
  let interval = Math.round(newStability * Math.log(desiredRetention) / Math.log(0.9));
  interval = Math.min(FSRS_PARAMS.maximumInterval, Math.max(1, interval));
  
  return { interval, stability: newStability, difficulty: newDifficulty };
}

/**
 * Calcula o próximo estado completo do flashcard
 * 
 * @param card - Estado atual do flashcard
 * @param rating - Classificação do usuário
 * @returns Estado completo atualizado
 */
export function calculateNextState(
  card: FlashcardState, 
  rating: Rating
): FSRSResult {
  const { interval, stability, difficulty } = calculateNextInterval(card, rating);
  
  // Determinar novo estado
  let newState: FlashcardState['state'];
  if (rating === 'again') {
    newState = card.state === 'new' ? 'learning' : 'relearning';
  } else if (card.state === 'new' || card.state === 'learning') {
    newState = rating === 'easy' ? 'review' : 'learning';
  } else {
    newState = 'review';
  }
  
  // Calcular data de vencimento
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);
  
  return {
    interval,
    stability,
    difficulty,
    newState,
    dueDate
  };
}

/**
 * Calcula a probabilidade de retenção atual de um card
 * 
 * @param stability - Estabilidade do card
 * @param elapsedDays - Dias desde última revisão
 * @returns Probabilidade de retenção (0-1)
 */
export function calculateRetrievability(stability: number, elapsedDays: number): number {
  return Math.exp(-elapsedDays / stability);
}

/**
 * Estima o XP ganho baseado no rating
 * 
 * @param rating - Classificação do usuário
 * @returns XP estimado
 */
export function estimateXP(rating: Rating): number {
  const xpMap: Record<Rating, number> = {
    again: 5,
    hard: 10,
    good: 15,
    easy: 25
  };
  return xpMap[rating];
}

/**
 * Determina se o rating indica resposta correta
 * 
 * @param rating - Classificação do usuário
 * @returns true se good ou easy
 */
export function isCorrect(rating: Rating): boolean {
  return rating === 'good' || rating === 'easy';
}
