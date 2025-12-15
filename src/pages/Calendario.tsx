// ============================================
// MOISÉS MEDEIROS v7.0 - CALENDÁRIO
// Spider-Man Theme - Gestão de Tarefas
// Elementos de Química Integrados
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  AlertCircle,
  Filter,
  Trash2,
  Edit2,
  FlaskConical,
  Atom
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AnimatedAtom, ChemistryTip } from "@/components/chemistry/ChemistryVisuals";
import calendarHeroImage from "@/assets/calendar-chemistry-hero.jpg";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  startOfWeek,
  endOfWeek,
  addYears
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_date: string;
  task_time: string | null;
  is_completed: boolean;
  priority: string;
  category: string;
  reminder_enabled: boolean;
}

const PRIORITIES = [
  { value: "low", label: "Baixa", color: "text-muted-foreground" },
  { value: "normal", label: "Normal", color: "text-[hsl(var(--stats-blue))]" },
  { value: "high", label: "Alta", color: "text-[hsl(var(--stats-gold))]" },
  { value: "urgent", label: "Urgente", color: "text-destructive" },
];

const CATEGORIES = [
  "Geral", "Reunião", "Curso", "Marketing", "Financeiro", "Pessoal", "Equipe", "Site"
];

export default function Calendario() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    task_date: format(new Date(), "yyyy-MM-dd"),
    task_time: "",
    priority: "normal",
    category: "Geral",
    reminder_enabled: false,
  });

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear + i);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [currentDate]);

  const fetchTasks = async () => {
    try {
      const startDate = startOfMonth(subMonths(currentDate, 1));
      const endDate = endOfMonth(addMonths(currentDate, 1));

      const { data, error } = await supabase
        .from("calendar_tasks")
        .select("*")
        .gte("task_date", format(startDate, "yyyy-MM-dd"))
        .lte("task_date", format(endDate, "yyyy-MM-dd"))
        .order("task_date", { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { locale: ptBR });
    const end = endOfWeek(endOfMonth(currentDate), { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => 
      isSameDay(new Date(task.task_date), date) &&
      (filterPriority === "all" || task.priority === filterPriority)
    );
  };

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return getTasksForDate(selectedDate);
  }, [selectedDate, tasks, filterPriority]);

  const openModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || "",
        task_date: task.task_date,
        task_time: task.task_time || "",
        priority: task.priority,
        category: task.category,
        reminder_enabled: task.reminder_enabled,
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: "",
        description: "",
        task_date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        task_time: "",
        priority: "normal",
        category: "Geral",
        reminder_enabled: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: "Erro", description: "Título é obrigatório", variant: "destructive" });
      return;
    }

    try {
      if (editingTask) {
        const { error } = await supabase
          .from("calendar_tasks")
          .update({
            title: formData.title,
            description: formData.description || null,
            task_date: formData.task_date,
            task_time: formData.task_time || null,
            priority: formData.priority,
            category: formData.category,
            reminder_enabled: formData.reminder_enabled,
          })
          .eq("id", editingTask.id);

        if (error) throw error;
        toast({ title: "Tarefa atualizada!" });
      } else {
        const { error } = await supabase.from("calendar_tasks").insert({
          user_id: user?.id,
          title: formData.title,
          description: formData.description || null,
          task_date: formData.task_date,
          task_time: formData.task_time || null,
          priority: formData.priority,
          category: formData.category,
          reminder_enabled: formData.reminder_enabled,
        });

        if (error) throw error;
        toast({ title: "Tarefa criada!" });
      }

      await fetchTasks();
      setIsModalOpen(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const toggleComplete = async (task: Task) => {
    try {
      const { error } = await supabase
        .from("calendar_tasks")
        .update({ is_completed: !task.is_completed })
        .eq("id", task.id);

      if (error) throw error;
      
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
      ));
      
      toast({ title: task.is_completed ? "Tarefa reaberta" : "Tarefa concluída! ✓" });
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from("calendar_tasks").delete().eq("id", id);
      if (error) throw error;
      
      setTasks(prev => prev.filter(t => t.id !== id));
      toast({ title: "Tarefa removida" });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "urgent": return "border-l-destructive bg-destructive/5";
      case "high": return "border-l-[hsl(var(--stats-gold))] bg-[hsl(var(--stats-gold))]/5";
      case "normal": return "border-l-[hsl(var(--stats-blue))] bg-[hsl(var(--stats-blue))]/5";
      default: return "border-l-muted-foreground bg-muted/20";
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="space-y-2">
            <motion.div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium tracking-wide uppercase">Organização</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Calendário
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Agenda organizacional com tarefas e lembretes.
            </p>
          </div>
        </motion.header>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Select 
                value={format(currentDate, "MM")} 
                onValueChange={(v) => setCurrentDate(new Date(currentDate.getFullYear(), parseInt(v) - 1, 1))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>
                      {format(new Date(2024, i, 1), "MMMM", { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                value={String(currentDate.getFullYear())} 
                onValueChange={(v) => setCurrentDate(new Date(parseInt(v), currentDate.getMonth(), 1))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
              Hoje
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => openModal()} className="gap-2">
              <Plus className="h-4 w-4" /> Nova Tarefa
            </Button>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass-card rounded-2xl p-4"
          >
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayTasks = getTasksForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasUrgent = dayTasks.some(t => t.priority === "urgent" && !t.is_completed);
                const hasIncomplete = dayTasks.some(t => !t.is_completed);

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "relative aspect-square p-1 rounded-lg transition-all text-sm",
                      isCurrentMonth ? "text-foreground" : "text-muted-foreground/50",
                      isToday(day) && "ring-2 ring-primary",
                      isSelected && "bg-primary text-primary-foreground",
                      !isSelected && "hover:bg-secondary/50"
                    )}
                  >
                    <span className="block">{format(day, "d")}</span>
                    {dayTasks.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {hasUrgent && <div className="w-1.5 h-1.5 rounded-full bg-destructive" />}
                        {hasIncomplete && !hasUrgent && <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--stats-blue))]" />}
                        {dayTasks.every(t => t.is_completed) && <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--stats-green))]" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                Urgente
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--stats-blue))]" />
                Pendente
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--stats-green))]" />
                Concluído
              </div>
            </div>
          </motion.div>

          {/* Selected Day Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">
                  {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: ptBR }) : "Selecione um dia"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedDate ? format(selectedDate, "EEEE", { locale: ptBR }) : ""}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => openModal()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {selectedDateTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma tarefa para este dia
                </p>
              ) : (
                selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "p-3 rounded-lg border-l-4 transition-all",
                      getPriorityStyle(task.priority),
                      task.is_completed && "opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={task.is_completed}
                        onCheckedChange={() => toggleComplete(task)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium text-foreground",
                          task.is_completed && "line-through"
                        )}>
                          {task.title}
                        </p>
                        {task.task_time && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {task.task_time}
                          </p>
                        )}
                        <span className="text-xs text-muted-foreground">{task.category}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openModal(task)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive" 
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Editar" : "Nova"} Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="O que precisa ser feito?"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detalhes adicionais..."
                  className="mt-1.5"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.task_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, task_date: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={formData.task_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, task_time: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="reminder"
                  checked={formData.reminder_enabled}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, reminder_enabled: !!v }))}
                />
                <Label htmlFor="reminder" className="text-sm">Ativar lembrete por email</Label>
              </div>

              <Button onClick={handleSave} className="w-full">
                {editingTask ? "Salvar Alterações" : "Criar Tarefa"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
