/**
 * 🎯 GESTÃO DE SIMULADOS — Constituição SYNAPSE Ω v10.0
 * 
 * Centro de comando para criação, monitoramento e controle de simulados.
 * Inclui: Criação, Feature Flags, Métricas, Auditoria.
 */

import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Brain, Plus, Settings, BarChart3, FileQuestion, Shield,
  Trophy, Clock, Calendar, Users, Eye, Edit, Trash2,
  Play, Pause, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Search, Filter, MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LoadingState } from '@/components/LoadingState';
import { SimuladoFeatureFlagsPanel } from '@/components/gestao/simulados/SimuladoFeatureFlagsPanel';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// ============================================
// TIPOS
// ============================================

interface Simulado {
  id: string;
  title: string;
  description: string | null;
  quiz_type: string;
  time_limit_minutes: number | null;
  passing_score: number;
  xp_reward: number;
  is_published: boolean;
  max_attempts: number;
  created_at: string;
  questions_count?: number;
}

interface SimuladoFormData {
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
  xp_reward: number;
  max_attempts: number;
  question_ids: string[];
}

// ============================================
// HOOKS
// ============================================

function useSimulados() {
  return useQuery({
    queryKey: ['gestao-simulados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('quiz_type', 'simulado')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Buscar contagem de questões separadamente
      const ids = (data || []).map(s => s.id);
      let questionCounts: Record<string, number> = {};
      
      if (ids.length > 0) {
        const { data: qData } = await supabase
          .from('quiz_questions')
          .select('quiz_id')
          .in('quiz_id', ids);
        
        if (qData) {
          qData.forEach(q => {
            questionCounts[q.quiz_id] = (questionCounts[q.quiz_id] || 0) + 1;
          });
        }
      }
      
      return (data || []).map(s => ({
        ...s,
        questions_count: questionCounts[s.id] || 0
      })) as Simulado[];
    },
    staleTime: 30_000,
  });
}

function useSimuladoQuestions() {
  return useQuery({
    queryKey: ['simulado-questions-available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('id, question_text, difficulty, banca, ano, macro')
        .contains('tags', ['SIMULADOS'])
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });
}

function useSimuladoMetrics() {
  return useQuery({
    queryKey: ['simulado-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulado_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.warn('[Metrics] Tabela pode não existir:', error.message);
        return [];
      }
      return data || [];
    },
    staleTime: 60_000,
  });
}

function useCreateSimulado() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: SimuladoFormData) => {
      // 1. Criar o quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: formData.title,
          description: formData.description || null,
          quiz_type: 'simulado',
          time_limit_minutes: formData.time_limit_minutes,
          passing_score: formData.passing_score,
          xp_reward: formData.xp_reward,
          is_published: false,
          max_attempts: formData.max_attempts,
        })
        .select()
        .single();
      
      if (quizError) throw quizError;
      
      // 2. Associar questões se houver (via quiz_id na quiz_questions)
      // Nota: A associação é feita no momento da importação/edição das questões
      // Aqui apenas criamos o quiz base
      
      return quiz;
      
      return quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-simulados'] });
      toast.success('Simulado criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar simulado: ${error.message}`);
    },
  });
}

function useDeleteSimulado() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (simuladoId: string) => {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', simuladoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-simulados'] });
      toast.success('Simulado excluído');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });
}

function useTogglePublish() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_published })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { is_published }) => {
      queryClient.invalidateQueries({ queryKey: ['gestao-simulados'] });
      toast.success(is_published ? 'Simulado publicado!' : 'Simulado despublicado');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

// ============================================
// COMPONENTES
// ============================================

function CreateSimuladoDialog({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { data: questions, isLoading: isLoadingQuestions } = useSimuladoQuestions();
  const createSimulado = useCreateSimulado();
  
  const [formData, setFormData] = useState<SimuladoFormData>({
    title: '',
    description: '',
    time_limit_minutes: 120,
    passing_score: 60,
    xp_reward: 100,
    max_attempts: 1,
    question_ids: [],
  });
  
  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    
    createSimulado.mutate(formData, {
      onSuccess: () => {
        onOpenChange(false);
        setFormData({
          title: '',
          description: '',
          time_limit_minutes: 120,
          passing_score: 60,
          xp_reward: 100,
          max_attempts: 1,
          question_ids: [],
        });
      },
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Criar Novo Simulado
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes do simulado e associe questões.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Título e Descrição */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Simulado ENEM 2025 - Química"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição do simulado..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          
          <Separator />
          
          {/* Configurações */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tempo Limite (minutos)</Label>
              <Input
                type="number"
                min={10}
                max={300}
                value={formData.time_limit_minutes}
                onChange={(e) => setFormData({ ...formData, time_limit_minutes: parseInt(e.target.value) || 120 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Nota Mínima (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.passing_score}
                onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) || 60 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>XP de Recompensa</Label>
              <Input
                type="number"
                min={0}
                value={formData.xp_reward}
                onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) || 100 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Máximo de Tentativas</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={formData.max_attempts}
                onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          
          <Separator />
          
          {/* Info sobre Feature Flags */}
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-amber-500/5 border-amber-500/20">
            <Shield className="h-5 w-5 text-amber-500" />
            <div>
              <Label className="text-sm font-medium">Modo Hard</Label>
              <p className="text-xs text-muted-foreground">
                O Modo Hard é controlado globalmente via Feature Flags na aba "Feature Flags".
              </p>
            </div>
          </div>
          
          <Separator />
          
          {/* Questões */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Questões Associadas</Label>
              <Badge variant="outline">
                {formData.question_ids.length} selecionadas
              </Badge>
            </div>
            
            {isLoadingQuestions ? (
              <div className="py-4 text-center text-muted-foreground">Carregando questões...</div>
            ) : questions && questions.length > 0 ? (
              <div className="max-h-[200px] overflow-y-auto border rounded-lg p-2 space-y-1">
                {questions.map((q) => (
                  <label
                    key={q.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted/50 transition-colors",
                      formData.question_ids.includes(q.id) && "bg-primary/10 border border-primary/30"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formData.question_ids.includes(q.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, question_ids: [...formData.question_ids, q.id] });
                        } else {
                          setFormData({ ...formData, question_ids: formData.question_ids.filter(id => id !== q.id) });
                        }
                      }}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{q.question_text?.substring(0, 80)}...</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">{q.difficulty}</Badge>
                        {q.banca && <Badge variant="outline" className="text-xs">{q.banca}</Badge>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground border rounded-lg">
                <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma questão com tag SIMULADOS disponível.</p>
                <p className="text-xs">Importe questões em /gestaofc/questoes primeiro.</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createSimulado.isPending}>
            {createSimulado.isPending ? 'Criando...' : 'Criar Simulado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SimuladosList() {
  const { data: simulados, isLoading, refetch } = useSimulados();
  const deleteSimulado = useDeleteSimulado();
  const togglePublish = useTogglePublish();
  const [search, setSearch] = useState('');
  
  const filtered = useMemo(() => {
    if (!simulados) return [];
    if (!search.trim()) return simulados;
    return simulados.filter(s => 
      s.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [simulados, search]);
  
  if (isLoading) {
    return <LoadingState message="Carregando simulados..." />;
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Simulados Cadastrados
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum simulado cadastrado.</p>
            <p className="text-sm">Clique em "Novo Simulado" para criar.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Questões</TableHead>
                <TableHead>Tempo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((simulado) => (
                <TableRow key={simulado.id}>
                  <TableCell>
                    <span className="font-medium">{simulado.title}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{simulado.questions_count || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {simulado.time_limit_minutes || '—'} min
                    </div>
                  </TableCell>
                  <TableCell>
                    {simulado.is_published ? (
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Publicado
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Pause className="h-3 w-3 mr-1" />
                        Rascunho
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(simulado.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => togglePublish.mutate({ id: simulado.id, is_published: !simulado.is_published })}>
                          {simulado.is_published ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" /> Despublicar
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" /> Publicar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => deleteSimulado.mutate(simulado.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function MetricsDashboard() {
  const { data: simulados } = useSimulados();
  
  const stats = useMemo(() => {
    if (!simulados) return { total: 0, published: 0, questions: 0 };
    return {
      total: simulados.length,
      published: simulados.filter(s => s.is_published).length,
      questions: simulados.reduce((acc, s) => acc + (s.questions_count || 0), 0),
    };
  }, [simulados]);
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: 'Total', value: stats.total, icon: Brain, color: 'text-primary' },
        { label: 'Publicados', value: stats.published, icon: CheckCircle2, color: 'text-green-500' },
        { label: 'Questões', value: stats.questions, icon: FileQuestion, color: 'text-blue-500' },
      ].map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl bg-muted", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default function GestaoSimulados() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  return (
    <>
      <Helmet>
        <title>Gestão de Simulados | Moisés Medeiros</title>
        <meta name="description" content="Gerenciamento de simulados e avaliações" />
      </Helmet>
      
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              Gestão de Simulados
            </h1>
            <p className="text-muted-foreground mt-1">
              Crie, configure e monitore simulados com Modo Hard.
            </p>
          </div>
          
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Simulado
          </Button>
        </motion.div>
        
        {/* Métricas */}
        <MetricsDashboard />
        
        {/* Tabs */}
        <Tabs defaultValue="simulados" className="space-y-6">
          <TabsList>
            <TabsTrigger value="simulados" className="gap-2">
              <Brain className="h-4 w-4" />
              Simulados
            </TabsTrigger>
            <TabsTrigger value="flags" className="gap-2">
              <Settings className="h-4 w-4" />
              Feature Flags
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Auditoria
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="simulados">
            <SimuladosList />
          </TabsContent>
          
          <TabsContent value="flags">
            <SimuladoFeatureFlagsPanel />
          </TabsContent>
          
          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Logs de Auditoria
                </CardTitle>
                <CardDescription>
                  Registros de tentativas, invalidações e eventos do sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Os logs de auditoria serão exibidos aqui após as primeiras tentativas.</p>
                  <p className="text-sm mt-1">Consulte o Runbook para auditoria manual.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialog de Criação */}
      <CreateSimuladoDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </>
  );
}
