// ============================================
// 🚨 CENTRO UNIFICADO DE ERROS DE QUESTÕES
// 1. Erros de Sistema (dados incompletos)
// 2. Erros Reportados pelos Alunos
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Loader2,
  AlertCircle,
  FileWarning,
  Stethoscope
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

interface SystemErrorQuestion extends Question {
  error_type: 'no_text' | 'few_options' | 'no_explanation' | 'no_type';
  error_label: string;
  question_type?: string | null;
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
  const [activeTab, setActiveTab] = useState<'sistema' | 'alunos'>('sistema');
  
  // Estados para erros de alunos
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<ErrorReport | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Estados para erros de sistema
  const [systemPage, setSystemPage] = useState(1);
  const [systemFilter, setSystemFilter] = useState<string>('all');
  const [selectedSystemQuestion, setSelectedSystemQuestion] = useState<SystemErrorQuestion | null>(null);

  // ============================================
  // QUERY: Erros de Sistema (dados incompletos)
  // ============================================

  const { data: systemData, isLoading: isLoadingSystem, refetch: refetchSystem } = useQuery({
    queryKey: ['system-question-errors', systemPage, systemFilter],
    queryFn: async () => {
      // Buscar questões com problemas
      let query = supabase
        .from('quiz_questions')
        .select('id, question_text, options, correct_answer, explanation, macro, micro, difficulty, banca, ano, question_type', { count: 'exact' });

      // Aplicar filtros de erro
      if (systemFilter === 'no_text') {
        query = query.or('question_text.is.null,question_text.eq.');
      } else if (systemFilter === 'few_options') {
        // Filtrar no cliente pois é JSONB
      } else if (systemFilter === 'no_explanation') {
        query = query.or('explanation.is.null,explanation.eq.');
      } else if (systemFilter === 'no_type') {
        query = query.or('question_type.is.null,question_type.eq.');
      } else {
        // Todos: sem enunciado OU sem explicação OU sem tipo
        query = query.or('question_text.is.null,question_text.eq.,explanation.is.null,explanation.eq.,question_type.is.null,question_type.eq.');
      }

      const { data: questions, error, count } = await query
        .order('id', { ascending: true })
        .range((systemPage - 1) * ITEMS_PER_PAGE, systemPage * ITEMS_PER_PAGE - 1);

      if (error) throw error;

      // Processar e classificar erros
      const processedQuestions: SystemErrorQuestion[] = (questions || []).map(q => {
        let error_type: SystemErrorQuestion['error_type'] = 'no_text';
        let error_label = '';

        const hasNoText = !q.question_text || q.question_text.trim() === '';
        const hasNoExplanation = !q.explanation || q.explanation.trim() === '';
        const optionsCount = q.options ? Object.keys(q.options).length : 0;
        const hasFewOptions = optionsCount < 4;
        const hasNoType = !q.question_type || q.question_type.trim() === '';

        if (hasNoText) {
          error_type = 'no_text';
          error_label = 'Sem Enunciado';
        } else if (hasFewOptions) {
          error_type = 'few_options';
          error_label = `Apenas ${optionsCount} alternativas`;
        } else if (hasNoExplanation) {
          error_type = 'no_explanation';
          error_label = 'Sem Explicação';
        } else if (hasNoType) {
          error_type = 'no_type';
          error_label = 'Sem Tipo/Estilo';
        }

        return {
          ...q,
          error_type,
          error_label,
          question_type: q.question_type
        } as SystemErrorQuestion;
      });

      // Filtrar few_options ou no_type no cliente se necessário
      let filteredQuestions = processedQuestions;
      if (systemFilter === 'few_options') {
        filteredQuestions = processedQuestions.filter(q => {
          const optionsCount = q.options ? Object.keys(q.options).length : 0;
          return optionsCount < 4;
        });
      } else if (systemFilter === 'no_type') {
        filteredQuestions = processedQuestions.filter(q => !q.question_type || q.question_type.trim() === '');
      }

      return {
        questions: filteredQuestions,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE)
      };
    },
    staleTime: 30000,
  });

  // ============================================
  // QUERY: Erros Reportados pelos Alunos
  // ============================================
  
  const { data: studentData, isLoading: isLoadingStudent, refetch: refetchStudent } = useQuery({
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
        .maybeSingle();

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

  const systemErrorCount = systemData?.totalCount || 0;
  const studentReportCount = studentData?.totalCount || 0;
  const pendingStudentCount = studentData?.reports?.filter(r => r.status === 'pendente').length || 0;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/20">
            <Stethoscope className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Central de Erros</h1>
            <p className="text-sm text-muted-foreground">
              {systemErrorCount} erros de sistema • {studentReportCount} reportes de alunos
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => {
            refetchSystem();
            refetchStudent();
          }}
          disabled={isLoadingSystem || isLoadingStudent}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", (isLoadingSystem || isLoadingStudent) && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sistema' | 'alunos')} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sistema" className="gap-2">
            <FileWarning className="w-4 h-4" />
            Sistema
            {systemErrorCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {systemErrorCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alunos" className="gap-2">
            <MessageSquareWarning className="w-4 h-4" />
            Alunos
            {pendingStudentCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {pendingStudentCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* TAB: ERROS DE SISTEMA */}
        {/* ============================================ */}
        <TabsContent value="sistema" className="space-y-4">
          {/* Critérios de Detecção Automática */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Critérios de Detecção Automática
                <Badge variant="outline" className="ml-2 text-xs border-blue-400/50 text-blue-300">
                  Basta 1 para aparecer
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="border-red-500/50 text-red-400 shrink-0">1</Badge>
                  <div>
                    <p className="font-medium text-foreground">Sem Enunciado</p>
                    <p className="text-muted-foreground text-xs">Campo `question_text` vazio ou nulo</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="border-orange-500/50 text-orange-400 shrink-0">2</Badge>
                  <div>
                    <p className="font-medium text-foreground">Poucas Alternativas</p>
                    <p className="text-muted-foreground text-xs">Menos de 4 alternativas em `options`</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 shrink-0">3</Badge>
                  <div>
                    <p className="font-medium text-foreground">Sem Explicação</p>
                    <p className="text-muted-foreground text-xs">Campo `explanation` vazio ou nulo</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="border-purple-500/50 text-purple-400 shrink-0">4</Badge>
                  <div>
                    <p className="font-medium text-foreground">Sem Tipo/Estilo</p>
                    <p className="text-muted-foreground text-xs">Campo `question_type` vazio ou nulo</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtros Sistema */}
          <Card>
            <CardContent className="py-4">
              <Select
                value={systemFilter}
                onValueChange={(value) => {
                  setSystemFilter(value);
                  setSystemPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-[280px]">
                  <SelectValue placeholder="Filtrar por tipo de erro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Erros</SelectItem>
                  <SelectItem value="no_text">Sem Enunciado</SelectItem>
                  <SelectItem value="few_options">Poucas Alternativas (&lt;4)</SelectItem>
                  <SelectItem value="no_explanation">Sem Explicação</SelectItem>
                  <SelectItem value="no_type">Sem Tipo/Estilo</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Loading */}
          {isLoadingSystem && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Lista de Erros de Sistema */}
          {!isLoadingSystem && systemData?.questions && (
            <>
              {systemData.questions.length === 0 ? (
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardContent className="py-10 text-center">
                    <Check className="w-12 h-12 mx-auto text-green-400 mb-3" />
                    <h3 className="text-lg font-semibold text-green-400">Base de dados limpa!</h3>
                    <p className="text-sm text-muted-foreground">
                      Nenhuma questão com dados incompletos foi encontrada.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">ID</TableHead>
                          <TableHead>Enunciado</TableHead>
                          <TableHead className="w-[150px]">Erro</TableHead>
                          <TableHead className="w-[100px]">Macro</TableHead>
                          <TableHead className="w-[100px] text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {systemData.questions.map((question) => (
                          <TableRow key={question.id}>
                            <TableCell className="font-mono text-xs">
                              {question.id.slice(0, 8)}...
                            </TableCell>
                            <TableCell className="max-w-[300px]">
                              <p className="truncate text-sm">
                                {question.question_text || <span className="text-red-400 italic">Sem enunciado</span>}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  question.error_type === 'no_text' && "border-red-500/50 text-red-400",
                                  question.error_type === 'few_options' && "border-orange-500/50 text-orange-400",
                                  question.error_type === 'no_explanation' && "border-yellow-500/50 text-yellow-400",
                                  question.error_type === 'no_type' && "border-purple-500/50 text-purple-400"
                                )}
                              >
                                {question.error_label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {question.macro || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSystemQuestion(question)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Paginação Sistema */}
              {systemData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSystemPage(p => Math.max(1, p - 1))}
                    disabled={systemPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Página {systemPage} de {systemData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSystemPage(p => Math.min(systemData.totalPages, p + 1))}
                    disabled={systemPage === systemData.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: ERROS REPORTADOS PELOS ALUNOS */}
        {/* ============================================ */}
        <TabsContent value="alunos" className="space-y-4">
          {/* Filtros Alunos */}
          <Card>
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
          {isLoadingStudent && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Lista de Reports */}
          {!isLoadingStudent && studentData?.reports && (
            <div className="space-y-4">
              {studentData.reports.length === 0 ? (
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
                studentData.reports.map((report, index) => {
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

          {/* Paginação Alunos */}
          {!isLoadingStudent && studentData && studentData.totalPages > 1 && (
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
                Página {page} de {studentData.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(studentData.totalPages, p + 1))}
                disabled={page === studentData.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================================ */}
      {/* MODAL: Detalhes do Reporte do Aluno */}
      {/* ============================================ */}
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
                          <strong>{letter})</strong> {String(text)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
                    <AlertCircle className="w-6 h-6 mx-auto text-yellow-400 mb-2" />
                    <p className="text-sm text-yellow-400">Questão não encontrada no banco de dados</p>
                  </div>
                )}
              </div>

              {/* Notas do Admin */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Notas Internas</h4>
                <Textarea
                  placeholder="Adicione notas internas sobre este reporte..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
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
                  disabled={updateStatusMutation.isPending}
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
                  <Check className="w-4 h-4" />
                  Resolvido
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
                  <X className="w-4 h-4" />
                  Descartar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* MODAL: Detalhes da Questão com Erro de Sistema */}
      {/* ============================================ */}
      <Dialog open={!!selectedSystemQuestion} onOpenChange={(open) => !open && setSelectedSystemQuestion(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-orange-400" />
              Questão com Erro de Sistema
            </DialogTitle>
            <DialogDescription>
              Dados incompletos detectados automaticamente
            </DialogDescription>
          </DialogHeader>

          {selectedSystemQuestion && (
            <div className="space-y-6 py-4">
              {/* Tipo de Erro */}
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-sm",
                    selectedSystemQuestion.error_type === 'no_text' && "border-red-500/50 text-red-400",
                    selectedSystemQuestion.error_type === 'few_options' && "border-orange-500/50 text-orange-400",
                    selectedSystemQuestion.error_type === 'no_explanation' && "border-yellow-500/50 text-yellow-400"
                  )}
                >
                  {selectedSystemQuestion.error_label}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  ID: {selectedSystemQuestion.id}
                </span>
              </div>

              {/* Metadados */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedSystemQuestion.banca && (
                  <Badge variant="outline">{selectedSystemQuestion.banca}</Badge>
                )}
                {selectedSystemQuestion.ano && (
                  <Badge variant="outline">{selectedSystemQuestion.ano}</Badge>
                )}
                {selectedSystemQuestion.macro && (
                  <Badge variant="secondary">{selectedSystemQuestion.macro}</Badge>
                )}
                {selectedSystemQuestion.micro && (
                  <Badge variant="secondary">{selectedSystemQuestion.micro}</Badge>
                )}
                {selectedSystemQuestion.difficulty && (
                  <Badge variant="secondary">{selectedSystemQuestion.difficulty}</Badge>
                )}
              </div>

              {/* Enunciado */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Enunciado</h4>
                <div className={cn(
                  "p-4 rounded-lg border",
                  selectedSystemQuestion.question_text 
                    ? "bg-muted/50" 
                    : "bg-red-500/10 border-red-500/20"
                )}>
                  {selectedSystemQuestion.question_text || (
                    <span className="text-red-400 italic">⚠️ Enunciado não encontrado</span>
                  )}
                </div>
              </div>

              {/* Alternativas */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Alternativas</h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedSystemQuestion.options && Object.keys(selectedSystemQuestion.options).length > 0 ? (
                    Object.entries(selectedSystemQuestion.options).map(([letter, text]) => (
                      <div 
                        key={letter}
                        className={cn(
                          "p-3 rounded border text-sm",
                          selectedSystemQuestion.correct_answer === letter 
                            ? "bg-green-500/10 border-green-500/30" 
                            : "bg-background border-border"
                        )}
                      >
                        <strong>{letter})</strong> {String(text)}
                        {selectedSystemQuestion.correct_answer === letter && (
                          <Badge className="ml-2 text-xs bg-green-500/20 text-green-400">
                            Correta
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
                      <AlertCircle className="w-6 h-6 mx-auto text-orange-400 mb-2" />
                      <p className="text-sm text-orange-400">Nenhuma alternativa cadastrada</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Explicação */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Explicação</h4>
                <div className={cn(
                  "p-4 rounded-lg border",
                  selectedSystemQuestion.explanation 
                    ? "bg-muted/50" 
                    : "bg-yellow-500/10 border-yellow-500/20"
                )}>
                  {selectedSystemQuestion.explanation || (
                    <span className="text-yellow-400 italic">⚠️ Explicação não encontrada</span>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    window.open(`/gestaofc/questoes/${selectedSystemQuestion.id}`, '_blank');
                  }}
                >
                  <Eye className="w-4 h-4" />
                  Editar Questão
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
