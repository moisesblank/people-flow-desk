// ============================================
// 📋 GESTÃO DE ERROS REPORTADOS EM QUESTÕES
// URL: /gestaofc/erros
// Exibe erros reportados por alunos com questão completa
// ============================================

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  MailOpen,
  Loader2,
  Search,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import QuestionEnunciado from "@/components/shared/QuestionEnunciado";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_PAGE = 10;

type ErrorReport = {
  id: string;
  question_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  error_message: string;
  source_page: string;
  simulado_id: string | null;
  status: string;
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

type Question = {
  id: string;
  question_text: string;
  options: Record<string, string> | null;
  correct_answer: string;
  explanation: string | null;
  difficulty: string | null;
  macro: string | null;
  micro: string | null;
  banca: string | null;
  ano: number | null;
};

export default function GestaoErrosQuestoes() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<ErrorReport | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch error reports
  const { data: reports, isLoading } = useQuery({
    queryKey: ["question-error-reports", statusFilter, currentPage, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("question_error_reports")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (searchTerm) {
        query = query.or(
          `user_name.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%,error_message.ilike.%${searchTerm}%`
        );
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { reports: (data || []) as ErrorReport[], totalCount: count || 0 };
    },
  });

  // Fetch question details
  const fetchQuestion = async (questionId: string) => {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("id", questionId)
      .single();

    if (error) throw error;
    return data as Question;
  };

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      reportId,
      status,
      adminNotes,
    }: {
      reportId: string;
      status: string;
      adminNotes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("question_error_reports")
        .update({
          status,
          admin_notes: adminNotes,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-error-reports"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar status.");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("question_error_reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-error-reports"] });
      toast.success("Reporte excluído!");
    },
    onError: () => {
      toast.error("Erro ao excluir reporte.");
    },
  });

  const handleViewReport = async (report: ErrorReport) => {
    setSelectedReport(report);
    try {
      const question = await fetchQuestion(report.question_id);
      setSelectedQuestion(question);
      setIsViewModalOpen(true);
    } catch {
      toast.error("Erro ao carregar questão.");
    }
  };

  const totalPages = Math.ceil((reports?.totalCount || 0) / ITEMS_PER_PAGE);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "reviewed":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
            <Eye className="h-3 w-3 mr-1" />
            Analisado
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Resolvido
          </Badge>
        );
      case "dismissed":
        return (
          <Badge variant="outline" className="bg-zinc-500/10 text-zinc-500 border-zinc-500/30">
            <Trash2 className="h-3 w-3 mr-1" />
            Descartado
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSourceBadge = (source: string) => {
    return source === "simulados" ? (
      <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
        Simulado
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
        Questões
      </Badge>
    );
  };

  const pendingCount = reports?.reports?.filter((r) => r.status === "pending").length || 0;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-500/20">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Erros Reportados</h1>
            <p className="text-muted-foreground text-sm">
              Gerencie os erros reportados pelos alunos nas questões
            </p>
          </div>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-red-500 text-white px-4 py-2">
            {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por aluno, email ou mensagem..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="reviewed">Analisados</SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
                <SelectItem value="dismissed">Descartados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reports?.reports?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mb-4 text-green-500" />
              <p className="text-lg font-medium">Nenhum erro reportado</p>
              <p className="text-sm">Todos os reportes foram tratados</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="divide-y divide-border/50">
                {reports?.reports?.map((report) => (
                  <div
                    key={report.id}
                    className={cn(
                      "p-4 hover:bg-muted/30 transition-colors",
                      report.status === "pending" && "bg-amber-500/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        {/* Header */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {getStatusBadge(report.status)}
                          {getSourceBadge(report.source_page)}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>

                        {/* User info */}
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{report.user_name}</span>
                          <span className="text-muted-foreground">({report.user_email})</span>
                        </div>

                        {/* Error message */}
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <p className="text-sm text-red-200">{report.error_message}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewReport(report)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Questão
                        </Button>
                        {report.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 text-green-500 hover:text-green-400"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  reportId: report.id,
                                  status: "resolved",
                                })
                              }
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Resolver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 text-zinc-500 hover:text-zinc-400"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  reportId: report.id,
                                  status: "dismissed",
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                              Descartar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages} ({reports?.totalCount} reportes)
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Questão Reportada
            </DialogTitle>
            <DialogDescription>
              Visualize a questão completa e o erro reportado pelo aluno
            </DialogDescription>
          </DialogHeader>

          {selectedQuestion && selectedReport && (
            <div className="space-y-6 py-4">
              {/* Error Report Card */}
              <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    Erro Reportado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">{selectedReport.error_message}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedReport.user_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(selectedReport.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Question Card */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Questão Completa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2">
                    {selectedQuestion.macro && (
                      <Badge variant="outline">{selectedQuestion.macro}</Badge>
                    )}
                    {selectedQuestion.micro && (
                      <Badge variant="outline" className="bg-primary/10">
                        {selectedQuestion.micro}
                      </Badge>
                    )}
                    {selectedQuestion.difficulty && (
                      <Badge
                        variant="outline"
                        className={cn(
                          selectedQuestion.difficulty === "facil" && "text-green-500",
                          selectedQuestion.difficulty === "medio" && "text-amber-500",
                          selectedQuestion.difficulty === "dificil" && "text-red-500"
                        )}
                      >
                        {selectedQuestion.difficulty}
                      </Badge>
                    )}
                    {selectedQuestion.banca && (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-400">
                        {selectedQuestion.banca}
                      </Badge>
                    )}
                  </div>

                  {/* Enunciado */}
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <QuestionEnunciado questionText={selectedQuestion.question_text} banca={selectedQuestion.banca} ano={selectedQuestion.ano} />
                  </div>

                  {/* Options */}
                  {selectedQuestion.options && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Alternativas:</p>
                      <div className="space-y-2">
                        {Object.entries(selectedQuestion.options).map(([key, value]) => (
                          <div
                            key={key}
                            className={cn(
                              "p-3 rounded-lg border flex items-start gap-3",
                              key === selectedQuestion.correct_answer
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-muted/20 border-border/50"
                            )}
                          >
                            <span
                              className={cn(
                                "font-bold",
                                key === selectedQuestion.correct_answer
                                  ? "text-green-500"
                                  : "text-muted-foreground"
                              )}
                            >
                              {key})
                            </span>
                            <span className="flex-1">{String(value)}</span>
                            {key === selectedQuestion.correct_answer && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {selectedQuestion.explanation && (
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm font-medium mb-2 text-blue-400">Explicação:</p>
                      <p className="text-sm">{selectedQuestion.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              {selectedReport.status === "pending" && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 gap-2"
                    variant="outline"
                    onClick={() => {
                      updateStatusMutation.mutate({
                        reportId: selectedReport.id,
                        status: "reviewed",
                      });
                      setIsViewModalOpen(false);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    Marcar como Analisado
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      updateStatusMutation.mutate({
                        reportId: selectedReport.id,
                        status: "resolved",
                      });
                      setIsViewModalOpen(false);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Resolver
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
