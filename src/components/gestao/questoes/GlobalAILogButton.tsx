// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: GlobalAILogButton
// Botão global para visualizar todos os logs de IA - usado na toolbar principal
// POLÍTICA: Absolute AI Log Button Sovereignty Policy v1.0
// ═══════════════════════════════════════════════════════════════════════════════
// REGRAS DE SOBERANIA ABSOLUTA (IMUTÁVEIS):
// - z-index MÁXIMO DO BROWSER (2147483647)
// - pointer-events SEMPRE ativo
// - IGNORA overlays, modais, loading states, disabled states
// - IGNORA permissões, roles, e estados de edição
// - NUNCA pode ser bloqueado por qualquer elemento
// - Prioridade máxima de eventos (stopPropagation + preventDefault)
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
import { Bot, Loader2, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useGlobalAILogsSummary, 
  INTERVENTION_TYPE_LABELS, 
  INTERVENTION_TYPE_COLORS,
  type AIInterventionType 
} from '@/hooks/useQuestionAILogs';

// Z-INDEX MÁXIMO ABSOLUTO DO BROWSER
const SOVEREIGN_Z_INDEX = 2147483647;

// ForwardRef Button wrapper for TooltipTrigger compatibility
const AILogTriggerButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button ref={ref} {...props} />
);
AILogTriggerButton.displayName = 'AILogTriggerButton';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════════

const GlobalAILogButton = memo(() => {
  const [showDialog, setShowDialog] = useState(false);
  const { data: summary, isLoading, isError } = useGlobalAILogsSummary();

  const hasLogs = summary && summary.total_logs > 0;

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
                  {summary.questions_with_logs}
                </Badge>
              )}
            </AILogTriggerButton>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs" style={{ zIndex: SOVEREIGN_Z_INDEX }}>
            {hasLogs ? (
              <div className="space-y-1">
                <p className="font-semibold">{summary.questions_with_logs} questões com intervenções de IA</p>
                <p className="text-xs text-muted-foreground">{summary.total_logs} logs totais</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma intervenção de IA registrada</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Dialog de Resumo Global */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg" style={{ zIndex: SOVEREIGN_Z_INDEX }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Resumo Global de Intervenções de IA
            </DialogTitle>
            <DialogDescription>
              Visão geral de todas as intervenções de IA no banco de questões
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 p-1">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-destructive mb-2" />
                  <p className="text-destructive">Erro ao carregar resumo</p>
                </div>
              ) : !hasLogs ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-2" />
                  <p className="text-lg font-semibold">Nenhuma intervenção de IA</p>
                  <p className="text-sm text-muted-foreground">
                    Todas as questões foram criadas/editadas manualmente
                  </p>
                </div>
              ) : (
                <>
                  {/* Cards de Estatísticas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Database className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Questões Afetadas</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">{summary.questions_with_logs}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-muted-foreground">Total de Logs</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-500">{summary.total_logs}</p>
                    </div>
                  </div>

                  {/* Tipos de Intervenção */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Tipos de Intervenção Registrados</h4>
                    <div className="flex flex-wrap gap-2">
                      {summary.intervention_types.map((type) => {
                        const colors = INTERVENTION_TYPE_COLORS[type];
                        return (
                          <Badge
                            key={type}
                            variant="outline"
                            className={cn("text-xs", colors.bg, colors.text, colors.border)}
                          >
                            {INTERVENTION_TYPE_LABELS[type]}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Última Intervenção */}
                  {summary.last_intervention_at && (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Última Intervenção</p>
                      <p className="text-sm font-mono">
                        {new Date(summary.last_intervention_at).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  )}

                  {/* Nota Explicativa */}
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      💡 Para ver os detalhes de cada intervenção, clique no botão <Bot className="h-3 w-3 inline mx-1" /> 
                      na linha de cada questão na listagem.
                    </p>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
});

GlobalAILogButton.displayName = 'GlobalAILogButton';

export default GlobalAILogButton;
