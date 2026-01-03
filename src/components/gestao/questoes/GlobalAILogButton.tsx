// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: GlobalAILogButton
// Botão global para visualizar todos os logs de IA - REDESENHADO
// POLÍTICA: Real-Time Question-Level AI Log Policy v1.0
// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONALIDADES:
// - Lista de questões afetadas em tempo real
// - Visualização detalhada por questão com BEFORE/AFTER
// - Atualizações via Realtime do Supabase
// - Exportação TXT por questão e global
// ═══════════════════════════════════════════════════════════════════════════════

import { memo, useState, forwardRef } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Bot, 
  Loader2, 
  Database, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Download,
  ChevronRight,
  ArrowRight,
  Wand2,
  Plus,
  PenLine,
  FolderTree,
  FileText,
  Sparkles,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useGlobalAILogsGroupedByQuestion,
  useAILogsRealtime,
  INTERVENTION_TYPE_LABELS, 
  INTERVENTION_TYPE_COLORS,
  FIELD_LABELS,
  SOURCE_TYPE_LABELS,
  type AIInterventionType,
  type QuestionWithLogs,
  type QuestionAILog,
  downloadQuestionLogsDetailedTxt,
  downloadGlobalLogsGroupedTxt,
} from '@/hooks/useQuestionAILogs';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Z-INDEX MÁXIMO ABSOLUTO DO BROWSER
const SOVEREIGN_Z_INDEX = 2147483647;

// ForwardRef Button wrapper for TooltipTrigger compatibility
const AILogTriggerButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button ref={ref} {...props} />
);
AILogTriggerButton.displayName = 'AILogTriggerButton';

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
// COMPONENTE DE LOG INDIVIDUAL (DETALHADO)
// ═══════════════════════════════════════════════════════════════════════════════

const DetailedLogEntry = memo(({ log, index }: { log: QuestionAILog; index: number }) => {
  const date = new Date(log.created_at);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const typeColors = INTERVENTION_TYPE_COLORS[log.intervention_type] || INTERVENTION_TYPE_COLORS.AI_AUTOFILL;
  const confidencePercent = log.ai_confidence_score !== null 
    ? Math.round(log.ai_confidence_score * 100) 
    : null;

  const getConfidenceColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
    >
      {/* Header com timestamp */}
      <div className="font-mono text-xs text-muted-foreground mb-3 bg-background/50 px-2 py-1 rounded">
        [{format(date, "yyyy-MM-dd")} | {format(date, "HH:mm:ss")} - {timezone}]
      </div>

      {/* Tipo de ação */}
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
          → {INTERVENTION_TYPE_LABELS[log.intervention_type] || log.intervention_type}
        </p>
      </div>

      {/* Campo afetado */}
      <div className="mb-3">
        <Badge variant="outline" className="font-mono text-xs">
          FIELD: {log.field_affected.toUpperCase()}
        </Badge>
        <span className="text-xs text-muted-foreground ml-2">
          ({FIELD_LABELS[log.field_affected] || log.field_affected})
        </span>
      </div>

      {/* BEFORE / AFTER */}
      <div className="grid grid-cols-1 gap-2 mb-3">
        <div className="p-3 rounded bg-destructive/10 border border-destructive/20">
          <p className="text-xs font-semibold text-muted-foreground mb-1">BEFORE:</p>
          <pre className="text-sm font-mono text-destructive-foreground whitespace-pre-wrap break-words max-h-24 overflow-auto">
            {log.value_before || <span className="italic text-muted-foreground">(null)</span>}
          </pre>
        </div>
        
        <div className="flex items-center justify-center">
          <ArrowRight className="h-4 w-4 text-primary rotate-90" />
        </div>
        
        <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs font-semibold text-muted-foreground mb-1">AFTER:</p>
          <pre className="text-sm font-mono text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap break-words max-h-24 overflow-auto">
            "{log.value_after}"
          </pre>
        </div>
      </div>

      {/* Motivo */}
      <div className="mb-3 p-2 rounded bg-background/50">
        <p className="text-xs font-semibold text-muted-foreground mb-1">REASON:</p>
        <p className="text-sm text-foreground/90">
          {log.action_description}
        </p>
      </div>

      {/* Metadados */}
      <div className="flex items-center gap-4 flex-wrap text-xs">
        {confidencePercent !== null && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">CONFIDENCE:</span>
            <Badge 
              variant="outline" 
              className={cn("text-xs font-mono", getConfidenceColor(confidencePercent))}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {(log.ai_confidence_score ?? 0).toFixed(2)}
            </Badge>
          </div>
        )}
        {log.ai_model_used && (
          <span className="text-muted-foreground">
            <Bot className="h-3 w-3 inline mr-1" />
            {log.ai_model_used}
          </span>
        )}
        {log.source_file && (
          <span className="text-muted-foreground">
            <FileText className="h-3 w-3 inline mr-1" />
            {log.source_file}
          </span>
        )}
        <span className="text-muted-foreground">
          {SOURCE_TYPE_LABELS[log.source_type] || log.source_type}
        </span>
      </div>
    </motion.div>
  );
});

DetailedLogEntry.displayName = 'DetailedLogEntry';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE QUESTÃO EXPANDÍVEL
// ═══════════════════════════════════════════════════════════════════════════════

const QuestionLogCard = memo(({ 
  question, 
  isExpanded,
  onToggle 
}: { 
  question: QuestionWithLogs;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const handleExportQuestion = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadQuestionLogsDetailedTxt(question);
    toast.success(`Logs da questão exportados!`);
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="border border-border/50 rounded-lg overflow-hidden bg-card/50">
        {/* Header da questão - sempre visível */}
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors flex items-center gap-3">
            <ChevronRight className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              isExpanded && "rotate-90"
            )} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="font-mono text-xs shrink-0">
                  {question.question_id.slice(0, 8)}...
                </Badge>
                <Badge variant="secondary" className="shrink-0">
                  {question.total_interventions} intervenção{question.total_interventions !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              {/* Tipos de intervenção */}
              <div className="flex flex-wrap gap-1 mt-2">
                {question.intervention_types.slice(0, 3).map((type) => {
                  const colors = INTERVENTION_TYPE_COLORS[type] || INTERVENTION_TYPE_COLORS.AI_AUTOFILL;
                  return (
                    <Badge 
                      key={type}
                      variant="outline" 
                      className={cn("text-xs gap-1", colors.bg, colors.text)}
                    >
                      <InterventionTypeIcon type={type} />
                      {INTERVENTION_TYPE_LABELS[type]?.split(' ')[0] || type}
                    </Badge>
                  );
                })}
                {question.intervention_types.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{question.intervention_types.length - 3}
                  </Badge>
                )}
              </div>

              {/* Timestamp da última intervenção */}
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Última: {new Date(question.last_intervention_at).toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Botão de exportar */}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={handleExportQuestion}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CollapsibleTrigger>

        {/* Conteúdo expandido - logs detalhados */}
        <CollapsibleContent>
          <Separator />
          <div className="p-4 space-y-3 bg-muted/10 max-h-[500px] overflow-auto">
            {question.logs.map((log, index) => (
              <DetailedLogEntry key={log.id} log={log} index={index} />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

QuestionLogCard.displayName = 'QuestionLogCard';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

const GlobalAILogButton = memo(() => {
  const [showDialog, setShowDialog] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  
  const { data, isLoading, isError, refetch } = useGlobalAILogsGroupedByQuestion();
  const queryClient = useQueryClient();
  
  // Ativar realtime subscription
  useAILogsRealtime();

  const hasLogs = data && data.total_logs > 0;

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['global-ai-logs-by-question'] });
    await refetch();
    toast.success('Logs atualizados em tempo real!');
  };

  const handleExportGlobal = () => {
    if (!data) return;
    downloadGlobalLogsGroupedTxt(data);
    toast.success('Relatório global exportado!');
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (data) {
      setExpandedQuestions(new Set(data.questions.map(q => q.question_id)));
    }
  };

  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <AILogTriggerButton
              variant="outline"
              size="sm"
              className={cn(
                "gap-2 relative pointer-events-auto",
                hasLogs 
                  ? "bg-gradient-to-br from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 border-primary/30 text-primary"
                  : "bg-muted/50 hover:bg-muted border-border/50 text-muted-foreground"
              )}
              style={{ zIndex: SOVEREIGN_Z_INDEX }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowDialog(true);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              data-fn="global-ai-log-button"
              data-sovereign="true"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
              AI Log Global
              {hasLogs && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-primary/20 text-primary">
                  {data.total_logs}
                </Badge>
              )}
            </AILogTriggerButton>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs" style={{ zIndex: SOVEREIGN_Z_INDEX }}>
            {hasLogs ? (
              <div className="space-y-1">
                <p className="font-semibold">{data.total_logs} intervenções de IA registradas</p>
                <p className="text-xs text-muted-foreground">{data.total_questions} questões afetadas • Tempo real ativo</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma intervenção de IA registrada</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Modal de visualização */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent 
          showMaximize={true}
          defaultSize={{ width: 800, height: 700 }}
          minSize={{ width: 500, height: 400 }}
          className="flex flex-col"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              Auditoria de IA em Tempo Real
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" />
              Real-Time Question-Level AI Log Policy v1.0 • Logs imutáveis por questão
            </DialogDescription>
          </DialogHeader>

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Atualizar
            </Button>
            
            {hasLogs && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportGlobal}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Tudo
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="ghost" size="sm" onClick={expandAll}>
                  Expandir Todas
                </Button>
                <Button variant="ghost" size="sm" onClick={collapseAll}>
                  Colapsar Todas
                </Button>
              </>
            )}
          </div>

          {/* Stats resumidos */}
          {hasLogs && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total de Intervenções</span>
                </div>
                <p className="text-2xl font-bold text-primary">{data.total_logs}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="h-4 w-4 text-purple-500" />
                  <span className="text-xs text-muted-foreground">Questões Afetadas</span>
                </div>
                <p className="text-2xl font-bold text-purple-500">{data.total_questions}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Lista de questões */}
          <ScrollArea className="flex-1 min-h-0 pr-2">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center p-12"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </motion.div>
              ) : isError ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center p-12 text-center"
                >
                  <AlertCircle className="h-12 w-12 text-destructive mb-2" />
                  <p className="text-destructive">Erro ao carregar logs</p>
                </motion.div>
              ) : !hasLogs ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center p-12 text-center"
                >
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-2" />
                  <p className="text-lg font-semibold">Nenhuma intervenção de IA</p>
                  <p className="text-sm text-muted-foreground">
                    Todas as questões foram criadas/editadas manualmente
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 py-2"
                >
                  {data.questions.map((question) => (
                    <QuestionLogCard
                      key={question.question_id}
                      question={question}
                      isExpanded={expandedQuestions.has(question.question_id)}
                      onToggle={() => toggleQuestion(question.question_id)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
});

GlobalAILogButton.displayName = 'GlobalAILogButton';

export default GlobalAILogButton;
