// ============================================
// GESTÃO CRONOGRAMA v1.0 - Planos de Estudo + Sincronização
// ============================================

import { useState, useEffect, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Target,
  Users,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Copy,
  Eye,
  BarChart3,
  BookOpen,
  Brain,
  Zap,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Layers,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BANCAS, BANCAS_POR_CATEGORIA, CATEGORIA_LABELS } from "@/constants/bancas";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================
interface StudyPlan {
  id: string;
  title: string;
  description: string | null;
  duration_weeks: number;
  target_exam: string;
  difficulty_level: string;
  weekly_hours: number;
  is_template: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface StudyBlock {
  id: string;
  plan_id: string | null;
  student_id: string | null;
  title: string;
  subject: string;
  topic: string | null;
  activity_type: string;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  week_number: number;
  priority: string;
  is_recurring: boolean;
  status: string;
  completed_at: string | null;
  notes: string | null;
  color: string;
  created_at: string;
}

interface StudyGoal {
  id: string;
  student_id: string | null;
  plan_id: string | null;
  title: string;
  description: string | null;
  goal_type: string;
  target_value: number;
  current_value: number;
  unit: string;
  subject: string | null;
  start_date: string | null;
  end_date: string | null;
  is_achieved: boolean;
  achieved_at: string | null;
  created_at: string;
}

// ============================================
// STATS CARD
// ============================================
const StatCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  color,
  subtitle 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ElementType; 
  color: string;
  subtitle?: string;
}) => (
  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn("p-3 rounded-xl", color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
));
StatCard.displayName = "StatCard";

// ============================================
// PLAN DIALOG
// ============================================
interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: StudyPlan | null;
  onSave: (data: Partial<StudyPlan>) => void;
}

const PlanDialog = memo(({ open, onOpenChange, plan, onSave }: PlanDialogProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration_weeks: 12,
    target_exam: "ENEM",
    difficulty_level: "medium",
    weekly_hours: 20,
    is_template: false,
    is_active: true,
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        title: plan.title,
        description: plan.description || "",
        duration_weeks: plan.duration_weeks,
        target_exam: plan.target_exam,
        difficulty_level: plan.difficulty_level,
        weekly_hours: plan.weekly_hours,
        is_template: plan.is_template,
        is_active: plan.is_active,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        duration_weeks: 12,
        target_exam: "ENEM",
        difficulty_level: "medium",
        weekly_hours: 20,
        is_template: false,
        is_active: true,
      });
    }
  }, [plan, open]);

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? "Editar Plano" : "Novo Plano de Estudos"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Cronograma ENEM 2025 - Intensivo"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o objetivo do plano..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duração (semanas)</Label>
              <Input
                type="number"
                value={formData.duration_weeks}
                onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) || 12 })}
                min={1}
                max={52}
              />
            </div>
            <div className="space-y-2">
              <Label>Horas/Semana</Label>
              <Input
                type="number"
                value={formData.weekly_hours}
                onChange={(e) => setFormData({ ...formData, weekly_hours: parseInt(e.target.value) || 20 })}
                min={1}
                max={80}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vestibular</Label>
              <Select
                value={formData.target_exam}
                onValueChange={(v) => setFormData({ ...formData, target_exam: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(BANCAS_POR_CATEGORIA).map(([categoria, bancas]) => (
                    <div key={categoria}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                        {CATEGORIA_LABELS[categoria as keyof typeof CATEGORIA_LABELS]}
                      </div>
                      {bancas.map(b => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dificuldade</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(v) => setFormData({ ...formData, difficulty_level: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Leve</SelectItem>
                  <SelectItem value="medium">Moderado</SelectItem>
                  <SelectItem value="hard">Intenso</SelectItem>
                  <SelectItem value="intensive">Muito Intenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_template}
                onCheckedChange={(c) => setFormData({ ...formData, is_template: c })}
              />
              <Label>Template público</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
              />
              <Label>Ativo</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {plan ? "Salvar" : "Criar Plano"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
PlanDialog.displayName = "PlanDialog";

// ============================================
// MAIN COMPONENT
// ============================================
export default function GestaoCronograma() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("plans");
  const [searchTerm, setSearchTerm] = useState("");
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);

  // ========== QUERIES ==========
  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ["study-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StudyPlan[];
    },
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ["study-blocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_blocks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as StudyBlock[];
    },
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["study-goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_goals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as StudyGoal[];
    },
  });

  // ========== REALTIME ==========
  useEffect(() => {
    const channel = supabase
      .channel("cronograma-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "study_plans" }, () => {
        queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "study_blocks" }, () => {
        queryClient.invalidateQueries({ queryKey: ["study-blocks"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "study_goals" }, () => {
        queryClient.invalidateQueries({ queryKey: ["study-goals"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // ========== MUTATIONS ==========
  const createPlanMutation = useMutation({
    mutationFn: async (data: Partial<StudyPlan>) => {
      const { error } = await supabase.from("study_plans").insert([{
        title: data.title!,
        description: data.description,
        duration_weeks: data.duration_weeks,
        target_exam: data.target_exam,
        difficulty_level: data.difficulty_level,
        weekly_hours: data.weekly_hours,
        is_template: data.is_template,
        is_active: data.is_active,
        created_by: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      toast.success("Plano criado com sucesso!");
      setPlanDialogOpen(false);
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StudyPlan> }) => {
      const { error } = await supabase.from("study_plans").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      toast.success("Plano atualizado!");
      setPlanDialogOpen(false);
      setSelectedPlan(null);
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("study_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      toast.success("Plano excluído!");
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  const duplicatePlanMutation = useMutation({
    mutationFn: async (plan: StudyPlan) => {
      const { error } = await supabase.from("study_plans").insert({
        title: `${plan.title} (Cópia)`,
        description: plan.description,
        duration_weeks: plan.duration_weeks,
        target_exam: plan.target_exam,
        difficulty_level: plan.difficulty_level,
        weekly_hours: plan.weekly_hours,
        is_template: false,
        is_active: true,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      toast.success("Plano duplicado!");
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  // ========== HANDLERS ==========
  const handleSavePlan = useCallback((data: Partial<StudyPlan>) => {
    if (selectedPlan) {
      updatePlanMutation.mutate({ id: selectedPlan.id, data });
    } else {
      createPlanMutation.mutate(data);
    }
  }, [selectedPlan, updatePlanMutation, createPlanMutation]);

  const handleEditPlan = useCallback((plan: StudyPlan) => {
    setSelectedPlan(plan);
    setPlanDialogOpen(true);
  }, []);

  const handleNewPlan = useCallback(() => {
    setSelectedPlan(null);
    setPlanDialogOpen(true);
  }, []);

  // ========== STATS ==========
  const stats = {
    totalPlans: plans.length,
    activePlans: plans.filter((p) => p.is_active).length,
    templates: plans.filter((p) => p.is_template).length,
    totalBlocks: blocks.length,
    completedBlocks: blocks.filter((b) => b.status === "completed").length,
    totalGoals: goals.length,
    achievedGoals: goals.filter((g) => g.is_achieved).length,
  };

  // ========== FILTERED ==========
  const filteredPlans = plans.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.target_exam.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyBadge = (level: string) => {
    const config: Record<string, { label: string; className: string }> = {
      easy: { label: "Leve", className: "bg-green-500/20 text-green-400" },
      medium: { label: "Moderado", className: "bg-yellow-500/20 text-yellow-400" },
      hard: { label: "Intenso", className: "bg-orange-500/20 text-orange-400" },
      intensive: { label: "Muito Intenso", className: "bg-red-500/20 text-red-400" },
    };
    return config[level] || config.medium;
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Gestão de Cronogramas
          </h1>
          <p className="text-muted-foreground mt-1">
            Planos de estudo, blocos e metas dos alunos
          </p>
        </div>
        <Button onClick={handleNewPlan} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total de Planos"
          value={stats.totalPlans}
          icon={Layers}
          color="bg-blue-600"
          subtitle={`${stats.activePlans} ativos`}
        />
        <StatCard
          title="Templates"
          value={stats.templates}
          icon={Copy}
          color="bg-purple-600"
          subtitle="Públicos"
        />
        <StatCard
          title="Blocos de Estudo"
          value={stats.totalBlocks}
          icon={Clock}
          color="bg-cyan-600"
          subtitle={`${stats.completedBlocks} concluídos`}
        />
        <StatCard
          title="Metas"
          value={stats.totalGoals}
          icon={Target}
          color="bg-emerald-600"
          subtitle={`${stats.achievedGoals} alcançadas`}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="plans" className="gap-2">
              <Layers className="h-4 w-4" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="blocks" className="gap-2">
              <Clock className="h-4 w-4" />
              Blocos
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2">
              <Target className="h-4 w-4" />
              Metas
            </TabsTrigger>
          </TabsList>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          {loadingPlans ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : filteredPlans.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum plano encontrado</p>
                <Button variant="outline" onClick={handleNewPlan} className="mt-4">
                  Criar primeiro plano
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredPlans.map((plan) => {
                  const diffBadge = getDifficultyBadge(plan.difficulty_level);
                  return (
                    <motion.div
                      key={plan.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card className="hover:border-primary/50 transition-colors h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg line-clamp-1">
                                {plan.title}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {plan.description || "Sem descrição"}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {plan.is_template && (
                                <Badge variant="secondary" className="text-xs">
                                  Template
                                </Badge>
                              )}
                              {!plan.is_active && (
                                <Badge variant="destructive" className="text-xs">
                                  Inativo
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="gap-1">
                              <BookOpen className="h-3 w-3" />
                              {plan.target_exam}
                            </Badge>
                            <Badge className={cn("gap-1", diffBadge.className)}>
                              <Zap className="h-3 w-3" />
                              {diffBadge.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {plan.duration_weeks} semanas
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {plan.weekly_hours}h/sem
                            </span>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPlan(plan)}
                              className="flex-1"
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => duplicatePlanMutation.mutate(plan)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Excluir este plano?")) {
                                  deletePlanMutation.mutate(plan.id);
                                }
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Blocks Tab */}
        <TabsContent value="blocks" className="space-y-4">
          {blocks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum bloco de estudo registrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Blocos são criados quando alunos usam cronogramas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {blocks.slice(0, 12).map((block) => (
                <Card key={block.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5"
                        style={{ backgroundColor: block.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{block.title}</h4>
                        <p className="text-sm text-muted-foreground">{block.subject}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {block.activity_type}
                          </Badge>
                          <Badge
                            className={cn(
                              "text-xs",
                              block.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : block.status === "in_progress"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {block.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {block.duration_minutes} min • Semana {block.week_number}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          {goals.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma meta registrada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Metas são definidas pelos alunos em seus cronogramas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goals.slice(0, 12).map((goal) => (
                <Card key={goal.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{goal.title}</h4>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {goal.description}
                          </p>
                        )}
                      </div>
                      {goal.is_achieved ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">
                          {goal.current_value}/{goal.target_value} {goal.unit}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="outline" className="text-xs">
                          {goal.goal_type}
                        </Badge>
                        {goal.subject && (
                          <Badge variant="secondary" className="text-xs">
                            {goal.subject}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Plan Dialog */}
      <PlanDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        plan={selectedPlan}
        onSave={handleSavePlan}
      />
    </div>
  );
}
