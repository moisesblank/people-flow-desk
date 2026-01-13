// ============================================
// TIPOS UNIFICADOS DE FLASHCARDS & MAPAS MENTAIS
// Consolidação: lms.ts + useFlashcards.ts + tabs
// DOGMA I: Evolução Perpétua | PATCH-ONLY
// ============================================

// ============================================
// 1. FLASHCARD - TIPO PRINCIPAL (FSRS v5)
// ============================================

/**
 * Estado do flashcard no algoritmo FSRS
 */
export type FlashcardState = 'new' | 'learning' | 'review' | 'relearning';

/**
 * Dificuldade simplificada (para UI)
 */
export type FlashcardDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Rating do usuário após revisão (FSRS v5)
 * 1 = Again (Esqueci)
 * 2 = Hard (Difícil)
 * 3 = Good (Bom)
 * 4 = Easy (Fácil)
 */
export type FlashcardRating = 1 | 2 | 3 | 4;

/**
 * Flashcard completo com campos FSRS v5
 * Alinhado com tabela: public.study_flashcards
 */
export interface Flashcard {
  id: string;
  user_id: string;
  area_id: string | null;
  lesson_id?: string | null;
  
  // Conteúdo
  question: string;
  answer: string;
  
  // Imagens (v1.0 - Suporte a mídia)
  question_image_url?: string | null;
  answer_image_url?: string | null;
  // JSONB do Supabase retorna como unknown, não string[]
  question_image_urls?: unknown;
  answer_image_urls?: unknown;
  
  // FSRS v5 - Algoritmo de repetição espaçada
  due_date: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: FlashcardState;
  last_review: string | null;
  
  // Metadados
  source?: string | null;
  tags?: string[] | null;
  created_at: string;
}

/**
 * Flashcard simplificado para exibição em abas/widgets
 * Usado em: FlashcardsTab, QuizTab, etc.
 */
export interface FlashcardSimple {
  id: string;
  front: string;
  back: string;
  difficulty: FlashcardDifficulty;
  lessonId?: string;
}

/**
 * Dados para criar um novo flashcard
 */
export interface CreateFlashcardInput {
  question: string;
  answer: string;
  areaId?: string;
  lessonId?: string;
  source?: string;
  tags?: string[];
  // Imagens (v1.0)
  question_image_url?: string;
  answer_image_url?: string;
}

/**
 * Dados para reagendar flashcard após revisão
 */
export interface RescheduleFlashcardInput {
  flashcardId: string;
  rating: FlashcardRating;
  currentStability: number;
  currentDifficulty: number;
}

/**
 * Resultado do reagendamento
 */
export interface RescheduleFlashcardResult {
  interval: number;
  newState: FlashcardState;
  newStability: number;
  newDifficulty: number;
}

/**
 * Estatísticas de flashcards do usuário
 */
export interface FlashcardStats {
  total: number;
  due: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  totalReps: number;
  totalLapses: number;
  recentReviews: number;
  retention: number;
}

// ============================================
// 2. MAPA MENTAL - TIPOS
// ============================================

/**
 * Tipo de nó no mapa mental
 */
export type MindmapNodeType = 'root' | 'branch' | 'leaf';

/**
 * Nó do mapa mental (estrutura hierárquica)
 */
export interface MindmapNode {
  id: string;
  label: string;
  type?: MindmapNodeType;
  color?: string;
  parent?: string;
  children?: MindmapNode[];
}

/**
 * Mapa mental completo
 */
export interface Mindmap {
  id?: string;
  title: string;
  lessonId?: string;
  nodes: MindmapNode[];
  summary?: string;
  createdAt?: string;
}

/**
 * Configuração de geração de mapa mental
 */
export interface MindmapGenerationConfig {
  topic?: string;
  content?: string;
  depth?: number;
  lessonId?: string;
}

// ============================================
// 3. CONTEÚDO GERADO POR IA
// ============================================

/**
 * Tipos de conteúdo que a IA pode gerar
 */
export type AIContentType = 'summary' | 'flashcards' | 'quiz' | 'mindmap';

/**
 * Conteúdo gerado pela IA (cache)
 * Alinhado com tabela: public.ai_generated_content
 */
export interface AIGeneratedContent {
  id: string;
  lessonId: string;
  contentType: AIContentType;
  content: unknown;
  modelUsed?: string;
  tokensUsed?: number;
  createdAt: Date;
}

/**
 * Flashcards gerados por IA (retorno da edge function)
 */
export interface AIGeneratedFlashcards {
  cards: FlashcardSimple[];
  topic?: string;
  difficulty?: FlashcardDifficulty;
}

/**
 * Mapa mental gerado por IA (retorno da edge function)
 */
export interface AIGeneratedMindmap {
  mindmap: Mindmap;
  summary?: string;
}

// ============================================
// 4. PARÂMETROS FSRS v5
// ============================================

/**
 * Parâmetros otimizados do algoritmo FSRS v5
 */
export const FSRS_PARAMS = {
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
  requestRetention: 0.9,
  maximumInterval: 36500,
  initialStability: [0.4, 0.6, 2.4, 5.8],
} as const;

/**
 * Configuração de botões de rating
 */
export const RATING_CONFIG = [
  { rating: 1 as FlashcardRating, label: 'Esqueci', emoji: '😓', color: 'red', interval: '<1min' },
  { rating: 2 as FlashcardRating, label: 'Difícil', emoji: '😅', color: 'orange', interval: '~1d' },
  { rating: 3 as FlashcardRating, label: 'Bom', emoji: '😊', color: 'green', interval: '~3d' },
  { rating: 4 as FlashcardRating, label: 'Fácil', emoji: '🤩', color: 'blue', interval: '~7d' },
] as const;

// ============================================
// 5. HELPERS / CONVERSORES
// ============================================

/**
 * Converte Flashcard FSRS para FlashcardSimple (UI)
 */
export function toFlashcardSimple(card: Flashcard): FlashcardSimple {
  // Mapear dificuldade numérica para categoria
  let difficulty: FlashcardDifficulty = 'medium';
  if (card.difficulty < 0.4) difficulty = 'easy';
  else if (card.difficulty > 0.7) difficulty = 'hard';

  return {
    id: card.id,
    front: card.question,
    back: card.answer,
    difficulty,
    lessonId: card.lesson_id || undefined,
  };
}

/**
 * Converte FlashcardSimple para dados de criação
 */
export function fromFlashcardSimple(card: FlashcardSimple, userId: string): CreateFlashcardInput {
  return {
    question: card.front,
    answer: card.back,
    lessonId: card.lessonId,
    source: 'manual',
  };
}

/**
 * Mapeia difficulty string para número FSRS
 */
export function difficultyToNumber(difficulty: FlashcardDifficulty): number {
  switch (difficulty) {
    case 'easy': return 0.2;
    case 'medium': return 0.5;
    case 'hard': return 0.8;
    default: return 0.5;
  }
}

/**
 * Mapeia número FSRS para difficulty string
 */
export function numberToDifficulty(value: number): FlashcardDifficulty {
  if (value < 0.4) return 'easy';
  if (value > 0.7) return 'hard';
  return 'medium';
}
