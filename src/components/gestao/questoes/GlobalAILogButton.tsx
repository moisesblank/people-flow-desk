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
import { 
  Bot, 
  Loader2, 
  Database, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Clock, 
  FolderTree,
  RefreshCw,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useGlobalAILogsSummary, 
  INTERVENTION_TYPE_LABELS, 
  INTERVENTION_TYPE_COLORS,
  FIELD_LABELS,
  type AIInterventionType 
} from '@/hooks/useQuestionAILogs';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
  const { data: summary, isLoading, isError, refetch } = useGlobalAILogsSummary();
  const queryClient = useQueryClient();

  const hasLogs = summary && summary.total_logs > 0;

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['global-ai-logs-summary'] });
    await refetch();
    toast.success('Relatório atualizado!');
  };

  const handleExportReport = () => {
    if (!summary) return;
    
    const lines = [
      `╔══════════════════════════════════════════════════════════════════════════════╗`,
      `║               RELATÓRIO GLOBAL DE INTERVENÇÕES DE IA                         ║`,
      `║               Global AI Question Intervention Visibility Policy v1.0         ║`,
      `╠══════════════════════════════════════════════════════════════════════════════╣`,
      `║ GERADO EM: ${new Date().toLocaleString('pt-BR').padEnd(58)}║`,
      `╚══════════════════════════════════════════════════════════════════════════════╝`,
      ``,
      `═══════════════════════════════════════════════════════════════════════════════`,
      `                              RESUMO EXECUTIVO                                  `,
      `═══════════════════════════════════════════════════════════════════════════════`,
      ``,
      `  📊 Total de Logs Registrados:      ${summary.total_logs}`,
      `  📁 Questões Afetadas:              ${summary.questions_with_logs}`,
      `  📅 Primeira Intervenção:           ${summary.first_intervention_at ? new Date(summary.first_intervention_at).toLocaleString('pt-BR') : 'N/A'}`,
      `  📅 Última Intervenção:             ${summary.last_intervention_at ? new Date(summary.last_intervention_at).toLocaleString('pt-BR') : 'N/A'}`,
      ``,
      `═══════════════════════════════════════════════════════════════════════════════`,
      `                          DETALHAMENTO POR TIPO DE AÇÃO                        `,
      `═══════════════════════════════════════════════════════════════════════════════`,
      ``,
    ];

    for (const typeBreakdown of summary.type_breakdown) {
      lines.push(`  ┌─────────────────────────────────────────────────────────────────────────────┐`);
      lines.push(`  │ ${INTERVENTION_TYPE_LABELS[typeBreakdown.type] || typeBreakdown.type}`);
      lines.push(`  │ Total: ${typeBreakdown.count} intervenções`);
      lines.push(`  │`);
      lines.push(`  │ Campos afetados:`);
      for (const field of typeBreakdown.fields) {
        const fieldLabel = FIELD_LABELS[field.field] || field.field;
        lines.push(`  │   • ${fieldLabel}: ${field.count}x`);
      }
      lines.push(`  └─────────────────────────────────────────────────────────────────────────────┘`);
      lines.push(``);
    }

    lines.push(`═══════════════════════════════════════════════════════════════════════════════`);
    lines.push(`                          DETALHAMENTO POR CAMPO AFETADO                      `);
    lines.push(`═══════════════════════════════════════════════════════════════════════════════`);
    lines.push(``);

    for (const field of summary.field_breakdown) {
      const fieldLabel = FIELD_LABELS[field.field] || field.field;
      const bar = '█'.repeat(Math.min(Math.ceil(field.count / 5), 40));
      lines.push(`  ${fieldLabel.padEnd(25)} ${String(field.count).padStart(5)}x  ${bar}`);
    }

    lines.push(``);
    lines.push(`═══════════════════════════════════════════════════════════════════════════════`);
    lines.push(`                              ARQUIVOS DE ORIGEM                              `);
    lines.push(`═══════════════════════════════════════════════════════════════════════════════`);
    lines.push(``);

    for (const file of summary.source_files) {
      lines.push(`  📄 ${file}`);
    }

    if (summary.source_files.length === 0) {
      lines.push(`  (Nenhum arquivo de origem registrado)`);
    }

    lines.push(``);
    lines.push(`═══════════════════════════════════════════════════════════════════════════════`);
    lines.push(`                              FIM DO RELATÓRIO                                `);
    lines.push(`═══════════════════════════════════════════════════════════════════════════════`);

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-ia-global-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    toast.success('Relatório exportado!');
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
                  {summary.total_logs}
                </Badge>
              )}
            </AILogTriggerButton>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs" style={{ zIndex: SOVEREIGN_Z_INDEX }}>
            {hasLogs ? (
              <div className="space-y-1">
                <p className="font-semibold">{summary.total_logs} intervenções de IA registradas</p>
                <p className="text-xs text-muted-foreground">{summary.questions_with_logs} questões afetadas</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma intervenção de IA registrada</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Dialog de Resumo Global Detalhado */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]" style={{ zIndex: SOVEREIGN_Z_INDEX }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Relatório Global de Intervenções de IA
            </DialogTitle>
            <DialogDescription>
              Visão detalhada de todas as ações automáticas da IA no banco de questões
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportReport}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar TXT
              </Button>
            )}
          </div>

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
                  {/* Cards de Estatísticas Principais */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">Total de Logs</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">{summary.total_logs}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Database className="h-4 w-4 text-purple-500" />
                        <span className="text-xs text-muted-foreground">Questões</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-500">{summary.questions_with_logs}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <FolderTree className="h-4 w-4 text-cyan-500" />
                        <span className="text-xs text-muted-foreground">Tipos</span>
                      </div>
                      <p className="text-2xl font-bold text-cyan-500">{summary.intervention_types.length}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-amber-500" />
                        <span className="text-xs text-muted-foreground">Arquivos</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-500">{summary.source_files.length}</p>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Primeira Intervenção</span>
                      </div>
                      <p className="text-sm font-mono">
                        {summary.first_intervention_at 
                          ? new Date(summary.first_intervention_at).toLocaleString('pt-BR')
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Última Intervenção</span>
                      </div>
                      <p className="text-sm font-mono">
                        {summary.last_intervention_at 
                          ? new Date(summary.last_intervention_at).toLocaleString('pt-BR')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Detalhamento por Tipo de Ação */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Detalhamento por Tipo de Ação
                    </h4>
                    <div className="space-y-3">
                      {summary.type_breakdown.map((typeBreakdown) => {
                        const colors = INTERVENTION_TYPE_COLORS[typeBreakdown.type];
                        return (
                          <div 
                            key={typeBreakdown.type}
                            className={cn(
                              "p-3 rounded-lg border",
                              colors.bg,
                              colors.border
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={cn("font-semibold text-sm", colors.text)}>
                                {INTERVENTION_TYPE_LABELS[typeBreakdown.type]}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", colors.bg, colors.text, colors.border)}
                              >
                                {typeBreakdown.count}x
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {typeBreakdown.fields.map((field) => (
                                <Badge 
                                  key={field.field}
                                  variant="secondary"
                                  className="text-xs bg-background/50"
                                >
                                  {FIELD_LABELS[field.field] || field.field}: {field.count}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detalhamento por Campo */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <FolderTree className="h-4 w-4" />
                      Resumo por Campo Afetado
                    </h4>
                    <div className="space-y-2">
                      {summary.field_breakdown.map((field) => {
                        const maxCount = summary.field_breakdown[0]?.count || 1;
                        const percentage = (field.count / maxCount) * 100;
                        return (
                          <div key={field.field} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">
                                {FIELD_LABELS[field.field] || field.field}
                              </span>
                              <span className="text-muted-foreground font-mono">
                                {field.count}x
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Arquivos de Origem */}
                  {summary.source_files.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Arquivos de Origem
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {summary.source_files.map((file) => (
                          <Badge 
                            key={file}
                            variant="outline"
                            className="text-xs bg-muted/50"
                          >
                            📄 {file}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nota Explicativa */}
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      ✅ Este relatório mostra TODAS as ações que a IA executou automaticamente durante importações.
                      Cada intervenção é rastreável e auditável.
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