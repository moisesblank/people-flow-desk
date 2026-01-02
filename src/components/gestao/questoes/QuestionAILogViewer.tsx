// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: QuestionAILogViewer
// Modal para visualizar logs de intervenção de IA em questões
// POLÍTICA: Question AI Intervention Audit Policy v1.0
// READ-ONLY - Logs são IMUTÁVEIS
// ═══════════════════════════════════════════════════════════════════════════════

import { memo } from 'react';
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
} from 'lucide-react';
import {
  useQuestionAILogs,
  QuestionAILog,
  FIELD_LABELS,
  SOURCE_TYPE_LABELS,
  downloadLogsAsTxt,
} from '@/hooks/useQuestionAILogs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
// COMPONENTE DE LOG INDIVIDUAL
// ═══════════════════════════════════════════════════════════════════════════════

const LogEntry = memo(({ log, index }: { log: QuestionAILog; index: number }) => {
  const date = new Date(log.created_at);
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      {/* Timeline dot */}
      <div className="absolute left-0 top-4 w-3 h-3 rounded-full bg-primary border-2 border-background z-10" />
      
      {/* Timeline line */}
      {index > 0 && (
        <div className="absolute left-[5px] bottom-full h-4 w-0.5 bg-primary/30" />
      )}

      <div className="ml-6 p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="outline" className="font-mono text-xs">
            #{index + 1}
          </Badge>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {FIELD_LABELS[log.field_affected] || log.field_affected}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {SOURCE_TYPE_LABELS[log.source_type] || log.source_type}
          </Badge>
          
          {confidencePercent !== null && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-mono",
                getConfidenceColor(confidencePercent)
              )}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {confidencePercent}% confiança
            </Badge>
          )}
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(date, "dd/MM/yyyy", { locale: ptBR })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(date, "HH:mm:ss")}
          </span>
          {log.source_file && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {log.source_file}
            </span>
          )}
        </div>

        {/* Value changes */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-3">
          <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-muted-foreground mb-1">Antes:</p>
            <p className="text-sm font-mono text-destructive-foreground break-words">
              {log.value_before || <span className="italic text-muted-foreground">(vazio)</span>}
            </p>
          </div>
          
          <ArrowRight className="h-4 w-4 text-primary" />
          
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-muted-foreground mb-1">Depois:</p>
            <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 break-words">
              {log.value_after}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground/80">
          {log.action_description}
        </p>

        {/* Model info */}
        {log.ai_model_used && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Bot className="h-3 w-3" />
            Modelo: {log.ai_model_used}
          </p>
        )}
      </div>
    </motion.div>
  );
});

LogEntry.displayName = 'LogEntry';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

const QuestionAILogViewer = memo(({ questionId, isOpen, onClose }: QuestionAILogViewerProps) => {
  const { data: logs = [], isLoading, error } = useQuestionAILogs(questionId);

  const handleDownload = () => {
    downloadLogsAsTxt(logs, questionId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            Log de Intervenções de IA
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-500" />
            Registro permanente e imutável • Policy v1.0
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Stats header */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              ID: {questionId.slice(0, 8)}...
            </Badge>
            <Badge variant="secondary">
              {logs.length} intervenção{logs.length !== 1 ? 'ões' : ''}
            </Badge>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar TXT
          </Button>
        </div>

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
                <p className="text-muted-foreground">Carregando logs...</p>
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
                <p className="text-destructive font-medium">Erro ao carregar logs</p>
                <p className="text-muted-foreground text-sm">{String(error)}</p>
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
                  Nenhuma intervenção de IA registrada
                </p>
                <p className="text-muted-foreground/70 text-sm text-center max-w-md mt-2">
                  Quando a IA inferir ou corrigir campos desta questão, 
                  os registros aparecerão aqui.
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
                  <LogEntry key={log.id} log={log} index={index} />
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
