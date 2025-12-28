// ============================================
// STUDY PRIORITY ALGORITHM - Cronograma Adaptativo
// ============================================
// 
// CONSTITUIÇÃO SYNAPSE Ω v10.x
// Lei I: Performance | Lei IV: Aprendizado Ótimo
//
// Algoritmo de priorização extraído do AdaptiveScheduler.tsx
// Baseado em neurociência do aprendizado
//
// @module lib/algorithms/studyPriority
// ============================================

export interface AreaPerformance {
  areaId: string;
  areaName: string;
  accuracy: number; // 0-100
  lastStudied: Date;
  pendingReviews: number;
  weight: number; // Peso no ENEM
}

export type BlockType = 'aula' | 'revisao' | 'questoes' | 'flashcard' | 'pausa';
export type PriorityLevel = 'critica' | 'alta' | 'media' | 'baixa';

export interface StudyBlock {
  id: string;
  tipo: BlockType;
  titulo: string;
  area?: string;
  duracao: number; // minutos
  prioridade: PriorityLevel;
  xpEstimado: number;
  concluido: boolean;
  motivo?: string; // Por que essa atividade foi escolhida
}

// ============================================
// CÁLCULOS DE PRIORIDADE
// ============================================

/**
 * Calcula a prioridade de estudo de uma área
 * 
 * Fatores considerados:
 * 1. Curva de esquecimento (quando foi estudado por último)
 * 2. Taxa de acerto (áreas fracas primeiro)
 * 3. Peso no ENEM
 * 4. Revisões pendentes
 * 
 * @param area - Performance da área
 * @returns Score de prioridade (maior = mais urgente)
 * 
 * @example
 * const priority = calculatePriority(mathArea);
 * // priority = 15.5 (alta prioridade)
 */
export function calculatePriority(area: AreaPerformance): number {
  const daysSinceStudy = Math.floor(
    (Date.now() - area.lastStudied.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Fator de esquecimento (exponencial baseado em Ebbinghaus)
  const forgettingFactor = Math.min(10, Math.pow(1.5, daysSinceStudy / 3));
  
  // Fator de dificuldade (inversamente proporcional à accuracy)
  const difficultyFactor = (100 - area.accuracy) / 20;
  
  // Fator de peso no ENEM
  const weightFactor = area.weight * 2;
  
  // Fator de revisões pendentes
  const reviewFactor = Math.min(5, area.pendingReviews);
  
  return forgettingFactor + difficultyFactor + weightFactor + reviewFactor;
}

/**
 * Determina o tipo de atividade recomendado baseado na performance
 * 
 * @param area - Performance da área
 * @returns Tipo de bloco e motivo
 */
export function determineActivityType(area: AreaPerformance): {
  tipo: BlockType;
  titulo: string;
  motivo: string;
} {
  if (area.accuracy < 60) {
    return {
      tipo: 'aula',
      titulo: `Revisão: ${area.areaName}`,
      motivo: `Taxa de acerto em ${area.accuracy}%. Precisa reforçar os conceitos base.`
    };
  }
  
  if (area.pendingReviews > 0) {
    return {
      tipo: 'flashcard',
      titulo: `Flashcards: ${area.areaName}`,
      motivo: `${area.pendingReviews} cards para revisar. Memória de longo prazo!`
    };
  }
  
  return {
    tipo: 'questoes',
    titulo: `Questões: ${area.areaName}`,
    motivo: `Acerto em ${area.accuracy}%. Hora de praticar para subir!`
  };
}

/**
 * Determina o nível de prioridade visual
 * 
 * @param area - Performance da área
 * @returns Nível de prioridade para UI
 */
export function determinePriorityLevel(area: AreaPerformance): PriorityLevel {
  const priorityScore = calculatePriority(area);
  
  if (priorityScore > 15) return 'critica';
  if (priorityScore > 10) return 'alta';
  if (priorityScore > 5) return 'media';
  return 'baixa';
}

/**
 * Estima XP para uma atividade baseado na área
 * 
 * @param area - Performance da área
 * @param duration - Duração em minutos
 * @returns XP estimado
 */
export function estimateBlockXP(area: AreaPerformance, duration: number): number {
  const baseXP = Math.floor(duration * 5);
  const difficultyBonus = Math.floor((100 - area.accuracy) / 10);
  return baseXP + difficultyBonus;
}

// ============================================
// GERAÇÃO DE CRONOGRAMA
// ============================================

/**
 * Gera um cronograma de estudo otimizado
 * 
 * @param minutes - Tempo disponível em minutos
 * @param areas - Array de áreas com performance
 * @param includeBreaks - Incluir pausas (default: true)
 * @returns Array de blocos de estudo ordenados por prioridade
 * 
 * @example
 * const schedule = generateSchedule(60, myAreas);
 * // schedule = [{ tipo: 'revisao', ... }, { tipo: 'questoes', ... }]
 */
export function generateSchedule(
  minutes: number, 
  areas: AreaPerformance[],
  includeBreaks: boolean = true
): StudyBlock[] {
  const blocks: StudyBlock[] = [];
  let remainingTime = minutes;
  
  // Ordenar áreas por prioridade
  const sortedAreas = [...areas].sort((a, b) => 
    calculatePriority(b) - calculatePriority(a)
  );
  
  // Bloco 1: Revisão de erros (sempre prioridade máxima)
  const totalPendingReviews = areas.reduce((sum, a) => sum + a.pendingReviews, 0);
  if (totalPendingReviews > 0 && remainingTime >= 15) {
    const duration = Math.min(20, remainingTime * 0.2);
    blocks.push({
      id: 'revisao-erros',
      tipo: 'revisao',
      titulo: 'Revisão de Erros',
      duracao: duration,
      prioridade: 'critica',
      xpEstimado: totalPendingReviews * 15,
      concluido: false,
      motivo: `${totalPendingReviews} questões erradas aguardando. Revisão de erros é 3x mais eficiente!`
    });
    remainingTime -= duration;
  }

  // Blocos 2-4: Áreas prioritárias
  let blockIndex = 0;
  for (const area of sortedAreas.slice(0, 3)) {
    if (remainingTime < 15) break;
    
    const { tipo, titulo, motivo } = determineActivityType(area);
    
    // Calcular duração baseada no tempo disponível
    const blockDuration = Math.min(25, Math.max(15, Math.floor(remainingTime * 0.35)));
    
    blocks.push({
      id: `block-${blockIndex}`,
      tipo,
      titulo,
      area: area.areaId,
      duracao: blockDuration,
      prioridade: determinePriorityLevel(area),
      xpEstimado: estimateBlockXP(area, blockDuration),
      concluido: false,
      motivo
    });
    
    remainingTime -= blockDuration;
    blockIndex++;
    
    // Adicionar pausa Pomodoro
    if (includeBreaks && blocks.length > 0 && blocks.length % 2 === 0 && remainingTime >= 10) {
      blocks.push({
        id: `pausa-${blockIndex}`,
        tipo: 'pausa',
        titulo: 'Pausa Pomodoro',
        duracao: 5,
        prioridade: 'baixa',
        xpEstimado: 0,
        concluido: false,
        motivo: 'Pausas curtas aumentam retenção em 40%. Descanse o cérebro!'
      });
      remainingTime -= 5;
    }
  }

  return blocks;
}

/**
 * Calcula estatísticas do cronograma gerado
 * 
 * @param blocks - Array de blocos de estudo
 * @returns Estatísticas totais
 */
export function calculateScheduleStats(blocks: StudyBlock[]): {
  totalDuration: number;
  totalXP: number;
  blockCount: number;
  criticalCount: number;
} {
  return {
    totalDuration: blocks.reduce((sum, b) => sum + b.duracao, 0),
    totalXP: blocks.reduce((sum, b) => sum + b.xpEstimado, 0),
    blockCount: blocks.filter(b => b.tipo !== 'pausa').length,
    criticalCount: blocks.filter(b => b.prioridade === 'critica').length
  };
}
