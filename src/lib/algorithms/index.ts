// ============================================
// ALGORITHMS - Central Export
// ============================================
// 
// CONSTITUIÇÃO SYNAPSE Ω v10.x
// Lei I: Performance | Lei IV: Aprendizado Ótimo
//
// Algoritmos de aprendizado centralizados
//
// @module lib/algorithms
// ============================================

// FSRS Algorithm (Flashcards)
export {
  type Rating,
  type FlashcardState,
  type FSRSResult,
  FSRS_PARAMS,
  calculateNextInterval,
  calculateNextState,
  calculateRetrievability,
  estimateXP,
  isCorrect
} from './fsrs';

// Study Priority Algorithm (Cronograma)
export {
  type AreaPerformance,
  type BlockType,
  type PriorityLevel,
  type StudyBlock,
  calculatePriority,
  determineActivityType,
  determinePriorityLevel,
  estimateBlockXP,
  generateSchedule,
  calculateScheduleStats
} from './studyPriority';
