// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: QuestionAILogButton
// Botão para visualizar logs de IA - usado na listagem e detalhe de questões
// POLÍTICA: Global AI Question Intervention Visibility Policy v1.0
// ═══════════════════════════════════════════════════════════════════════════════

import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import QuestionAILogViewer from './QuestionAILogViewer';
import type { QuestionAILogSummary, AIInterventionType } from '@/hooks/useQuestionAILogs';
import { INTERVENTION_TYPE_LABELS, INTERVENTION_TYPE_COLORS } from '@/hooks/useQuestionAILogs';

// ═══════════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════════

interface QuestionAILogButtonProps {
  questionId: string;
  summary?: QuestionAILogSummary | null;
  isLoading?: boolean;
  variant?: 'icon' | 'full' | 'badge';
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════════

const QuestionAILogButton = memo(({ 
  questionId, 
  summary, 
  isLoading = false,
  variant = 'icon',
  className 
}: QuestionAILogButtonProps) => {
  const [showLogs, setShowLogs] = useState(false);

  // Se não há logs e não está carregando, não mostrar nada
  if (!isLoading && (!summary || summary.log_count === 0)) {
    return null;
  }

  // Renderização durante loading
  if (isLoading) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8 cursor-wait", className)}
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </Button>
    );
  }

  // Tooltip content com resumo dos tipos de intervenção
  const tooltipContent = (
    <div className="space-y-1">
      <p className="font-semibold">AI Interventions: {summary?.log_count || 0}</p>
      {summary?.intervention_types.map(type => {
        const colors = INTERVENTION_TYPE_COLORS[type];
        return (
          <Badge 
            key={type} 
            variant="outline" 
            className={cn("text-[10px] mr-1", colors.bg, colors.text)}
          >
            {INTERVENTION_TYPE_LABELS[type]}
          </Badge>
        );
      })}
    </div>
  );

  // Variante icon (para listagem)
  if (variant === 'icon') {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 relative",
                  "bg-gradient-to-br from-primary/10 to-purple-500/10",
                  "hover:from-primary/20 hover:to-purple-500/20",
                  "border border-primary/30",
                  "text-primary",
                  className
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLogs(true);
                }}
                title="Ver Log de IA"
              >
                <Bot className="h-4 w-4" />
                {/* Badge de contagem */}
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {summary?.log_count || 0}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {tooltipContent}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <QuestionAILogViewer
          questionId={questionId}
          isOpen={showLogs}
          onClose={() => setShowLogs(false)}
        />
      </>
    );
  }

  // Variante full (para página de detalhe)
  if (variant === 'full') {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            "bg-gradient-to-br from-primary/10 to-purple-500/10",
            "hover:from-primary/20 hover:to-purple-500/20",
            "border-primary/30",
            "text-primary",
            className
          )}
          onClick={() => setShowLogs(true)}
        >
          <Bot className="h-4 w-4" />
          AI Log
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {summary?.log_count || 0}
          </Badge>
        </Button>

        <QuestionAILogViewer
          questionId={questionId}
          isOpen={showLogs}
          onClose={() => setShowLogs(false)}
        />
      </>
    );
  }

  // Variante badge (compacto)
  return (
    <>
      <Badge
        variant="outline"
        className={cn(
          "cursor-pointer gap-1",
          "bg-gradient-to-br from-primary/10 to-purple-500/10",
          "hover:from-primary/20 hover:to-purple-500/20",
          "border-primary/30",
          "text-primary",
          className
        )}
        onClick={(e) => {
          e.stopPropagation();
          setShowLogs(true);
        }}
      >
        <Bot className="h-3 w-3" />
        AI: {summary?.log_count}
      </Badge>

      <QuestionAILogViewer
        questionId={questionId}
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
      />
    </>
  );
});

QuestionAILogButton.displayName = 'QuestionAILogButton';

export default QuestionAILogButton;
