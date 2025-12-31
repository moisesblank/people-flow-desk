// ============================================
// GESTÃO DE TUTORIA - Central de Monitoria e Suporte
// Sincronizado em tempo real com /alunos/tutoria
// ============================================

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, MessageSquare, Bot, Calendar, Users, CheckCircle2, Clock, 
  AlertCircle, Eye, Send, Filter, RefreshCw, TrendingUp, Brain,
  MessageCircle, HelpCircle, Video, Star, BarChart3
} from "lucide-react";
import { motion } from "framer-motion";

// Types
interface StudentDoubt {
  id: string;
  student_id: string;
  student_name: string | null;
  student_email: string | null;
  title: string;
  content: string;
  category: string | null;
  subject: string | null;
  status: string;
  priority: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
  answer: string | null;
  answered_at: string | null;
  is_public: boolean | null;
  upvotes: number | null;
  views: number | null;
  created_at: string;
}

interface AITutorLog {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  mode: string;
  user_message: string;
  ai_response: string | null;
  tokens_used: number | null;
  response_time_ms: number | null;
  was_helpful: boolean | null;
  created_at: string;
}

interface TutoringSession {
  id: string;
  student_id: string;
  student_name: string | null;
  student_email: string | null;
  tutor_name: string | null;
  title: string;
  description: string | null;
  session_type: string;
  status: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meeting_url: string | null;
  feedback_rating: number | null;
  created_at: string;
}

// Hooks
function useStudentDoubts() {
  return useQuery({
    queryKey: ['gestao-student-doubts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_doubts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as StudentDoubt[];
    }
  });
}

function useAITutorLogs() {
  return useQuery({
    queryKey: ['gestao-ai-tutor-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_tutor_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return (data || []) as AITutorLog[];
    }
  });
}

function useTutoringSessions() {
  return useQuery({
    queryKey: ['gestao-tutoring-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutoring_sessions')
        .select('*')
        .order('scheduled_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as TutoringSession[];
    }
  });
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
    pending: { label: "Pendente", variant: "outline", icon: Clock },
    in_progress: { label: "Em andamento", variant: "secondary", icon: AlertCircle },
    answered: { label: "Respondida", variant: "default", icon: CheckCircle2 },
    closed: { label: "Fechada", variant: "secondary", icon: CheckCircle2 },
    scheduled: { label: "Agendada", variant: "outline", icon: Calendar },
    completed: { label: "Concluída", variant: "default", icon: CheckCircle2 },
    cancelled: { label: "Cancelada", variant: "destructive", icon: AlertCircle },
  };
  
  const config = statusConfig[status] || { label: status, variant: "outline" as const, icon: Clock };
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

// Priority Badge Component
function PriorityBadge({ priority }: { priority: string | null }) {
  const priorityConfig: Record<string, { label: string; className: string }> = {
    low: { label: "Baixa", className: "bg-gray-100 text-gray-700" },
    normal: { label: "Normal", className: "bg-blue-100 text-blue-700" },
    high: { label: "Alta", className: "bg-orange-100 text-orange-700" },
    urgent: { label: "Urgente", className: "bg-red-100 text-red-700" },
  };
  
  const config = priorityConfig[priority || 'normal'] || priorityConfig.normal;
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

// Mode Badge Component
function ModeBadge({ mode }: { mode: string }) {
  const modeConfig: Record<string, { label: string; icon: typeof Brain; className: string }> = {
    tutor: { label: "Tutor", icon: Brain, className: "bg-cyan-100 text-cyan-700" },
    redacao: { label: "Redação", icon: MessageSquare, className: "bg-purple-100 text-purple-700" },
    flashcards: { label: "Flashcards", icon: BarChart3, className: "bg-green-100 text-green-700" },
    cronograma: { label: "Cronograma", icon: Calendar, className: "bg-orange-100 text-orange-700" },
  };
  
  const config = modeConfig[mode] || modeConfig.tutor;
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

// Answer Dialog Component
function AnswerDialog({ doubt, onSuccess }: { doubt: StudentDoubt; onSuccess: () => void }) {
  const { user } = useAuth();
  const [answer, setAnswer] = useState(doubt.answer || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  
  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast.error("Digite uma resposta");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('student_doubts')
        .update({
          answer,
          answered_by: user?.id,
          answered_at: new Date().toISOString(),
          status: 'answered'
        })
        .eq('id', doubt.id);
      
      if (error) throw error;
      
      toast.success("Resposta enviada com sucesso!");
      setOpen(false);
      onSuccess();
    } catch (error) {
      toast.error("Erro ao enviar resposta");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={doubt.answer ? "outline" : "default"}>
          {doubt.answer ? <Eye className="w-4 h-4 mr-1" /> : <Send className="w-4 h-4 mr-1" />}
          {doubt.answer ? "Ver" : "Responder"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{doubt.title}</DialogTitle>
          <DialogDescription>
            Por {doubt.student_name || doubt.student_email} • {format(new Date(doubt.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{doubt.content}</p>
          </div>
          
          <div className="space-y-2">
            <Label>Sua Resposta</Label>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Digite sua resposta aqui..."
              rows={6}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar Resposta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export default function GestaoTutoria() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("duvidas");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data: doubts, isLoading: isLoadingDoubts } = useStudentDoubts();
  const { data: aiLogs, isLoading: isLoadingLogs } = useAITutorLogs();
  const { data: sessions, isLoading: isLoadingSessions } = useTutoringSessions();
  
  // Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel('gestao-tutoria-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_doubts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gestao-student-doubts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_tutor_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gestao-ai-tutor-logs'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tutoring_sessions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gestao-tutoring-sessions'] });
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
  
  // Stats
  const stats = {
    totalDoubts: doubts?.length || 0,
    pendingDoubts: doubts?.filter(d => d.status === 'pending').length || 0,
    answeredDoubts: doubts?.filter(d => d.status === 'answered').length || 0,
    totalAIInteractions: aiLogs?.length || 0,
    totalSessions: sessions?.length || 0,
    scheduledSessions: sessions?.filter(s => s.status === 'scheduled').length || 0,
  };
  
  // Filtered data
  const filteredDoubts = doubts?.filter(d => {
    const matchesSearch = 
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.student_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];
  
  const filteredLogs = aiLogs?.filter(l =>
    l.user_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Central de Tutoria</h1>
          <p className="text-muted-foreground">Gerencie dúvidas, monitoria e interações com IA</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => queryClient.invalidateQueries()}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalDoubts}</p>
                  <p className="text-xs text-muted-foreground">Total Dúvidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingDoubts}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.answeredDoubts}</p>
                  <p className="text-xs text-muted-foreground">Respondidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalAIInteractions}</p>
                  <p className="text-xs text-muted-foreground">Interações IA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                  <p className="text-xs text-muted-foreground">Sessões</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.scheduledSessions}</p>
                  <p className="text-xs text-muted-foreground">Agendadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="duvidas" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            Dúvidas
          </TabsTrigger>
          <TabsTrigger value="ia" className="gap-2">
            <Bot className="w-4 h-4" />
            Logs IA
          </TabsTrigger>
          <TabsTrigger value="sessoes" className="gap-2">
            <Video className="w-4 h-4" />
            Sessões
          </TabsTrigger>
        </TabsList>
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {activeTab === 'duvidas' && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="answered">Respondidas</SelectItem>
                <SelectItem value="closed">Fechadas</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        
        {/* Dúvidas Tab */}
        <TabsContent value="duvidas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Dúvidas dos Alunos</CardTitle>
              <CardDescription>Gerencie e responda às dúvidas enviadas pelos alunos</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDoubts ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDoubts.length === 0 ? (
                <div className="text-center py-10">
                  <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma dúvida encontrada</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDoubts.map((doubt) => (
                        <TableRow key={doubt.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{doubt.student_name || 'Sem nome'}</p>
                              <p className="text-xs text-muted-foreground">{doubt.student_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="max-w-[200px] truncate">{doubt.title}</p>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={doubt.status} />
                          </TableCell>
                          <TableCell>
                            <PriorityBadge priority={doubt.priority} />
                          </TableCell>
                          <TableCell>
                            {format(new Date(doubt.created_at), "dd/MM/yy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <AnswerDialog 
                              doubt={doubt} 
                              onSuccess={() => queryClient.invalidateQueries({ queryKey: ['gestao-student-doubts'] })} 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI Logs Tab */}
        <TabsContent value="ia" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Interação com IA</CardTitle>
              <CardDescription>Visualize as conversas dos alunos com o Tutor IA</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-10">
                  <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma interação encontrada</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {filteredLogs.map((log) => (
                      <Card key={log.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{log.user_name || log.user_email || 'Anônimo'}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ModeBadge mode={log.mode} />
                            {log.tokens_used && (
                              <Badge variant="outline" className="text-xs">
                                {log.tokens_used} tokens
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2 mt-3">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">Pergunta:</p>
                            <p className="text-sm">{log.user_message}</p>
                          </div>
                          
                          {log.ai_response && (
                            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                              <p className="text-sm font-medium mb-1">Resposta IA:</p>
                              <p className="text-sm line-clamp-3">{log.ai_response}</p>
                            </div>
                          )}
                        </div>
                        
                        {log.was_helpful !== null && (
                          <div className="mt-2 flex items-center gap-1">
                            <Star className={`w-4 h-4 ${log.was_helpful ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                            <span className="text-xs text-muted-foreground">
                              {log.was_helpful ? 'Útil' : 'Não útil'}
                            </span>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Sessions Tab */}
        <TabsContent value="sessoes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sessões de Tutoria</CardTitle>
              <CardDescription>Gerencie sessões de tutoria ao vivo</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="flex items-center justify-center h-40">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : sessions?.length === 0 ? (
                <div className="text-center py-10">
                  <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma sessão agendada</p>
                  <Button className="mt-4" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar Sessão
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Duração</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions?.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{session.student_name || 'Sem nome'}</p>
                              <p className="text-xs text-muted-foreground">{session.student_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{session.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{session.session_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={session.status} />
                          </TableCell>
                          <TableCell>
                            {session.scheduled_at 
                              ? format(new Date(session.scheduled_at), "dd/MM/yy HH:mm")
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {session.duration_minutes ? `${session.duration_minutes} min` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
