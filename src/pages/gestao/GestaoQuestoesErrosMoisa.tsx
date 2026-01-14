// ============================================
// 🚨 ERROS REPORTADOS PELOS ALUNOS
// Página para gerenciar erros de questões reportados
// Tabela: question_error_reports
// CONSTITUIÇÃO v10.4 - REGRA PERMANENTE
// ============================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  RefreshCw,
  MessageSquareWarning,
  User,
  Calendar,
  FileQuestion,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

// ============================================
// TIPOS
// ============================================

interface ErrorReport {
  id: string;
  question_id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  error_message: string;
  source_page: string | null;
  simulado_id: string | null;
  status: string;
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Question {
  id: string;
  question_text: string | null;
  options: Record<string, string> | null;
  correct_answer: string | null;
  explanation: string | null;
  macro: string | null;
  micro: string | null;
  difficulty: string | null;
  banca: string | null;
  ano: number | null;
}

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  em_analise: { label: 'Em Análise', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Eye },
  resolvido: { label: 'Resolvido', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
  descartado: { label: 'Descartado', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
};

const ITEMS_PER_PAGE = 10;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function GestaoQuestoesErrosMoisa() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<ErrorReport | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // ============================================
  // QUERY: Buscar erros reportados
  // ============================================
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['question-error-reports-moisa', page, statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('question_error_reports')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(
          `user_name.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%,error_message.ilike.%${searchTerm}%`
        );
      }

      const { data: reports, error, count } = await query;
      if (error) throw error;

      return {
        reports: (reports || []) as ErrorReport[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE)
      };
    },
    staleTime: 30000,
  });

  // ============================================
  // MUTATION: Atualizar status do report
  // ============================================

  const updateStatusMutation = useMutation({
    mutationFn: async ({ reportId, status, notes }: { reportId: string; status: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes !== undefined) {
        updateData.admin_notes = notes;
      }

      if (status === 'resolvido' || status === 'descartado') {
        updateData.resolved_by = user?.id;
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('question_error_reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-error-reports-moisa'] });
      toast.success('Status atualizado!');
      setSelectedReport(null);
      setSelectedQuestion(null);
      setAdminNotes('');
    },
    onError: (error) => {
      console.error('[GestaoQuestoesErrosMoisa] Erro ao atualizar:', error);
      toast.error('Erro ao atualizar status');
    }
  });

  // ============================================
  // FUNÇÃO: Abrir detalhes do report
  // ============================================

  const handleOpenReport = async (report: ErrorReport) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setIsQuestionLoading(true);

    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('id, question_text, options, correct_answer, explanation, macro, micro, difficulty, banca, ano')
        .eq('id', report.question_id)
        .single();

      if (error) throw error;
      setSelectedQuestion(data as Question);
    } catch (err) {
      console.error('[GestaoQuestoesErrosMoisa] Erro ao buscar questão:', err);
      toast.error('Não foi possível carregar a questão');
      setSelectedQuestion(null);
    } finally {
      setIsQuestionLoading(false);
    }
  };

  // ============================================
  // CONTADORES
  // ============================================

  const pendingCount = data?.reports?.filter(r => r.status === 'pendente').length || 0;
  const totalCount = data?.totalCount || 0;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/20">
            <MessageSquareWarning className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Erros Reportados</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'reporte' : 'reportes'} • {pendingCount} pendente{pendingCount !== 1 && 's'}
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por aluno, email ou mensagem..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="resolvido">Resolvidos</SelectItem>
                <SelectItem value="descartado">Descartados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Lista de Reports */}
      {!isLoading && data?.reports && (
        <div className="space-y-4">
          {data.reports.length === 0 ? (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="py-10 text-center">
                <Check className="w-12 h-12 mx-auto text-green-400 mb-3" />
                <h3 className="text-lg font-semibold text-green-400">Nenhum reporte encontrado!</h3>
                <p className="text-sm text-muted-foreground">
                  {statusFilter !== 'all' ? 'Nenhum reporte com este status.' : 'Os alunos ainda não reportaram erros.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            data.reports.map((report, index) => {
              const statusConfig = STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pendente;
              const StatusIcon = statusConfig.icon;

              return (
                <Card 
                  key={report.id} 
                  className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => handleOpenReport(report)}
                >
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Info Principal */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs">
                            #{(page - 1) * ITEMS_PER_PAGE + index + 1}
                          </Badge>
                          <Badge className={cn("text-xs gap-1", statusConfig.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {report.source_page === 'simulados' ? '📝 Simulado' : '📚 Questões'}
                          </Badge>
                        </div>

                        <p className="text-sm line-clamp-2">{report.error_message}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {report.user_name || report.user_email || 'Aluno'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>

                      {/* Ação */}
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="w-4 h-4" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Paginação */}
      {!isLoading && data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Página {page} de {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareWarning className="w-5 h-5 text-red-400" />
              Detalhes do Reporte
            </DialogTitle>
            <DialogDescription>
              Analise o erro reportado e atualize o status
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6 py-4">
              {/* Mensagem do Aluno */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Erro Reportado
                </h4>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm">{selectedReport.error_message}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Por: <strong>{selectedReport.user_name || selectedReport.user_email}</strong></span>
                  <span>Em: {format(new Date(selectedReport.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  <span>Origem: {selectedReport.source_page === 'simulados' ? 'Simulado' : 'Questões'}</span>
                </div>
              </div>

              {/* Questão */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-blue-400" />
                  Questão Relacionada
                </h4>
                {isQuestionLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : selectedQuestion ? (
                  <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {selectedQuestion.banca && (
                        <Badge variant="outline">{selectedQuestion.banca}</Badge>
                      )}
                      {selectedQuestion.ano && (
                        <Badge variant="outline">{selectedQuestion.ano}</Badge>
                      )}
                      {selectedQuestion.macro && (
                        <Badge variant="secondary">{selectedQuestion.macro}</Badge>
                      )}
                      {selectedQuestion.difficulty && (
                        <Badge variant="secondary">{selectedQuestion.difficulty}</Badge>
                      )}
                    </div>
                    <p className="text-sm line-clamp-4">{selectedQuestion.question_text}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {selectedQuestion.options && Object.entries(selectedQuestion.options).map(([letter, text]) => (
                        <div 
                          key={letter}
                          className={cn(
                            "p-2 rounded border",
                            selectedQuestion.correct_answer === letter 
                              ? "bg-green-500/10 border-green-500/30" 
                              : "bg-background border-border"
                          )}
                        >
                          <strong>{letter})</strong> {text}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/50 border text-center text-muted-foreground">
                    <XCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Questão não encontrada</p>
                  </div>
                )}
              </div>

              {/* Notas do Admin */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Notas Internas</h4>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione observações internas sobre este reporte..."
                  className="min-h-[80px]"
                />
              </div>

              {/* Ações */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => updateStatusMutation.mutate({ 
                    reportId: selectedReport.id, 
                    status: 'em_analise',
                    notes: adminNotes 
                  })}
                  disabled={updateStatusMutation.isPending || selectedReport.status === 'em_analise'}
                >
                  <Eye className="w-4 h-4" />
                  Em Análise
                </Button>
                <Button
                  variant="default"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  onClick={() => updateStatusMutation.mutate({ 
                    reportId: selectedReport.id, 
                    status: 'resolvido',
                    notes: adminNotes 
                  })}
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Marcar Resolvido
                </Button>
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => updateStatusMutation.mutate({ 
                    reportId: selectedReport.id, 
                    status: 'descartado',
                    notes: adminNotes 
                  })}
                  disabled={updateStatusMutation.isPending}
                >
                  <XCircle className="w-4 h-4" />
                  Descartar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
