// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: QuestionAILogViewer
// Modal para visualizar logs de intervenção de IA em questões
// POLÍTICA: Question AI Log Mandatory Human-Readable Audit v2.0
// READ-ONLY - Logs são IMUTÁVEIS
// ═══════════════════════════════════════════════════════════════════════════════

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bot,
  Download,
  FileText,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Loader2,
  Shield,
  Wand2,
  Plus,
  PenLine,
  CheckCircle2,
  FolderTree,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';
import {
  useQuestionAILogs,
  QuestionAILog,
  FIELD_LABELS,
  SOURCE_TYPE_LABELS,
  INTERVENTION_TYPE_LABELS,
  INTERVENTION_TYPE_COLORS,
  AIInterventionType,
  downloadLogsAsTxt,
} from '@/hooks/useQuestionAILogs';
import { cleanQuestionText } from '@/components/shared/QuestionEnunciado';
import {
  normalizeBeforeValue,
  normalizeAfterValue,
  mapInterventionToActionType,
  getActionTypeDescription,
  extractEnunciadoSnippet,
  isValidAILog,
} from '@/lib/audits/AUDIT_AI_LOG_POLICY_v2';
import { formatError } from '@/lib/utils/formatError';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════════

interface QuestionAILogViewerProps {
  questionId: string;
  isOpen: boolean;
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÍCONE POR TIPO DE INTERVENÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

const InterventionTypeIcon = ({ type }: { type: AIInterventionType }) => {
  const iconClass = "h-4 w-4";
  switch (type) {
    case 'AI_AUTOFILL': return <Wand2 className={iconClass} />;
    case 'AI_ADDITION': return <Plus className={iconClass} />;
    case 'AI_CORRECTION': return <PenLine className={iconClass} />;
    case 'AI_SUGGESTION_APPLIED': return <CheckCircle2 className={iconClass} />;
    case 'AI_CLASSIFICATION_INFERENCE': return <FolderTree className={iconClass} />;
    default: return <Bot className={iconClass} />;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE LOG INDIVIDUAL
// POLÍTICA v2.0: BEFORE/AFTER nunca vazios, campos obrigatórios
// ═══════════════════════════════════════════════════════════════════════════════

interface LogEntryProps {
  log: QuestionAILog;
  index: number;
  enunciadoSnippet?: string;
}

const LogEntry = memo(({ log, index, enunciadoSnippet }: LogEntryProps) => {
  // ═══════════════════════════════════════════════════════════════════════════
  // POLÍTICA v2.1: Logs sem valor real no AFTER são INVÁLIDOS e não renderizam
  // ═══════════════════════════════════════════════════════════════════════════
  if (!isValidAILog(log.value_after)) {
    return null; // Log inválido - não exibir
  }

  const date = new Date(log.created_at);
  const confidencePercent = log.ai_confidence_score !== null 
    ? Math.round(log.ai_confidence_score * 100) 
    : null;

  // POLÍTICA v2.0: BEFORE/AFTER
  const normalizedBefore = normalizeBeforeValue(log.value_before);
  const normalizedAfter = normalizeAfterValue(log.value_after) || log.value_after;
  
  // POLÍTICA v2.0: Mapear tipo de intervenção para categoria humana
  const actionType = mapInterventionToActionType(log.intervention_type);
  const actionDescription = getActionTypeDescription(actionType);

  const getConfidenceColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const typeColors = INTERVENTION_TYPE_COLORS[log.intervention_type] || INTERVENTION_TYPE_COLORS.AI_AUTOFILL;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      {/* Timeline dot */}
      <div className={cn(
        "absolute left-0 top-4 w-3 h-3 rounded-full border-2 border-background z-10",
        typeColors.bg.replace('/20', '')
      )} />
      
      {/* Timeline line */}
      {index > 0 && (
        <div className="absolute left-[5px] bottom-full h-4 w-0.5 bg-primary/30" />
      )}

      <div className="ml-6 p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors">
        {/* POLÍTICA v2.0: Enunciado snippet no TOPO */}
        {enunciadoSnippet && (
          <div className="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-2">
              <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary mb-1">QUESTÃO (Enunciado):</p>
                <p className="text-sm text-foreground/90 line-clamp-2">
                  {enunciadoSnippet}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timestamp Header - Formato solicitado */}
        <div className="font-mono text-xs text-muted-foreground mb-3 bg-background/50 px-2 py-1 rounded flex items-center justify-between">
          <span>[{format(date, "yyyy-MM-dd")} | {format(date, "HH:mm:ss")} - {timezone}]</span>
          <Badge variant="outline" className="text-xs font-mono ml-2">
            {actionType}
          </Badge>
        </div>

        {/* TYPE OF ACTION - Destacado */}
        <div className="mb-3">
          <Badge 
            className={cn(
              "gap-1.5 font-semibold",
              typeColors.bg, typeColors.text, typeColors.border
            )}
          >
            <InterventionTypeIcon type={log.intervention_type} />
            {log.intervention_type}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1 ml-1">
            → {actionDescription}
          </p>
        </div>

        {/* FIELD AFFECTED */}
        <div className="mb-3">
          <Badge variant="outline" className="font-mono text-xs">
            FIELD: {log.field_affected.toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground ml-2">
            ({FIELD_LABELS[log.field_affected] || log.field_affected})
          </span>
        </div>

        {/* BEFORE / AFTER - POLÍTICA v2.0: NUNCA VAZIOS */}
        <div className="grid grid-cols-1 gap-2 mb-3">
          <div className="p-3 rounded bg-destructive/10 border border-destructive/20">
            <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <span className="font-mono">BEFORE:</span>
              {log.value_before === null && (
                <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground">
                  fallback
                </Badge>
              )}
            </p>
            <pre className="text-sm font-mono text-destructive-foreground whitespace-pre-wrap break-words max-h-32 overflow-auto">
              {normalizedBefore}
            </pre>
          </div>
          
          <div className="flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-primary rotate-90" />
          </div>
          
          <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <span className="font-mono">AFTER:</span>
              {!log.value_after && (
                <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground">
                  fallback
                </Badge>
              )}
            </p>
            <pre className="text-sm font-mono text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap break-words max-h-32 overflow-auto">
              {normalizedAfter}
            </pre>
          </div>
        </div>

        {/* REASON - POLÍTICA v2.0: Campo obrigatório */}
        <div className="mb-3 p-2 rounded bg-background/50 border border-border/30">
          <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
            <span className="font-mono">REASON:</span>
            {!log.action_description && (
              <AlertTriangle className="h-3 w-3 text-amber-500" />
            )}
          </p>
          <p className="text-sm text-foreground/90">
            {log.action_description || 'Motivo não especificado (log legado)'}
          </p>
        </div>

        {/* AI CONFIDENCE */}
        <div className="flex items-center gap-4 flex-wrap">
          {confidencePercent !== null && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground font-mono">CONFIDENCE:</span>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs font-mono",
                  getConfidenceColor(confidencePercent)
                )}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {(log.ai_confidence_score ?? 0).toFixed(2)}
              </Badge>
            </div>
          )}

          {log.ai_model_used && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Bot className="h-3 w-3" />
              MODEL: {log.ai_model_used}
            </div>
          )}

          {log.source_file && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              SOURCE FILE: {log.source_file}
            </div>
          )}
        </div>

        {/* Source Type */}
        <div className="mt-2 text-xs text-muted-foreground">
          SOURCE TYPE: {SOURCE_TYPE_LABELS[log.source_type] || log.source_type}
        </div>
      </div>
    </motion.div>
  );
});

LogEntry.displayName = 'LogEntry';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// POLÍTICA v2.0: Buscar enunciado real da questão
// ═══════════════════════════════════════════════════════════════════════════════

const QuestionAILogViewer = memo(function QuestionAILogViewer({ questionId, isOpen, onClose }: QuestionAILogViewerProps) {
  const { data: logs = [], isLoading, error } = useQuestionAILogs(questionId);
  const [enunciadoSnippet, setEnunciadoSnippet] = useState<string>('');

  // POLÍTICA v2.0: Buscar enunciado real da questão
  useEffect(() => {
    if (!questionId || !isOpen) return;
    
    const fetchEnunciado = async () => {
      const { data } = await supabase
        .from('quiz_questions')
        .select('question_text')
        .eq('id', questionId)
        .single();
      
      if (data?.question_text) {
        setEnunciadoSnippet(extractEnunciadoSnippet(cleanQuestionText(data.question_text), 300));
      }
    };
    
    fetchEnunciado();
  }, [questionId, isOpen]);

  const handleDownload = () => {
    downloadLogsAsTxt(logs, questionId);
  };

  // Resumo por tipo de intervenção
  const typeSummary = logs.reduce((acc, log) => {
    acc[log.intervention_type] = (acc[log.intervention_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        showMaximize={true}
        defaultSize={{ width: 700, height: 600 }}
        minSize={{ width: 400, height: 300 }}
        className="flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            AI Intervention Log
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-500" />
            Question AI Log Mandatory Human-Readable Audit v2.0
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* POLÍTICA v2.0: Enunciado snippet no topo */}
        {enunciadoSnippet && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-2">
              <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary mb-1">QUESTÃO (Enunciado):</p>
                <p className="text-sm text-foreground/90 line-clamp-3">
                  {enunciadoSnippet}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats header */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-xs">
              ID: {questionId.slice(0, 8)}...
            </Badge>
            <Badge variant="secondary">
              {logs.length} intervention{logs.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export TXT
          </Button>
        </div>

        {/* Resumo por tipo */}
        {logs.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {Object.entries(typeSummary).map(([type, count]) => {
              const colors = INTERVENTION_TYPE_COLORS[type as AIInterventionType] || INTERVENTION_TYPE_COLORS.AI_AUTOFILL;
              return (
                <Badge 
                  key={type} 
                  variant="outline" 
                  className={cn("text-xs gap-1", colors.bg, colors.text)}
                >
                  <InterventionTypeIcon type={type as AIInterventionType} />
                  {INTERVENTION_TYPE_LABELS[type as AIInterventionType] || type}: {count}
                </Badge>
              );
            })}
          </div>
        )}

        <Separator />

        {/* Content */}
        <ScrollArea className="flex-1 pr-4">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading logs...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-destructive font-medium">Error loading logs</p>
                <p className="text-muted-foreground text-sm">{formatError(error)}</p>
              </motion.div>
            ) : logs.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground font-medium">
                  No AI interventions recorded
                </p>
                <p className="text-muted-foreground/70 text-sm text-center max-w-md mt-2">
                  When AI infers or corrects fields on this question, 
                  all records will appear here with full traceability.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="logs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 py-2"
              >
                {logs.map((log, index) => (
                  <LogEntry 
                    key={log.id} 
                    log={log} 
                    index={index}
                    enunciadoSnippet={enunciadoSnippet}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
});

QuestionAILogViewer.displayName = 'QuestionAILogViewer';

export default QuestionAILogViewer;
