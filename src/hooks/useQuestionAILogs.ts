// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: useQuestionAILogs
// Gerencia logs de intervenção de IA em questões
// POLÍTICA: Question AI Intervention Audit Policy v1.0
// ═══════════════════════════════════════════════════════════════════════════════

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
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
// HOOK PRINCIPAL
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
// FUNÇÃO PARA FORMATAR LOG EM TEXTO
// ═══════════════════════════════════════════════════════════════════════════════

export function formatLogAsText(log: QuestionAILog): string {
  const date = new Date(log.created_at);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0]; // HH:MM:SS
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const lines = [
    `════════════════════════════════════════════════════`,
    `📅 DATA: ${dateStr}`,
    `🕐 HORA: ${timeStr} (${timezone})`,
    `🆔 QUESTÃO: ${log.question_id}`,
    `📁 ORIGEM: ${log.source_file || 'Sistema'}`,
    `📋 TIPO: ${SOURCE_TYPE_LABELS[log.source_type] || log.source_type}`,
    ``,
    `🎯 CAMPO AFETADO: ${FIELD_LABELS[log.field_affected] || log.field_affected}`,
    ``,
    `❌ VALOR ANTERIOR:`,
    `   ${log.value_before || '(vazio)'}`,
    ``,
    `✅ VALOR NOVO:`,
    `   ${log.value_after}`,
    ``,
    `📝 DESCRIÇÃO:`,
    `   ${log.action_description}`,
    ``,
    `🤖 CONFIANÇA IA: ${log.ai_confidence_score !== null ? `${(log.ai_confidence_score * 100).toFixed(0)}%` : 'N/A'}`,
    `⚙️ MODELO: ${log.ai_model_used || 'N/A'}`,
    `════════════════════════════════════════════════════`,
  ];

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PARA EXPORTAR TODOS OS LOGS EM TXT
// ═══════════════════════════════════════════════════════════════════════════════

export function exportLogsAsTxt(logs: QuestionAILog[], questionId: string): string {
  const header = [
    `╔══════════════════════════════════════════════════════════════════════════════╗`,
    `║           RELATÓRIO DE INTERVENÇÕES DE IA - QUESTÃO                          ║`,
    `║           Question AI Intervention Audit Policy v1.0                         ║`,
    `╠══════════════════════════════════════════════════════════════════════════════╣`,
    `║ ID da Questão: ${questionId.padEnd(55)}║`,
    `║ Total de Intervenções: ${String(logs.length).padEnd(48)}║`,
    `║ Gerado em: ${new Date().toISOString().padEnd(56)}║`,
    `╚══════════════════════════════════════════════════════════════════════════════╝`,
    ``,
    ``,
  ];

  if (logs.length === 0) {
    return header.join('\n') + '\n⚠️ Nenhuma intervenção de IA registrada para esta questão.';
  }

  const logsText = logs.map((log, index) => {
    return `\n[INTERVENÇÃO #${index + 1}]\n${formatLogAsText(log)}`;
  }).join('\n');

  return header.join('\n') + logsText;
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
  link.download = `ai-logs-questao-${questionId.slice(0, 8)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
