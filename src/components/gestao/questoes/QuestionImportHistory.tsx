// ============================================
// 📜 HISTÓRICO DE IMPORTAÇÕES DE QUESTÕES
// Visualização completa de todas as importações
// COM ANIQUILAÇÃO DE LOTES
// ============================================

import { memo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Tag,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
  AlertOctagon,
  Target,
  Trash2,
  Skull,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useImportBatchAnnihilation } from '@/hooks/useImportBatchAnnihilation';
import { toast } from 'sonner';

interface ImportHistoryRecord {
  id: string;
  created_at: string;
  imported_by: string | null;
  file_names: string[];
  total_files: number;
  total_questions: number;
  imported_count: number;
  failed_count: number;
  target_group: string;
  campos_inferidos: string[];
  campos_null: string[];
  duration_ms: number | null;
  status: string;
}

interface QuestionImportHistoryProps {
  open: boolean;
  onClose: () => void;
}

export const QuestionImportHistory = memo(function QuestionImportHistory({
  open,
  onClose,
}: QuestionImportHistoryProps) {
  const [history, setHistory] = useState<ImportHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Estado de aniquilação
  const [annihilateTarget, setAnnihilateTarget] = useState<ImportHistoryRecord | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const { annihilateBatch, isAnnihilating } = useImportBatchAnnihilation();

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('question_import_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnnihilate = useCallback(async () => {
    if (!annihilateTarget || confirmText !== 'EXCLUIR') return;
    
    const result = await annihilateBatch(annihilateTarget.id);
    
    if (result.success) {
      setHistory(prev => prev.filter(h => h.id !== annihilateTarget.id));
      setAnnihilateTarget(null);
      setConfirmText('');
    }
  }, [annihilateTarget, confirmText, annihilateBatch]);

  const getStatusBadge = (status: string, imported: number, failed: number) => {
    if (status === 'completed') {
      return (
        <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1">
          <CheckCircle className="h-3 w-3" />
          Sucesso
        </Badge>
      );
    }
    if (status === 'partial') {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 gap-1">
          <AlertTriangle className="h-3 w-3" />
          Parcial ({imported}/{imported + failed})
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500/20 text-red-500 border-red-500/30 gap-1">
        <XCircle className="h-3 w-3" />
        Falhou
      </Badge>
    );
  };

  // Stats
  const stats = {
    total: history.length,
    totalQuestions: history.reduce((acc, h) => acc + h.imported_count, 0),
    totalFiles: history.reduce((acc, h) => acc + h.total_files, 0),
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[min(95vw,800px)] max-w-none h-[85vh] max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
              <History className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <span className="text-lg">Histórico de Importações</span>
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                Rastreabilidade completa de todos os arquivos importados
              </p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Lista de todas as importações realizadas com detalhes
          </DialogDescription>
        </DialogHeader>

        {/* Stats bar */}
        <div className="flex items-center gap-4 p-4 border-b bg-muted/30 flex-wrap">
          <Badge variant="outline" className="gap-1 text-sm">
            <FileSpreadsheet className="h-3 w-3" />
            {stats.total} importações
          </Badge>
          <Badge variant="outline" className="gap-1 text-sm">
            <Target className="h-3 w-3" />
            {stats.totalQuestions.toLocaleString()} questões
          </Badge>
          <Badge variant="outline" className="gap-1 text-sm">
            <Download className="h-3 w-3" />
            {stats.totalFiles} arquivos
          </Badge>
          <Button variant="ghost" size="sm" onClick={loadHistory} className="ml-auto">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg">Nenhuma importação realizada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                As importações de questões aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {history.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className={cn(
                        "transition-all cursor-pointer hover:border-primary/50",
                        expandedId === record.id && "border-primary/50 ring-1 ring-primary/30"
                      )}
                      onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Ícone de status */}
                          <div className={cn(
                            "p-2 rounded-lg shrink-0",
                            record.status === 'completed' && "bg-green-500/10",
                            record.status === 'partial' && "bg-yellow-500/10",
                            record.status === 'failed' && "bg-red-500/10"
                          )}>
                            {record.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                            {record.status === 'partial' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                            {record.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                          </div>

                          {/* Conteúdo principal */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              {getStatusBadge(record.status, record.imported_count, record.failed_count)}
                              <Badge className={cn(
                                record.target_group === 'SIMULADOS' ? "bg-red-600" : "bg-purple-600"
                              )}>
                                {record.target_group === 'SIMULADOS' ? 'SIMULADOS' : 'MODO_TREINO'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(record.created_at), { addSuffix: true, locale: ptBR })}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm flex-wrap">
                              <span className="flex items-center gap-1">
                                <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                                <strong>{record.total_files}</strong> arquivo{record.total_files > 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1 text-green-500">
                                <CheckCircle className="h-3.5 w-3.5" />
                                <strong>{record.imported_count}</strong> importadas
                              </span>
                              {record.failed_count > 0 && (
                                <span className="flex items-center gap-1 text-red-500">
                                  <XCircle className="h-3.5 w-3.5" />
                                  <strong>{record.failed_count}</strong> falharam
                                </span>
                              )}
                            </div>

                            {/* Lista de arquivos (preview) */}
                            {record.file_names.length > 0 && (
                              <div className="mt-2 text-xs text-muted-foreground truncate">
                                📁 {record.file_names.slice(0, 3).join(', ')}
                                {record.file_names.length > 3 && ` +${record.file_names.length - 3} mais`}
                              </div>
                            )}
                          </div>

                          {/* Expand icon */}
                          <Button variant="ghost" size="sm" className="shrink-0">
                            {expandedId === record.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {expandedId === record.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t space-y-3">
                                {/* Data e hora exatas */}
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {format(new Date(record.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                  {record.duration_ms && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {(record.duration_ms / 1000).toFixed(1)}s
                                    </Badge>
                                  )}
                                </div>

                                {/* Lista completa de arquivos */}
                                {record.file_names.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground">Arquivos importados:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {record.file_names.map((name, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs gap-1">
                                          <FileSpreadsheet className="h-3 w-3" />
                                          {name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Campos inferidos */}
                                {record.campos_inferidos.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-xs font-medium text-blue-500 flex items-center gap-1">
                                      <Sparkles className="h-3 w-3" />
                                      Campos inferidos automaticamente:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {record.campos_inferidos.map((campo, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs bg-blue-500/10 text-blue-400">
                                          {campo}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Campos null */}
                                {record.campos_null.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-xs font-medium text-orange-500 flex items-center gap-1">
                                      <AlertOctagon className="h-3 w-3" />
                                      Campos não identificados:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {record.campos_null.map((campo, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs bg-orange-500/10 text-orange-400">
                                          {campo}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* BOTÃO DE ANIQUILAÇÃO */}
                                <div className="pt-4 mt-4 border-t border-destructive/30">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAnnihilateTarget(record);
                                    }}
                                  >
                                    <Skull className="h-4 w-4" />
                                    Aniquilar {record.imported_count} questões deste lote
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-2 text-center">
                                    Remove permanentemente todas as questões importadas neste arquivo
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Dialog de confirmação de aniquilação */}
        <AlertDialog open={!!annihilateTarget} onOpenChange={(open) => !open && setAnnihilateTarget(null)}>
          <AlertDialogContent className="border-destructive/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Skull className="h-5 w-5" />
                Aniquilar Lote de Importação
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Esta ação irá <strong className="text-destructive">EXCLUIR PERMANENTEMENTE</strong> todas as{' '}
                  <strong>{annihilateTarget?.imported_count}</strong> questões importadas neste lote.
                </p>
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                  <p className="text-sm font-medium text-destructive mb-2">Arquivos afetados:</p>
                  <ul className="text-xs space-y-1">
                    {annihilateTarget?.file_names.map((name, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <FileSpreadsheet className="h-3 w-3" />
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-sm">
                  Digite <strong className="text-destructive">EXCLUIR</strong> para confirmar:
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="EXCLUIR"
                  className="border-destructive/50 focus:border-destructive"
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setAnnihilateTarget(null); setConfirmText(''); }}>
                Cancelar
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleAnnihilate}
                disabled={confirmText !== 'EXCLUIR' || isAnnihilating}
                className="gap-2"
              >
                {isAnnihilating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Skull className="h-4 w-4" />
                )}
                Aniquilar Permanentemente
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
});
