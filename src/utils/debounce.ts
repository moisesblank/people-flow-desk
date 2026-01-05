// ============================================
// DEBOUNCE UTILITY — THUNDERING HERD PREVENTION
// CONSTITUIÇÃO SYNAPSE Ω v10.x — LEI I PERFORMANCE
// ============================================
// Evita sobrecarga do banco quando múltiplos clientes
// recebem eventos realtime simultaneamente.
// ============================================

/**
 * Cria uma versão debounced de uma função.
 * Agrupa múltiplas chamadas em uma única execução após o delay.
 * 
 * @param func Função a ser executada após o delay
 * @param waitMs Tempo de espera em milissegundos
 * @returns Função debounced com método cancel()
 * 
 * @example
 * const debouncedRefetch = debounce(() => refetch(), 5000);
 * // Chamadas múltiplas dentro de 5s resultam em 1 execução
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  waitMs: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, waitMs);
  };

  debounced.cancel = (): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

// ============================================
// CONSTANTES DE DEBOUNCE POR TIPO DE DADO
// ============================================
// Tempos otimizados para 5.000 usuários simultâneos

export const DEBOUNCE_TIMES = {
  /** Dados de gestão (lessons, modules, courses) - 5s */
  GESTAO_CONTENT: 5000,
  
  /** Dados pessoais do aluno (lesson_progress, question_attempts) - 1s */
  PERSONAL_DATA: 1000,
  
  /** Métricas de dashboard financeiro - 10s */
  DASHBOARD_METRICS: 10000,
  
  /** Dados de gamificação - 2s */
  GAMIFICATION: 2000,
  
  /** WhatsApp Live - 0 (sem debounce, tempo real) */
  REALTIME_CHAT: 0,
} as const;

/**
 * Retorna o tempo de debounce recomendado para uma tabela específica.
 * Usa a estratégia de nuances baseada no tipo de dado.
 */
export function getDebounceTimeForTable(tableName: string): number {
  const tableDebounceMap: Record<string, number> = {
    // Gestão de conteúdo - debounce alto (evita Thundering Herd)
    lessons: DEBOUNCE_TIMES.GESTAO_CONTENT,
    modules: DEBOUNCE_TIMES.GESTAO_CONTENT,
    courses: DEBOUNCE_TIMES.GESTAO_CONTENT,
    areas: DEBOUNCE_TIMES.GESTAO_CONTENT,
    
    // Dados pessoais do aluno - debounce curto (já filtrado por user_id)
    lesson_progress: DEBOUNCE_TIMES.PERSONAL_DATA,
    question_attempts: DEBOUNCE_TIMES.PERSONAL_DATA,
    quiz_answers: DEBOUNCE_TIMES.PERSONAL_DATA,
    
    // Gamificação - debounce médio
    user_gamification: DEBOUNCE_TIMES.GAMIFICATION,
    user_achievements: DEBOUNCE_TIMES.GAMIFICATION,
    user_badges: DEBOUNCE_TIMES.GAMIFICATION,
    
    // Dashboard financeiro - debounce alto
    entradas: DEBOUNCE_TIMES.DASHBOARD_METRICS,
    gastos: DEBOUNCE_TIMES.DASHBOARD_METRICS,
    company_fixed_expenses: DEBOUNCE_TIMES.DASHBOARD_METRICS,
    company_extra_expenses: DEBOUNCE_TIMES.DASHBOARD_METRICS,
    calendar_tasks: DEBOUNCE_TIMES.DASHBOARD_METRICS,
    alunos: DEBOUNCE_TIMES.DASHBOARD_METRICS,
    
    // WhatsApp - SEM debounce (chat precisa ser instantâneo)
    whatsapp_messages: DEBOUNCE_TIMES.REALTIME_CHAT,
    whatsapp_conversations: DEBOUNCE_TIMES.REALTIME_CHAT,
  };

  return tableDebounceMap[tableName] ?? DEBOUNCE_TIMES.GESTAO_CONTENT;
}
