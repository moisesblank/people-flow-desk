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
  nivel_cognitivo: 'Nível Cognitivo',
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

export interface FieldBreakdown {
  field: string;
  count: number;
}

export interface TypeBreakdown {
  type: AIInterventionType;
  count: number;
  fields: FieldBreakdown[];
}

export interface GlobalAILogSummary {
  total_logs: number;
  questions_with_logs: number;
  intervention_types: AIInterventionType[];
  type_breakdown: TypeBreakdown[];
  field_breakdown: FieldBreakdown[];
  last_intervention_at: string | null;
  first_intervention_at: string | null;
  source_files: string[];
}

export function useGlobalAILogsSummary() {
  return useQuery({
    queryKey: ['global-ai-logs-summary'],
    queryFn: async (): Promise<GlobalAILogSummary> => {
      const { data, error } = await supabase
        .from('question_ai_intervention_logs')
        .select('question_id, intervention_type, field_affected, source_file, created_at')
        .order('created_at', { ascending: false })
        .limit(5000); // Aumentado para escala

      if (error) {
        console.error('[useGlobalAILogsSummary] Erro:', error);
        throw error;
      }

      const uniqueQuestions = new Set<string>();
      const uniqueTypes = new Set<AIInterventionType>();
      const uniqueSourceFiles = new Set<string>();
      let lastIntervention: string | null = null;
      let firstIntervention: string | null = null;

      // Contagem por tipo
      const typeCountMap = new Map<AIInterventionType, Map<string, number>>();
      // Contagem por campo
      const fieldCountMap = new Map<string, number>();

      for (const row of data || []) {
        uniqueQuestions.add(row.question_id);
        uniqueTypes.add(row.intervention_type as AIInterventionType);
        
        if (row.source_file) {
          uniqueSourceFiles.add(row.source_file);
        }
        
        if (!lastIntervention) {
          lastIntervention = row.created_at;
        }
        firstIntervention = row.created_at;

        // Contagem por tipo + campo
        const iType = row.intervention_type as AIInterventionType;
        if (!typeCountMap.has(iType)) {
          typeCountMap.set(iType, new Map());
        }
        const fieldMap = typeCountMap.get(iType)!;
        fieldMap.set(row.field_affected, (fieldMap.get(row.field_affected) || 0) + 1);

        // Contagem geral por campo
        fieldCountMap.set(row.field_affected, (fieldCountMap.get(row.field_affected) || 0) + 1);
      }

      // Montar type_breakdown
      const type_breakdown: TypeBreakdown[] = [];
      for (const [type, fieldMap] of typeCountMap.entries()) {
        const fields: FieldBreakdown[] = [];
        let totalForType = 0;
        for (const [field, count] of fieldMap.entries()) {
          fields.push({ field, count });
          totalForType += count;
        }
        fields.sort((a, b) => b.count - a.count);
        type_breakdown.push({ type, count: totalForType, fields });
      }
      type_breakdown.sort((a, b) => b.count - a.count);

      // Montar field_breakdown
      const field_breakdown: FieldBreakdown[] = [];
      for (const [field, count] of fieldCountMap.entries()) {
        field_breakdown.push({ field, count });
      }
      field_breakdown.sort((a, b) => b.count - a.count);

      return {
        total_logs: data?.length || 0,
        questions_with_logs: uniqueQuestions.size,
        intervention_types: Array.from(uniqueTypes),
        type_breakdown,
        field_breakdown,
        last_intervention_at: lastIntervention,
        first_intervention_at: firstIntervention,
        source_files: Array.from(uniqueSourceFiles),
      };
    },
    staleTime: 30_000, // 30 segundos para ver mudanças mais rápido
    refetchOnWindowFocus: true, // Atualizar ao voltar à janela
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK - LOGS AGRUPADOS POR QUESTÃO (para visualização em tempo real)
// POLÍTICA: Real-Time Question-Level AI Log Policy v1.0
// ═══════════════════════════════════════════════════════════════════════════════

export interface QuestionWithLogs {
  question_id: string;
  question_text_preview: string;
  logs: QuestionAILog[];
  total_interventions: number;
  first_intervention_at: string;
  last_intervention_at: string;
  intervention_types: AIInterventionType[];
}

export interface GroupedAILogs {
  questions: QuestionWithLogs[];
  total_logs: number;
  total_questions: number;
}

export function useGlobalAILogsGroupedByQuestion() {
  return useQuery({
    queryKey: ['global-ai-logs-by-question'],
    queryFn: async (): Promise<GroupedAILogs> => {
      // Buscar todos os logs com detalhes completos
      const { data, error } = await supabase
        .from('question_ai_intervention_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error) {
        console.error('[useGlobalAILogsGroupedByQuestion] Erro:', error);
        throw error;
      }

      // Agrupar por question_id
      const groupedMap = new Map<string, QuestionAILog[]>();
      
      for (const row of (data as QuestionAILog[]) || []) {
        const existing = groupedMap.get(row.question_id) || [];
        existing.push(row);
        groupedMap.set(row.question_id, existing);
      }

      // Converter para array de QuestionWithLogs
      const questions: QuestionWithLogs[] = [];
      
      for (const [question_id, logs] of groupedMap.entries()) {
        // Ordenar logs por data (mais recente primeiro)
        logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // Extrair tipos únicos de intervenção
        const typesSet = new Set<AIInterventionType>();
        logs.forEach(log => typesSet.add(log.intervention_type));
        
        // Criar preview do texto da questão (baseado no primeiro log com value_after em question_text)
        let textPreview = `Questão ${question_id.slice(0, 8)}...`;
        const questionTextLog = logs.find(l => l.field_affected === 'question_text' && l.value_after);
        if (questionTextLog) {
          textPreview = questionTextLog.value_after.slice(0, 100) + (questionTextLog.value_after.length > 100 ? '...' : '');
        }

        questions.push({
          question_id,
          question_text_preview: textPreview,
          logs,
          total_interventions: logs.length,
          first_intervention_at: logs[logs.length - 1].created_at,
          last_intervention_at: logs[0].created_at,
          intervention_types: Array.from(typesSet),
        });
      }

      // Ordenar questões pela última intervenção (mais recente primeiro)
      questions.sort((a, b) => 
        new Date(b.last_intervention_at).getTime() - new Date(a.last_intervention_at).getTime()
      );

      return {
        questions,
        total_logs: data?.length || 0,
        total_questions: questions.length,
      };
    },
    staleTime: 10_000, // 10 segundos para atualizações mais frequentes
    refetchOnWindowFocus: true,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK - REALTIME SUBSCRIPTION PARA LOGS DE IA
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useAILogsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('ai-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'question_ai_intervention_logs',
        },
        () => {
          // Invalidar queries para forçar refresh
          queryClient.invalidateQueries({ queryKey: ['global-ai-logs-by-question'] });
          queryClient.invalidateQueries({ queryKey: ['global-ai-logs-summary'] });
          queryClient.invalidateQueries({ queryKey: ['questions-ai-logs-summary'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PARA EXPORTAR LOGS DE UMA QUESTÃO ESPECÍFICA COM FORMATO DETALHADO
// ═══════════════════════════════════════════════════════════════════════════════

export function exportQuestionLogsDetailedTxt(question: QuestionWithLogs): string {
  const lines = [
    `╔══════════════════════════════════════════════════════════════════════════════╗`,
    `║           RELATÓRIO DE INTERVENÇÕES DE IA - QUESTÃO INDIVIDUAL               ║`,
    `║           Real-Time Question-Level AI Log Policy v1.0                        ║`,
    `╠══════════════════════════════════════════════════════════════════════════════╣`,
    `║ QUESTION ID: ${question.question_id.padEnd(56)}║`,
    `║ TOTAL DE INTERVENÇÕES: ${String(question.total_interventions).padEnd(46)}║`,
    `║ PRIMEIRA INTERVENÇÃO: ${new Date(question.first_intervention_at).toLocaleString('pt-BR').padEnd(47)}║`,
    `║ ÚLTIMA INTERVENÇÃO: ${new Date(question.last_intervention_at).toLocaleString('pt-BR').padEnd(49)}║`,
    `║ GERADO EM: ${new Date().toLocaleString('pt-BR').padEnd(59)}║`,
    `╚══════════════════════════════════════════════════════════════════════════════╝`,
    ``,
  ];

  // Resumo por tipo
  const typeCounts = question.logs.reduce((acc, log) => {
    acc[log.intervention_type] = (acc[log.intervention_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  lines.push(`═══════════════════════════════════════════════════════════════════════════════`);
  lines.push(`                              RESUMO POR TIPO                                  `);
  lines.push(`═══════════════════════════════════════════════════════════════════════════════`);
  lines.push(``);

  for (const [type, count] of Object.entries(typeCounts)) {
    lines.push(`  • ${INTERVENTION_TYPE_LABELS[type as AIInterventionType] || type}: ${count} intervenção(ões)`);
  }

  lines.push(``);
  lines.push(`═══════════════════════════════════════════════════════════════════════════════`);
  lines.push(`                         DETALHAMENTO CRONOLÓGICO                              `);
  lines.push(`═══════════════════════════════════════════════════════════════════════════════`);
  lines.push(``);

  // Logs detalhados
  question.logs.forEach((log, index) => {
    lines.push(`┌─────────────────────────────────────────────────────────────────────────────┐`);
    lines.push(`│ INTERVENÇÃO #${(index + 1).toString().padStart(3, '0')}                                                           │`);
    lines.push(`├─────────────────────────────────────────────────────────────────────────────┤`);
    lines.push(`│`);
    lines.push(`│ DATA/HORA: ${new Date(log.created_at).toLocaleString('pt-BR')}`);
    lines.push(`│ TIPO: ${log.intervention_type} (${INTERVENTION_TYPE_LABELS[log.intervention_type] || log.intervention_type})`);
    lines.push(`│ CAMPO: ${log.field_affected.toUpperCase()} (${FIELD_LABELS[log.field_affected] || log.field_affected})`);
    lines.push(`│`);
    lines.push(`│ VALOR ANTES:`);
    if (log.value_before) {
      log.value_before.split('\n').forEach(line => {
        lines.push(`│   ${line}`);
      });
    } else {
      lines.push(`│   (null/vazio)`);
    }
    lines.push(`│`);
    lines.push(`│ VALOR DEPOIS:`);
    log.value_after.split('\n').forEach(line => {
      lines.push(`│   ${line}`);
    });
    lines.push(`│`);
    lines.push(`│ MOTIVO: ${log.action_description}`);
    if (log.ai_confidence_score !== null) {
      lines.push(`│ CONFIANÇA IA: ${(log.ai_confidence_score * 100).toFixed(1)}%`);
    }
    if (log.ai_model_used) {
      lines.push(`│ MODELO: ${log.ai_model_used}`);
    }
    if (log.source_file) {
      lines.push(`│ ARQUIVO ORIGEM: ${log.source_file}`);
    }
    lines.push(`│ TIPO FONTE: ${SOURCE_TYPE_LABELS[log.source_type] || log.source_type}`);
    lines.push(`│`);
    lines.push(`└─────────────────────────────────────────────────────────────────────────────┘`);
    lines.push(``);
  });

  lines.push(`═══════════════════════════════════════════════════════════════════════════════`);
  lines.push(`                              FIM DO RELATÓRIO                                 `);
  lines.push(`═══════════════════════════════════════════════════════════════════════════════`);

  return lines.join('\n');
}

export function downloadQuestionLogsDetailedTxt(question: QuestionWithLogs): void {
  const content = exportQuestionLogsDetailedTxt(question);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `ai-log-questao-${question.question_id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PARA EXPORTAR TODOS OS LOGS GLOBAIS AGRUPADOS
// ═══════════════════════════════════════════════════════════════════════════════

export function exportGlobalLogsGroupedTxt(data: GroupedAILogs): string {
  const lines = [
    `╔══════════════════════════════════════════════════════════════════════════════╗`,
    `║           RELATÓRIO GLOBAL DE INTERVENÇÕES DE IA - TODAS AS QUESTÕES         ║`,
    `║           Real-Time Question-Level AI Log Policy v1.0                        ║`,
    `╠══════════════════════════════════════════════════════════════════════════════╣`,
    `║ TOTAL DE INTERVENÇÕES: ${String(data.total_logs).padEnd(46)}║`,
    `║ QUESTÕES AFETADAS: ${String(data.total_questions).padEnd(50)}║`,
    `║ GERADO EM: ${new Date().toLocaleString('pt-BR').padEnd(59)}║`,
    `╚══════════════════════════════════════════════════════════════════════════════╝`,
    ``,
  ];

  for (const question of data.questions) {
    lines.push(`\n`);
    lines.push(`▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓`);
    lines.push(`QUESTÃO: ${question.question_id}`);
    lines.push(`INTERVENÇÕES: ${question.total_interventions}`);
    lines.push(`ÚLTIMA: ${new Date(question.last_intervention_at).toLocaleString('pt-BR')}`);
    lines.push(`▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓`);
    lines.push(``);

    question.logs.forEach((log, index) => {
      lines.push(`  [${index + 1}] ${new Date(log.created_at).toLocaleString('pt-BR')}`);
      lines.push(`      TIPO: ${INTERVENTION_TYPE_LABELS[log.intervention_type] || log.intervention_type}`);
      lines.push(`      CAMPO: ${FIELD_LABELS[log.field_affected] || log.field_affected}`);
      lines.push(`      ANTES: ${log.value_before?.slice(0, 80) || '(null)'}`);
      lines.push(`      DEPOIS: ${log.value_after.slice(0, 80)}`);
      lines.push(`      MOTIVO: ${log.action_description}`);
      lines.push(``);
    });
  }

  lines.push(`\n═══════════════════════════════════════════════════════════════════════════════`);
  lines.push(`                              FIM DO RELATÓRIO GLOBAL                          `);
  lines.push(`═══════════════════════════════════════════════════════════════════════════════`);

  return lines.join('\n');
}

export function downloadGlobalLogsGroupedTxt(data: GroupedAILogs): void {
  const content = exportGlobalLogsGroupedTxt(data);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `ai-log-global-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
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
