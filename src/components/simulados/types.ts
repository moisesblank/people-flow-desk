/**
 * 🎯 SIMULADOS — Tipos e Enums
 * Constituição SYNAPSE Ω v10.0
 * 
 * Máquina de Estados EXPLÍCITA
 * Nenhum estado implícito permitido
 */

// ============================================
// ESTADOS DO SIMULADO (EXPLÍCITOS)
// ============================================

export enum SimuladoState {
  /** Antes de starts_at - usuário aguarda abertura */
  WAITING = "WAITING",
  
  /** Liberado para iniciar - entre starts_at e ends_at */
  READY = "READY",
  
  /** Tentativa em andamento */
  RUNNING = "RUNNING",
  
  /** Finalizado, aguardando liberação do gabarito */
  FINISHED_SCORE_ONLY = "FINISHED_SCORE_ONLY",
  
  /** Gabarito liberado, modo revisão */
  REVIEW = "REVIEW",
  
  /** Tentativa invalidada (Hard Mode) */
  INVALIDATED = "INVALIDATED",
  
  /** Retake - sem pontuação para ranking */
  DISQUALIFIED = "DISQUALIFIED",
  
  /** Estado de carregamento */
  LOADING = "LOADING",
  
  /** Erro crítico */
  ERROR = "ERROR",
}

// ============================================
// INTERFACES DE DADOS
// ============================================

export interface Simulado {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  
  // Tempo
  duration_minutes: number;
  tolerance_minutes: number;
  starts_at?: string;
  ends_at?: string;
  results_released_at?: string;
  
  // Modo Hard
  is_hard_mode: boolean;
  max_tab_switches: number;
  requires_camera: boolean;
  
  // Configurações
  is_active: boolean;
  is_published: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_correct_answer_after: boolean;
  
  // Questões
  question_ids: string[];
  total_questions: number;
  
  // Pontuação
  points_per_question: number;
  passing_score: number;
  
  // Meta
  created_at: string;
  updated_at: string;
}

export interface SimuladoAttempt {
  id: string;
  simulado_id: string;
  user_id: string;
  status: "RUNNING" | "FINISHED" | "ABANDONED" | "INVALIDATED";
  attempt_number: number;
  is_scored_for_ranking: boolean;
  score: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered: number;
  tab_switches: number;
  invalidation_reason?: string;
  camera_active: boolean;
  started_at: string;
  finished_at?: string;
  time_spent_seconds?: number;
}

export interface SimuladoQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: Record<string, string>;
  correct_answer?: string; // Só disponível após gabarito
  explanation?: string; // Só disponível após gabarito
  video_url?: string; // URL do vídeo de resolução (Panda/YouTube)
  video_provider?: string; // 'panda' | 'youtube' | 'vimeo'
  has_video_resolution?: boolean;
  image_url?: string;
  image_urls?: string[]; // Suporte a múltiplas imagens
  difficulty?: string;
  banca?: string;
  ano?: number;
  order: number;
  // TEMPORAL TRUTH RULE: Campos de taxonomia completos
  macro?: string | null;
  micro?: string | null;
  tema?: string | null;
  subtema?: string | null;
  tags?: string[] | null;
  points?: number;
}

export interface SimuladoAnswer {
  questionId: string;
  selectedOption: string | null;
  answeredAt: Date | null;
  timeSpentSeconds: number;
}

export interface SimuladoResult {
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  xpAwarded: number;
  isScoredForRanking: boolean;
  timeSpentSeconds: number;
  percentage: number;
  passed: boolean;
}

// ============================================
// CONTEXTO DO PLAYER
// ============================================

export interface SimuladoPlayerContext {
  // Estado atual
  currentState: SimuladoState;
  
  // Dados
  simulado: Simulado | null;
  attempt: SimuladoAttempt | null;
  questions: SimuladoQuestion[];
  answers: Map<string, SimuladoAnswer>;
  result: SimuladoResult | null;
  
  // Navegação
  currentQuestionIndex: number;
  
  // Timer (derivado do servidor)
  remainingSeconds: number;
  elapsedSeconds: number;
  isTimeWarning: boolean;
  isTimeCritical: boolean;
  
  // Hard Mode
  tabSwitches: number;
  maxTabSwitches: number;
  isCameraActive: boolean;
  cameraError: string | null;
  
  // UI
  isLoading: boolean;
  error: string | null;
  
  // Flags
  isRetake: boolean;
  isGabaritoReleased: boolean;
  canReviewAnswers: boolean;
}

// ============================================
// AÇÕES DO PLAYER
// ============================================

export interface SimuladoPlayerActions {
  // Ciclo de vida
  startAttempt: () => Promise<boolean>;
  finishAttempt: () => Promise<void>;
  abandonAttempt: () => Promise<void>;
  
  // Navegação
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  
  // Respostas
  selectAnswer: (questionId: string, optionKey: string) => Promise<void>;
  
  // Hard Mode
  reportTabSwitch: () => Promise<void>;
  requestCamera: () => Promise<boolean>;
  
  // Controle
  reset: () => void;
  retry: () => void;
}

// ============================================
// PROPS DE COMPONENTES
// ============================================

export interface SimuladoPlayerProps {
  simuladoId: string;
  onComplete?: (result: SimuladoResult) => void;
  onExit?: () => void;
  /** Força modo específico: 'treino' ignora Hard Mode, 'hard' força Hard Mode */
  forcedMode?: 'treino' | 'hard' | null;
}

export interface SimuladoConsentProps {
  simulado: Simulado;
  onAccept: () => void;
  onDecline: () => void;
}

export interface SimuladoTimerProps {
  remainingSeconds: number;
  isWarning: boolean;
  isCritical: boolean;
  onTimeUp?: () => void;
}

export interface SimuladoCameraWidgetProps {
  isActive: boolean;
  error: string | null;
  onRequestCamera: () => void;
}

export interface SimuladoProgressProps {
  current: number;
  total: number;
  answered: number;
}

export interface SimuladoQuestionCardProps {
  question: SimuladoQuestion;
  selectedOption: string | null;
  onSelectOption: (optionKey: string) => void;
  isReviewMode: boolean;
  showCorrectAnswer: boolean;
}

export interface SimuladoResultProps {
  result: SimuladoResult;
  simulado: Simulado;
  isRetake: boolean;
  gabaritoReleasedAt?: string;
  onReview?: () => void;
  onExit?: () => void;
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Determina o estado do simulado baseado nos dados do servidor
 */
export function determineSimuladoState(
  simulado: Simulado | null,
  attempt: SimuladoAttempt | null,
  now: Date = new Date()
): SimuladoState {
  if (!simulado) return SimuladoState.LOADING;
  
  // Verificar janela de tempo
  const startsAt = simulado.starts_at ? new Date(simulado.starts_at) : null;
  const endsAt = simulado.ends_at ? new Date(simulado.ends_at) : null;
  const gabaritoAt = simulado.results_released_at ? new Date(simulado.results_released_at) : null;
  const isGabaritoAvailable = !gabaritoAt || now >= gabaritoAt;
  
  // WAITING: antes de starts_at
  if (startsAt && now < startsAt) {
    return SimuladoState.WAITING;
  }
  
  // Verificar se há tentativa
  if (!attempt) {
    // Verificar se expirou
    if (endsAt && now > endsAt) {
      return SimuladoState.FINISHED_SCORE_ONLY; // Expirou sem tentativa
    }
    return SimuladoState.READY;
  }
  
  // Tentativa existe
  switch (attempt.status) {
    case "RUNNING":
      return SimuladoState.RUNNING;
      
    case "INVALIDATED":
      return SimuladoState.INVALIDATED;
      
    case "FINISHED":
    case "ABANDONED":
      // Verificar se é retake
      if (!attempt.is_scored_for_ranking) {
        // Retake: pode revisar quando gabarito estiver disponível
        return isGabaritoAvailable ? SimuladoState.REVIEW : SimuladoState.DISQUALIFIED;
      }
      
      // Primeira tentativa válida
      return isGabaritoAvailable ? SimuladoState.REVIEW : SimuladoState.FINISHED_SCORE_ONLY;
      
    default:
      return SimuladoState.ERROR;
  }
}

/**
 * Formata segundos para HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * Calcula porcentagem de acerto
 */
export function calculatePercentage(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}
