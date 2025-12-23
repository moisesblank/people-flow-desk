import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  Wallet,
  PiggyBank,
  Car,
  Home,
  GraduationCap,
  Plane,
  Heart,
  Shield,
  Loader2,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FinancialGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  category: string;
  priority: string;
  deadline: string | null;
  status: string;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

const iconMap: Record<string, React.ElementType> = {
  Target,
  Wallet,
  PiggyBank,
  Car,
  Home,
  GraduationCap,
  Plane,
  Heart,
  Shield,
  TrendingUp
};

const categoryLabels: Record<string, string> = {
  savings: "Poupança",
  investment: "Investimento",
  emergency: "Reserva de Emergência",
  travel: "Viagem",
  education: "Educação",
  vehicle: "Veículo",
  property: "Imóvel",
  health: "Saúde",
  other: "Outros"
};

const priorityColors: Record<string, string> = {
  low: "text-stats-blue",
  medium: "text-stats-gold",
  high: "text-primary"
};

export function FinancialGoalsWidget() {
  const { user } = useAuth();
  const { gpuAnimationProps, shouldAnimate } = useQuantumReactivity();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [addingProgress, setAddingProgress] = useState<string | null>(null);
  const [progressAmount, setProgressAmount] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_amount: "",
    current_amount: "",
    category: "savings",
    priority: "medium",
    deadline: "",
    icon: "Target"
  });

  useEffect(() => {
    if (user) {
      fetchGoals();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('financial_goals_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'financial_goals'
          },
          () => fetchGoals()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("financial_goals")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const goalData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description || null,
        target_amount: parseFloat(formData.target_amount) || 0,
        current_amount: parseFloat(formData.current_amount) || 0,
        category: formData.category,
        priority: formData.priority,
        deadline: formData.deadline || null,
        icon: formData.icon,
        status: "active"
      };

      if (editingGoal) {
        const { error } = await supabase
          .from("financial_goals")
          .update(goalData)
          .eq("id", editingGoal.id);
        if (error) throw error;
        toast.success("Meta atualizada!");
      } else {
        const { error } = await supabase
          .from("financial_goals")
          .insert(goalData);
        if (error) throw error;
        toast.success("Meta criada!");
      }

      resetForm();
      fetchGoals();
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Erro ao salvar meta");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("financial_goals")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Meta removida!");
      fetchGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Erro ao remover meta");
    }
  };

  const handleAddProgress = async (goalId: string) => {
    if (!progressAmount) return;
    
    const amount = parseFloat(progressAmount);
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    try {
      const { error: updateError } = await supabase
        .from("financial_goals")
        .update({ current_amount: goal.current_amount + amount })
        .eq("id", goalId);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from("goal_progress_history")
        .insert({
          goal_id: goalId,
          amount: amount
        });

      if (historyError) throw historyError;

      toast.success(`R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} adicionado!`);
      setAddingProgress(null);
      setProgressAmount("");
      fetchGoals();
    } catch (error) {
      console.error("Error adding progress:", error);
      toast.error("Erro ao adicionar progresso");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      target_amount: "",
      current_amount: "",
      category: "savings",
      priority: "medium",
      deadline: "",
      icon: "Target"
    });
    setEditingGoal(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      category: goal.category,
      priority: goal.priority,
      deadline: goal.deadline || "",
      icon: goal.icon || "Target"
    });
    setIsDialogOpen(true);
  };

  const calculateProgress = (current: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Metas Financeiras</h3>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1 rounded-xl h-8">
              <Plus className="h-3.5 w-3.5" />
              Nova
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? "Editar Meta" : "Nova Meta Financeira"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Reserva de emergência"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_amount">Valor Alvo</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_amount">Valor Atual</Label>
                  <Input
                    id="current_amount"
                    type="number"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Prazo (opcional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Ícone</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(iconMap).map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  {editingGoal ? "Atualizar" : "Criar Meta"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-8">
          <Target className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhuma meta criada ainda
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {goals.map((goal, index) => {
              const progress = calculateProgress(goal.current_amount, goal.target_amount);
              const IconComponent = iconMap[goal.icon || "Target"] || Target;
              const isComplete = progress >= 100;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-1.5 rounded-lg ${isComplete ? "bg-stats-green/10" : "bg-primary/10"}`}>
                      <IconComponent className={`h-4 w-4 ${isComplete ? "text-stats-green" : "text-primary"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">{goal.title}</span>
                        {isComplete && (
                          <CheckCircle2 className="h-4 w-4 text-stats-green shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => openEditDialog(goal)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(goal.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <Progress 
                    value={progress} 
                    className={`h-1.5 ${isComplete ? "[&>div]:bg-stats-green" : "[&>div]:bg-primary"}`}
                  />
                  
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(goal.current_amount)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(goal.target_amount)}
                    </span>
                  </div>

                  {/* Quick Add Progress */}
                  {!isComplete && (
                    <div className="mt-2">
                      {addingProgress === goal.id ? (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Valor"
                            value={progressAmount}
                            onChange={(e) => setProgressAmount(e.target.value)}
                            className="h-7 text-xs"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddProgress(goal.id)}
                            className="h-7 px-2 bg-stats-green hover:bg-stats-green/90"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => {
                              setAddingProgress(null);
                              setProgressAmount("");
                            }}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs w-full"
                          onClick={() => setAddingProgress(goal.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Adicionar
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
