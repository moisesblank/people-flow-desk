// ============================================
// TIPOS DE IA E AUTOMAÇÃO
// Centralizados por domínio
// ============================================

// Mensagem de chat com IA
export interface AIChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  isLoading?: boolean;
  error?: string;
}

// Resposta de streaming da IA
export interface AIStreamResponse {
  choices?: Array<{
    delta?: {
      content?: string;
    };
    message?: {
      content?: string;
    };
  }>;
}

// Tipos de conteúdo gerado por IA
export type AIContentType = 'summary' | 'flashcards' | 'quiz' | 'mindmap' | 'explanation';

// Conteúdo gerado por IA
export interface AIGeneratedContent {
  id: string;
  lessonId: string;
  contentType: AIContentType;
  content: unknown;
  modelUsed?: string;
  tokensUsed?: number;
  createdAt: Date;
}

// Métricas do SNA (Sistema Nervoso Autônomo)
export interface SNAMetrics {
  jobs: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    avg_processing_ms: number;
    p95_processing_ms: number;
  };
  costs: {
    total_usd: number;
    today_usd: number;
    budget_usd: number;
    budget_alert: boolean;
  };
  health: {
    status: 'healthy' | 'degraded' | 'critical';
    last_check: string;
    uptime_percent: number;
  };
}

// Job do SNA
export interface SNAJob {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: number;
  payload: unknown;
  result?: unknown;
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  processing_ms?: number;
}

// Feature Flag
export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description?: string;
  percentage?: number;
  conditions?: Record<string, unknown>;
}

// Resultado de health check
export interface HealthCheckResult {
  service: string;
  status: 'ok' | 'error' | 'timeout';
  latency_ms?: number;
  message?: string;
}

// Thread de chat de livro
export interface BookChatThread {
  id: string;
  bookId: string;
  initialPage?: number;
  initialChapter?: string;
  title?: string;
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Mensagem de chat de livro
export interface BookChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pageNumber?: number;
  chapterTitle?: string;
  createdAt: string;
  isLoading?: boolean;
  contentReference?: { 
    selectedText?: string;
  };
}
