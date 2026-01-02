// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: useQuestionAILogs
// Gerencia logs de intervenção de IA em questões
// POLÍTICA: Global AI Question Intervention Visibility Policy v1.0
// ═══════════════════════════════════════════════════════════════════════════════

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS DE INTERVENÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

export type AIInterventionType = 
  | 'AI_AUTOFILL'                // Campo vazio foi preenchido
  | 'AI_ADDITION'                // Conteúdo novo foi criado (ex: explicação)
  | 'AI_CORRECTION'              // Valor existente foi alterado
  | 'AI_SUGGESTION_APPLIED'      // Sugestão confirmada e aplicada
  | 'AI_CLASSIFICATION_INFERENCE'; // Associação de taxonomia inferida

// Labels legíveis para tipos de intervenção
export const INTERVENTION_TYPE_LABELS: Record<AIInterventionType, string> = {
  AI_AUTOFILL: 'Preenchimento Automático',
  AI_ADDITION: 'Adição de Conteúdo',
  AI_CORRECTION: 'Correção',
  AI_SUGGESTION_APPLIED: 'Sugestão Aplicada',
  AI_CLASSIFICATION_INFERENCE: 'Inferência de Taxonomia',
};

// Cores para tipos de intervenção
export const INTERVENTION_TYPE_COLORS: Record<AIInterventionType, { bg: string; text: string; border: string }> = {
  AI_AUTOFILL: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
  AI_ADDITION: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  AI_CORRECTION: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  AI_SUGGESTION_APPLIED: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
  AI_CLASSIFICATION_INFERENCE: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40' },
};

// Ícones para tipos de intervenção (para uso com Lucide)
export const INTERVENTION_TYPE_ICONS: Record<AIInterventionType, string> = {
  AI_AUTOFILL: 'Wand2',
  AI_ADDITION: 'Plus',
  AI_CORRECTION: 'PenLine',
  AI_SUGGESTION_APPLIED: 'CheckCircle2',
  AI_CLASSIFICATION_INFERENCE: 'FolderTree',
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACE DO LOG
// ═══════════════════════════════════════════════════════════════════════════════

export interface QuestionAILog {
  id: string;
  question_id: string;
  created_at: string;
  source_file: string | null;
  source_type: string;
  field_affected: string;
  value_before: string | null;
  value_after: string;
  action_description: string;
  ai_confidence_score: number | null;
  ai_model_used: string | null;
  intervention_type: AIInterventionType;
  metadata: Record<string, unknown>;
}

// Labels legíveis para campos
export const FIELD_LABELS: Record<string, string> = {
  macro: 'Macroassunto',
  micro: 'Microassunto',
  tema: 'Tema',
  subtema: 'Subtema',
  difficulty: 'Dificuldade',
  banca: 'Banca',
  ano: 'Ano',
  explanation: 'Resolução',
  tags: 'Tags',
  question_text: 'Enunciado',
  correct_answer: 'Resposta Correta',
  options: 'Alternativas',
  image_url: 'Imagem',
  other: 'Outro',
};

// Labels legíveis para tipos de fonte
export const SOURCE_TYPE_LABELS: Record<string, string> = {
  import: 'Importação Excel',
  edit: 'Edição Manual',
  batch_inference: 'Inferência em Lote',
  manual_trigger: 'Gatilho Manual',
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK PRINCIPAL - BUSCAR LOGS DE UMA QUESTÃO
// ═══════════════════════════════════════════════════════════════════════════════

export function useQuestionAILogs(questionId: string | undefined) {
  return useQuery({
    queryKey: ['question-ai-logs', questionId],
    queryFn: async (): Promise<QuestionAILog[]> => {
      if (!questionId) return [];

      const { data, error } = await supabase
        .from('question_ai_intervention_logs')
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useQuestionAILogs] Erro ao buscar logs:', error);
        throw error;
      }

      return (data || []) as QuestionAILog[];
    },
    enabled: !!questionId,
    staleTime: 30_000, // 30 segundos
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK - VERIFICAR SE QUESTÕES TÊM LOGS (para listagem)
// ═══════════════════════════════════════════════════════════════════════════════

export interface QuestionAILogSummary {
  question_id: string;
  log_count: number;
  last_intervention_at: string;
  intervention_types: AIInterventionType[];
}

export function useQuestionsWithAILogs(questionIds: string[]) {
  return useQuery({
    queryKey: ['questions-ai-logs-summary', questionIds.sort().join(',')],
    queryFn: async (): Promise<Map<string, QuestionAILogSummary>> => {
      if (!questionIds.length) return new Map();

      // Buscar contagem e tipos de intervenção por questão
      const { data, error } = await supabase
        .from('question_ai_intervention_logs')
        .select('question_id, intervention_type, created_at')
        .in('question_id', questionIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useQuestionsWithAILogs] Erro:', error);
        throw error;
      }

      // Agrupar por questão
      const summaryMap = new Map<string, QuestionAILogSummary>();

      for (const row of data || []) {
        const existing = summaryMap.get(row.question_id);
        if (existing) {
          existing.log_count++;
          if (!existing.intervention_types.includes(row.intervention_type as AIInterventionType)) {
            existing.intervention_types.push(row.intervention_type as AIInterventionType);
          }
        } else {
          summaryMap.set(row.question_id, {
            question_id: row.question_id,
            log_count: 1,
            last_intervention_at: row.created_at,
            intervention_types: [row.intervention_type as AIInterventionType],
          });
        }
      }

      return summaryMap;
    },
    enabled: questionIds.length > 0,
    staleTime: 60_000, // 1 minuto
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK - RESUMO GLOBAL DE LOGS (para botão global na toolbar)
// ═══════════════════════════════════════════════════════════════════════════════

export interface GlobalAILogSummary {
  total_logs: number;
  questions_with_logs: number;
  intervention_types: AIInterventionType[];
  last_intervention_at: string | null;
}

export function useGlobalAILogsSummary() {
  return useQuery({
    queryKey: ['global-ai-logs-summary'],
    queryFn: async (): Promise<GlobalAILogSummary> => {
      const { data, error } = await supabase
        .from('question_ai_intervention_logs')
        .select('question_id, intervention_type, created_at')
        .order('created_at', { ascending: false })
        .limit(1000); // Limitar para performance

      if (error) {
        console.error('[useGlobalAILogsSummary] Erro:', error);
        throw error;
      }

      const uniqueQuestions = new Set<string>();
      const uniqueTypes = new Set<AIInterventionType>();
      let lastIntervention: string | null = null;

      for (const row of data || []) {
        uniqueQuestions.add(row.question_id);
        uniqueTypes.add(row.intervention_type as AIInterventionType);
        if (!lastIntervention) {
          lastIntervention = row.created_at;
        }
      }

      return {
        total_logs: data?.length || 0,
        questions_with_logs: uniqueQuestions.size,
        intervention_types: Array.from(uniqueTypes),
        last_intervention_at: lastIntervention,
      };
    },
    staleTime: 60_000, // 1 minuto
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PARA FORMATAR LOG EM TEXTO DETALHADO
// ═══════════════════════════════════════════════════════════════════════════════

export function formatLogAsText(log: QuestionAILog): string {
  const date = new Date(log.created_at);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0]; // HH:MM:SS
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const lines = [
    `════════════════════════════════════════════════════`,
    `[${dateStr} | ${timeStr} - ${timezone}]`,
    `QUESTION ID: ${log.question_id}`,
    ``,
    `TYPE OF ACTION: ${log.intervention_type}`,
    `   → ${INTERVENTION_TYPE_LABELS[log.intervention_type] || log.intervention_type}`,
    ``,
    `FIELD AFFECTED: ${log.field_affected.toUpperCase()}`,
    `   → ${FIELD_LABELS[log.field_affected] || log.field_affected}`,
    ``,
    `BEFORE:`,
    log.value_before ? `   ${log.value_before}` : `   (null)`,
    ``,
    `AFTER:`,
    `   "${log.value_after}"`,
    ``,
    `REASON:`,
    `   ${log.action_description}`,
    ``,
    `AI CONFIDENCE:`,
    `   ${log.ai_confidence_score !== null ? log.ai_confidence_score.toFixed(2) : 'N/A'}`,
    ``,
    log.ai_model_used ? `MODEL: ${log.ai_model_used}` : '',
    log.source_file ? `SOURCE FILE: ${log.source_file}` : '',
    `SOURCE TYPE: ${SOURCE_TYPE_LABELS[log.source_type] || log.source_type}`,
    `════════════════════════════════════════════════════`,
  ];

  return lines.filter(Boolean).join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PARA EXPORTAR TODOS OS LOGS EM TXT
// ═══════════════════════════════════════════════════════════════════════════════

export function exportLogsAsTxt(logs: QuestionAILog[], questionId: string): string {
  const header = [
    `╔══════════════════════════════════════════════════════════════════════════════╗`,
    `║           AI INTERVENTION REPORT - QUESTION AUDIT LOG                        ║`,
    `║           Global AI Question Intervention Visibility Policy v1.0             ║`,
    `╠══════════════════════════════════════════════════════════════════════════════╣`,
    `║ QUESTION ID: ${questionId.padEnd(55)}║`,
    `║ TOTAL INTERVENTIONS: ${String(logs.length).padEnd(48)}║`,
    `║ GENERATED AT: ${new Date().toISOString().padEnd(55)}║`,
    `╚══════════════════════════════════════════════════════════════════════════════╝`,
    ``,
    ``,
  ];

  if (logs.length === 0) {
    return header.join('\n') + '\n⚠️ No AI interventions recorded for this question.';
  }

  // Resumo por tipo
  const typeCounts = logs.reduce((acc, log) => {
    acc[log.intervention_type] = (acc[log.intervention_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summary = [
    `INTERVENTION SUMMARY:`,
    `─────────────────────`,
    ...Object.entries(typeCounts).map(([type, count]) => 
      `  • ${INTERVENTION_TYPE_LABELS[type as AIInterventionType] || type}: ${count}`
    ),
    ``,
    `DETAILED LOG ENTRIES:`,
    `═════════════════════`,
    ``,
  ];

  const logsText = logs.map((log, index) => {
    return `\n[INTERVENTION #${index + 1}]\n${formatLogAsText(log)}`;
  }).join('\n');

  return header.join('\n') + summary.join('\n') + logsText;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PARA DOWNLOAD DO TXT
// ═══════════════════════════════════════════════════════════════════════════════

export function downloadLogsAsTxt(logs: QuestionAILog[], questionId: string): void {
  const content = exportLogsAsTxt(logs, questionId);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `ai-audit-log-${questionId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
