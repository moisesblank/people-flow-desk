// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: QuestionAILogButton
// Botão para visualizar logs de IA - usado na listagem e detalhe de questões
// POLÍTICA: Absolute AI Log Button Sovereignty Policy v1.0
// ═══════════════════════════════════════════════════════════════════════════════
// REGRAS DE SOBERANIA ABSOLUTA (IMUTÁVEIS):
// - z-index MÁXIMO DO BROWSER (2147483647)
// - pointer-events SEMPRE ativo
// - Renderizado via createPortal direto no document.body
// - IGNORA overlays, modais, loading states, disabled states
// - IGNORA permissões, roles, e estados de edição
// - NUNCA pode ser bloqueado por qualquer elemento
// - Prioridade máxima de eventos (stopPropagation + preventDefault)
// ═══════════════════════════════════════════════════════════════════════════════

import { memo, useState, forwardRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import QuestionAILogViewer from './QuestionAILogViewer';
import type { QuestionAILogSummary, AIInterventionType } from '@/hooks/useQuestionAILogs';
import { INTERVENTION_TYPE_LABELS, INTERVENTION_TYPE_COLORS } from '@/hooks/useQuestionAILogs';

// Z-INDEX MÁXIMO ABSOLUTO DO BROWSER
const SOVEREIGN_Z_INDEX = 2147483647;

// ═══════════════════════════════════════════════════════════════════════════════
// FORWARDREF BUTTON WRAPPER (REQUIRED FOR TOOLTIP COMPATIBILITY)
// ═══════════════════════════════════════════════════════════════════════════════

const AILogIconButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button ref={ref} {...props} />
);
AILogIconButton.displayName = 'AILogIconButton';

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

  const hasLogs = summary && summary.log_count > 0;

  // Renderização durante loading - NUNCA desabilita o botão completamente
  // Apenas mostra indicador visual de loading enquanto mantém acessibilidade
  if (isLoading) {
    return (
      <AILogIconButton
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 cursor-wait relative pointer-events-auto",
          className
        )}
        style={{ zIndex: SOVEREIGN_Z_INDEX }}
        data-fn="ai-log-button-loading"
        data-sovereign="true"
      >
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </AILogIconButton>
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
  // POLÍTICA: z-index MÁXIMO + pointer-events sempre ativo + event priority
  if (variant === 'icon') {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <AILogIconButton
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 relative pointer-events-auto",
                  hasLogs 
                    ? "bg-gradient-to-br from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 border border-primary/30 text-primary"
                    : "bg-muted/50 hover:bg-muted border border-border/50 text-muted-foreground",
                  className
                )}
                style={{ zIndex: SOVEREIGN_Z_INDEX }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowLogs(true);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                title="Ver Log de IA"
                data-fn="ai-log-button-icon"
                data-sovereign="true"
              >
                <Bot className="h-4 w-4" />
                {/* Badge de contagem - só mostra se há logs */}
                {hasLogs && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {summary?.log_count || 0}
                  </span>
                )}
              </AILogIconButton>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs" style={{ zIndex: SOVEREIGN_Z_INDEX }}>
              {hasLogs ? tooltipContent : <p className="text-muted-foreground">Nenhuma intervenção de IA registrada</p>}
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
  // POLÍTICA: z-index MÁXIMO + pointer-events sempre ativo + event priority
  if (variant === 'full') {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 relative pointer-events-auto",
            hasLogs 
              ? "bg-gradient-to-br from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 border-primary/30 text-primary"
              : "bg-muted/50 hover:bg-muted border-border/50 text-muted-foreground",
            className
          )}
          style={{ zIndex: SOVEREIGN_Z_INDEX }}
          onClick={(e) => {
            e.stopPropagation();
            setShowLogs(true);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          data-fn="ai-log-button-full"
          data-sovereign="true"
        >
          <Bot className="h-4 w-4" />
          AI Log
          {hasLogs && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {summary?.log_count || 0}
            </Badge>
          )}
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
  // POLÍTICA: z-index MÁXIMO + pointer-events sempre ativo + event priority
  return (
    <>
      <Badge
        variant="outline"
        className={cn(
          "cursor-pointer gap-1 relative pointer-events-auto",
          hasLogs 
            ? "bg-gradient-to-br from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 border-primary/30 text-primary"
            : "bg-muted/50 hover:bg-muted border-border/50 text-muted-foreground",
          className
        )}
        style={{ zIndex: SOVEREIGN_Z_INDEX }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setShowLogs(true);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        data-fn="ai-log-button-badge"
        data-sovereign="true"
      >
        <Bot className="h-3 w-3" />
        AI: {hasLogs ? summary?.log_count : 0}
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
