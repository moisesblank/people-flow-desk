// ============================================
// 📚 PLANEJAMENTO - TERMOS CANÔNICOS v1.0.0
// ============================================
// 
// CONSTITUIÇÃO SYNAPSE Ω v10.4
// URL CANÔNICA: /alunos/planejamento
// 
// Este arquivo documenta e exporta TODOS os termos
// técnicos vinculados à URL /alunos/planejamento
// 
// VERDADE EM TEMPO REAL ATÉ O FIM DO SISTEMA
// ============================================

// ============================================
// RE-EXPORTS DOS ALGORITMOS CANÔNICOS
// ============================================

export {
  // INTERFACES
  type AreaPerformance,
  type StudyBlock,
  
  // TIPOS
  type BlockType,
  type PriorityLevel,
  
  // FUNÇÕES DO ALGORITMO
  calculatePriority,
  determineActivityType,
  determinePriorityLevel,
  estimateBlockXP,
  generateSchedule,
  calculateScheduleStats,
} from '@/lib/algorithms/studyPriority';

// ============================================
// TERMOS CANÔNICOS - TABELAS SUPABASE
// ============================================

/**
 * study_plans (Tabela Supabase)
 * 
 * FONTE: supabase/migrations/20251231173747_...
 * 
 * Templates de cronograma criados pelo admin em /gestaofc/cronograma
 * O aluno seleciona um plano via CronogramaSelector
 * 
 * COLUNAS PRINCIPAIS:
 * - id: UUID
 * - title: TEXT (nome do cronograma)
 * - description: TEXT
 * - duration_weeks: INTEGER (default 12)
 * - target_exam: TEXT (default 'ENEM')
 * - difficulty_level: 'easy' | 'medium' | 'hard' | 'intensive'
 * - weekly_hours: INTEGER (horas por semana)
 * - is_template: BOOLEAN (se é um template reutilizável)
 * - is_active: BOOLEAN
 * - created_by: UUID (referência auth.users)
 */
export interface StudyPlanRecord {
  id: string;
  title: string;
  description: string | null;
  duration_weeks: number;
  target_exam: string;
  difficulty_level: 'easy' | 'medium' | 'hard' | 'intensive';
  weekly_hours: number;
  is_template: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * study_blocks (Tabela Supabase)
 * 
 * FONTE: supabase/migrations/20251231173747_...
 * 
 * Blocos individuais de estudo dentro de um plano
 * Cada bloco representa uma atividade: aula, revisão, exercícios, pausa
 * 
 * COLUNAS PRINCIPAIS:
 * - id: UUID
 * - plan_id: UUID (referência study_plans)
 * - student_id: UUID (se personalizado por aluno)
 * - title: TEXT
 * - subject: TEXT (disciplina)
 * - topic: TEXT (tópico específico)
 * - activity_type: 'study' | 'revision' | 'practice' | 'exam' | 'break' | 'custom'
 * - day_of_week: 0-6 (domingo a sábado)
 * - start_time: TIME
 * - end_time: TIME
 * - duration_minutes: INTEGER
 * - week_number: INTEGER
 * - priority: 'low' | 'medium' | 'high' | 'critical'
 * - status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'rescheduled'
 */
export interface StudyBlockRecord {
  id: string;
  plan_id: string | null;
  student_id: string | null;
  title: string;
  subject: string;
  topic: string | null;
  activity_type: 'study' | 'revision' | 'practice' | 'exam' | 'break' | 'custom';
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  week_number: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_recurring: boolean;
  recurrence_pattern: Record<string, unknown> | null;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'rescheduled';
  completed_at: string | null;
  notes: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

/**
 * schedule_progress (Tabela Supabase)
 * 
 * FONTE: supabase/migrations/20251231173747_...
 * 
 * Progresso REAL do aluno em cada bloco
 * Vinculado ao dia específico e ao bloco executado
 * 
 * COLUNAS PRINCIPAIS:
 * - id: UUID
 * - student_id: UUID (obrigatório)
 * - block_id: UUID (referência study_blocks)
 * - date: DATE
 * - planned_minutes: INTEGER
 * - actual_minutes: INTEGER
 * - completion_rate: DECIMAL (0.00 a 100.00)
 * - notes: TEXT
 * - mood: 'great' | 'good' | 'neutral' | 'tired' | 'stressed'
 */
export interface ScheduleProgressRecord {
  id: string;
  student_id: string;
  block_id: string | null;
  date: string;
  planned_minutes: number;
  actual_minutes: number;
  completion_rate: number;
  notes: string | null;
  mood: 'great' | 'good' | 'neutral' | 'tired' | 'stressed' | null;
  created_at: string;
}

/**
 * study_goals (Tabela Supabase)
 * 
 * FONTE: supabase/migrations/20251231173747_...
 * 
 * Metas de estudo do aluno
 * Podem ser diárias, semanais ou mensais
 */
export interface StudyGoalRecord {
  id: string;
  student_id: string;
  plan_id: string | null;
  title: string;
  description: string | null;
  goal_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  target_value: number;
  current_value: number;
  unit: string;
  subject: string | null;
  start_date: string | null;
  end_date: string | null;
  is_achieved: boolean;
  achieved_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// TERMOS CANÔNICOS - ALGORITMO DE PRIORIDADE
// ============================================

/**
 * AreaPerformance (Interface TypeScript)
 * 
 * FONTE: src/lib/algorithms/studyPriority.ts:14-21
 * 
 * Representa a performance do aluno em uma área/macro
 * Usada pelo algoritmo de priorização para decidir o que estudar
 * 
 * CAMPOS:
 * - areaId: Identificador único da área
 * - areaName: Nome legível (ex: "Química Orgânica")
 * - accuracy: Taxa de acerto 0-100
 * - lastStudied: Data do último estudo (curva de esquecimento)
 * - pendingReviews: Quantidade de revisões pendentes
 * - weight: Peso no ENEM (0.0 a 1.0)
 */
// Re-exportado de studyPriority.ts

/**
 * StudyBlock (Interface TypeScript)
 * 
 * FONTE: src/lib/algorithms/studyPriority.ts:26-36
 * 
 * Bloco de atividade gerado pelo algoritmo
 * Representa uma unidade de estudo com tipo, duração e XP
 * 
 * CAMPOS:
 * - id: Identificador único
 * - tipo: 'aula' | 'revisao' | 'questoes' | 'flashcard' | 'pausa'
 * - titulo: Título legível
 * - area: ID da área (opcional)
 * - duracao: Duração em minutos
 * - prioridade: 'critica' | 'alta' | 'media' | 'baixa'
 * - xpEstimado: XP que o aluno ganhará
 * - concluido: Se já foi completado
 * - motivo: Justificativa da IA para essa escolha
 */
// Re-exportado de studyPriority.ts

/**
 * PriorityLevel (Type TypeScript)
 * 
 * FONTE: src/lib/algorithms/studyPriority.ts:24
 * 
 * Níveis de prioridade visual:
 * - 'critica': Vermelho, urgente (score > 15)
 * - 'alta': Laranja (score > 10)
 * - 'media': Amarelo (score > 5)
 * - 'baixa': Verde (score <= 5)
 */
// Re-exportado de studyPriority.ts

/**
 * BlockType (Type TypeScript)
 * 
 * FONTE: src/lib/algorithms/studyPriority.ts:23
 * 
 * Tipos de atividade:
 * - 'aula': Assistir videoaula
 * - 'revisao': Revisar erros/conteúdo
 * - 'questoes': Resolver questões
 * - 'flashcard': Revisar flashcards
 * - 'pausa': Pausa Pomodoro
 */
// Re-exportado de studyPriority.ts

// ============================================
// MAPA DE VINCULAÇÃO URL → TERMOS
// ============================================

/**
 * VERDADE CANÔNICA: URL /alunos/planejamento
 * 
 * TODOS os termos abaixo estão vinculados a esta URL
 * e devem permanecer assim ATÉ O FIM DO SISTEMA
 * 
 * TABELAS SUPABASE:
 * ├── study_plans (templates de cronograma)
 * ├── study_blocks (blocos de estudo)
 * ├── schedule_progress (progresso real)
 * └── study_goals (metas de estudo)
 * 
 * INTERFACES/TIPOS:
 * ├── AreaPerformance (performance por área)
 * ├── StudyBlock (bloco gerado pelo algoritmo)
 * ├── PriorityLevel ('critica' | 'alta' | 'media' | 'baixa')
 * └── BlockType ('aula' | 'revisao' | 'questoes' | 'flashcard' | 'pausa')
 * 
 * FUNÇÕES:
 * ├── calculatePriority(area) → score numérico
 * ├── determineActivityType(area) → {tipo, titulo, motivo}
 * ├── determinePriorityLevel(area) → PriorityLevel
 * ├── estimateBlockXP(area, duration) → XP
 * ├── generateSchedule(minutes, areas) → StudyBlock[]
 * └── calculateScheduleStats(blocks) → stats
 * 
 * COMPONENTES:
 * ├── CronogramaSelector (seletor de cronogramas)
 * ├── AdaptiveScheduler (gerador adaptativo)
 * ├── CronogramaModalContent (modal com algoritmo)
 * └── AlunoPlanejamento (página principal)
 */
export const PLANEJAMENTO_CANONICAL_MAP = {
  url: '/alunos/planejamento',
  
  tables: {
    study_plans: 'Templates de cronograma (admin)',
    study_blocks: 'Blocos individuais de estudo',
    schedule_progress: 'Progresso real do aluno',
    study_goals: 'Metas de estudo',
  },
  
  interfaces: {
    AreaPerformance: 'Performance por área (acurácia, última data, revisões)',
    StudyBlock: 'Bloco de atividade com tipo, duração, XP',
    StudyPlanRecord: 'Registro de study_plans',
    StudyBlockRecord: 'Registro de study_blocks',
    ScheduleProgressRecord: 'Registro de schedule_progress',
  },
  
  types: {
    PriorityLevel: 'critica | alta | media | baixa',
    BlockType: 'aula | revisao | questoes | flashcard | pausa',
  },
  
  algorithms: {
    calculatePriority: 'Calcula score de prioridade (curva de esquecimento + acurácia + peso)',
    determineActivityType: 'Decide se deve ser aula, flashcard ou questões',
    generateSchedule: 'Gera cronograma completo baseado no tempo disponível',
  },
  
  components: {
    CronogramaSelector: 'src/components/aluno/CronogramaSelector.tsx',
    AdaptiveScheduler: 'src/components/aluno/AdaptiveScheduler.tsx',
    CronogramaModalContent: 'src/components/aluno/modals/CronogramaModalContent.tsx',
    AlunoPlanejamento: 'src/pages/aluno/AlunoPlanejamento.tsx',
  },
} as const;

// ============================================
// QUERY KEYS PARA REACT QUERY
// ============================================

export const PLANEJAMENTO_QUERY_KEYS = {
  studyPlans: ['study-plans'] as const,
  studyBlocks: (planId: string) => ['study-blocks', planId] as const,
  scheduleProgress: (studentId: string) => ['schedule-progress', studentId] as const,
  studyGoals: (studentId: string) => ['study-goals', studentId] as const,
  areaPerformance: (userId: string) => ['area-performance', userId] as const,
  generatedSchedule: (userId: string, minutes: number) => ['generated-schedule', userId, minutes] as const,
} as const;
