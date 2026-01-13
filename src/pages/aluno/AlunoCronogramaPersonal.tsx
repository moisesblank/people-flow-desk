// ============================================
// 📅 CRONOGRAMA PESSOAL DO ALUNO — v1.0
// Sistema completo de gestão de tarefas pessoais
// ============================================

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth, addMonths, subMonths, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, 
  Clock, CheckCircle2, Circle, Trash2, Edit2, HelpCircle,
  Sparkles, Target, BookOpen, Brain, Dumbbell, Coffee,
  X, AlertCircle, Bell, Star, Filter, LayoutGrid, List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// ===========================================
// TIPOS
// ===========================================

interface CalendarTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  task_date: string;
  task_time: string | null;
  is_completed: boolean;
  reminder_enabled: boolean;
  reminder_email: string | null;
  priority: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

// ===========================================
// CATEGORIAS E PRIORIDADES
// ===========================================

const CATEGORIES = [
  { value: 'estudo', label: 'Estudo', icon: BookOpen, color: 'text-blue-500 bg-blue-500/10' },
  { value: 'revisao', label: 'Revisão', icon: Brain, color: 'text-purple-500 bg-purple-500/10' },
  { value: 'questoes', label: 'Questões', icon: Target, color: 'text-orange-500 bg-orange-500/10' },
  { value: 'exercicio', label: 'Exercício Físico', icon: Dumbbell, color: 'text-green-500 bg-green-500/10' },
  { value: 'pausa', label: 'Pausa/Lazer', icon: Coffee, color: 'text-amber-500 bg-amber-500/10' },
  { value: 'outro', label: 'Outro', icon: Star, color: 'text-gray-500 bg-gray-500/10' },
];

const PRIORITIES = [
  { value: 'alta', label: 'Alta', color: 'bg-red-500' },
  { value: 'media', label: 'Média', color: 'bg-yellow-500' },
  { value: 'baixa', label: 'Baixa', color: 'bg-green-500' },
];

// ===========================================
// COMPONENTE DE TUTORIAL
// ===========================================

function TutorialBanner({ onDismiss }: { onDismiss: () => void }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6"
    >
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-purple-500/5">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Como usar seu Cronograma Pessoal
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <strong>Clique no +</strong> para adicionar uma nova tarefa em qualquer dia
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <strong>Clique na tarefa</strong> para marcar como concluída ou editar
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <strong>Use categorias</strong> para organizar (Estudo, Revisão, Questões...)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <strong>Defina prioridades</strong> para saber o que é mais urgente
                  </li>
                </ul>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setIsOpen(false); onDismiss(); }}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ===========================================
// MODAL DE TAREFA
// ===========================================

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: CalendarTask | null;
  selectedDate: Date;
  onSave: (data: Partial<CalendarTask>) => void;
  onDelete?: () => void;
}

function TaskModal({ isOpen, onClose, task, selectedDate, onSave, onDelete }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [taskTime, setTaskTime] = useState(task?.task_time || '');
  const [priority, setPriority] = useState(task?.priority || 'media');
  const [category, setCategory] = useState(task?.category || 'estudo');
  const [reminderEnabled, setReminderEnabled] = useState(task?.reminder_enabled || false);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Digite um título para a tarefa');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim() || null,
      task_date: format(selectedDate, 'yyyy-MM-dd'),
      task_time: taskTime || null,
      priority,
      category,
      reminder_enabled: reminderEnabled,
      is_completed: task?.is_completed || false,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {task ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
          <DialogDescription>
            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Estudar Química Orgânica"
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes da tarefa..."
              rows={2}
            />
          </div>

          {/* Hora */}
          <div className="space-y-2">
            <Label htmlFor="time">Horário (opcional)</Label>
            <Input
              id="time"
              type="time"
              value={taskTime}
              onChange={(e) => setTaskTime(e.target.value)}
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <cat.icon className="h-4 w-4" />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <Button
                  key={p.value}
                  type="button"
                  variant={priority === p.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPriority(p.value)}
                  className={cn(priority === p.value && p.color)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Lembrete */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="reminder">Lembrete por email</Label>
            </div>
            <Switch
              id="reminder"
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {task && onDelete && (
            <Button variant="destructive" onClick={onDelete} className="mr-auto">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>
            {task ? 'Salvar' : 'Criar Tarefa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================================
// COMPONENTE PRINCIPAL
// ===========================================

export default function AlunoCronogramaPersonal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem('cronograma_tutorial_dismissed') !== 'true';
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Buscar tarefas do mês atual
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['calendar-tasks', user?.id, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('calendar_tasks')
        .select('*')
        .eq('user_id', user.id)
        .gte('task_date', start)
        .lte('task_date', end)
        .order('task_date', { ascending: true })
        .order('task_time', { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      return data as CalendarTask[];
    },
    enabled: !!user?.id,
  });

  // Criar tarefa
  const createMutation = useMutation({
    mutationFn: async (data: Partial<CalendarTask>) => {
      const { error } = await supabase
        .from('calendar_tasks')
        .insert({
          user_id: user!.id,
          title: data.title,
          description: data.description,
          task_date: data.task_date,
          task_time: data.task_time,
          priority: data.priority,
          category: data.category,
          reminder_enabled: data.reminder_enabled || false,
          is_completed: false,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      toast.success('Tarefa criada!');
      setIsModalOpen(false);
      setSelectedDate(null);
    },
    onError: () => toast.error('Erro ao criar tarefa'),
  });

  // Atualizar tarefa
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CalendarTask> }) => {
      const { error } = await supabase
        .from('calendar_tasks')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      toast.success('Tarefa atualizada!');
      setIsModalOpen(false);
      setEditingTask(null);
    },
    onError: () => toast.error('Erro ao atualizar tarefa'),
  });

  // Deletar tarefa
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      toast.success('Tarefa excluída!');
      setIsModalOpen(false);
      setEditingTask(null);
    },
    onError: () => toast.error('Erro ao excluir tarefa'),
  });

  // Toggle completed
  const toggleCompleted = async (task: CalendarTask) => {
    const { error } = await supabase
      .from('calendar_tasks')
      .update({ is_completed: !task.is_completed })
      .eq('id', task.id);
    
    if (error) {
      toast.error('Erro ao atualizar tarefa');
    } else {
      queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      toast.success(task.is_completed ? 'Tarefa reaberta' : 'Tarefa concluída! 🎉');
    }
  };

  // Dias do mês com padding para semana
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Tarefas filtradas
  const filteredTasks = useMemo(() => {
    if (!filterCategory) return tasks;
    return tasks.filter(t => t.category === filterCategory);
  }, [tasks, filterCategory]);

  // Tarefas por dia
  const tasksByDay = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    filteredTasks.forEach(task => {
      const key = task.task_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    return map;
  }, [filteredTasks]);

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.is_completed).length;
    const pending = total - completed;
    const todayTasks = tasks.filter(t => isSameDay(parseISO(t.task_date), new Date()));
    return { total, completed, pending, todayCount: todayTasks.length };
  }, [tasks]);

  const handleDismissTutorial = () => {
    localStorage.setItem('cronograma_tutorial_dismissed', 'true');
    setShowTutorial(false);
  };

  const handleOpenNewTask = (date: Date) => {
    setSelectedDate(date);
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEditTask = (task: CalendarTask) => {
    setSelectedDate(parseISO(task.task_date));
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (data: Partial<CalendarTask>) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteTask = () => {
    if (editingTask) {
      deleteMutation.mutate(editingTask.id);
    }
  };

  const getCategoryInfo = (categoryValue: string | null) => {
    return CATEGORIES.find(c => c.value === categoryValue) || CATEGORIES[5];
  };

  const getPriorityInfo = (priorityValue: string | null) => {
    return PRIORITIES.find(p => p.value === priorityValue) || PRIORITIES[1];
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/10 border border-primary/30">
            <CalendarIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
              Meu Cronograma
            </h1>
            <p className="text-muted-foreground text-sm">
              Organize suas tarefas e estudos de forma personalizada
            </p>
          </div>
        </div>
      </div>

      {/* Tutorial */}
      <AnimatePresence>
        {showTutorial && <TutorialBanner onDismiss={handleDismissTutorial} />}
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Circle className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{stats.todayCount}</p>
              <p className="text-xs text-muted-foreground">Hoje</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[160px] text-center">
            <h2 className="text-lg font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
          </div>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro de categoria */}
          <Select value={filterCategory || 'all'} onValueChange={(v) => setFilterCategory(v === 'all' ? null : v)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <cat.icon className="h-4 w-4" />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Toggle view */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Add task */}
          <Button onClick={() => handleOpenNewTask(new Date())}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'calendar' ? (
        <Card>
          <CardContent className="p-4">
            {/* Week headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayTasks = tasksByDay.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);

                return (
                  <motion.div
                    key={dateKey}
                    className={cn(
                      "min-h-[100px] p-2 rounded-lg border transition-colors",
                      isCurrentMonth ? 'bg-background' : 'bg-muted/30 opacity-50',
                      isCurrentDay && 'border-primary ring-1 ring-primary/30',
                      !isCurrentDay && 'border-border/50 hover:border-primary/50'
                    )}
                  >
                    {/* Day header */}
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-sm font-medium",
                        isCurrentDay && "text-primary font-bold"
                      )}>
                        {format(day, 'd')}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
                        onClick={() => handleOpenNewTask(day)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Tasks */}
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((task) => {
                        const catInfo = getCategoryInfo(task.category);
                        return (
                          <button
                            key={task.id}
                            onClick={() => handleOpenEditTask(task)}
                            className={cn(
                              "w-full text-left px-2 py-1 rounded text-xs truncate transition-all",
                              catInfo.color,
                              task.is_completed && "line-through opacity-60"
                            )}
                          >
                            {task.task_time && (
                              <span className="font-medium mr-1">{task.task_time.slice(0, 5)}</span>
                            )}
                            {task.title}
                          </button>
                        );
                      })}
                      {dayTasks.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{dayTasks.length - 3} mais
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Nenhuma tarefa este mês</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comece adicionando suas atividades de estudo
                </p>
                <Button onClick={() => handleOpenNewTask(new Date())}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira tarefa
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task) => {
                  const catInfo = getCategoryInfo(task.category);
                  const prioInfo = getPriorityInfo(task.priority);
                  const CatIcon = catInfo.icon;
                  
                  return (
                    <motion.div
                      key={task.id}
                      layout
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        task.is_completed && "opacity-60 bg-muted/30"
                      )}
                    >
                      <Checkbox
                        checked={task.is_completed}
                        onCheckedChange={() => toggleCompleted(task)}
                      />
                      
                      <div className={cn("p-2 rounded-lg", catInfo.color)}>
                        <CatIcon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium truncate",
                          task.is_completed && "line-through"
                        )}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(parseISO(task.task_date), "dd 'de' MMM", { locale: ptBR })}</span>
                          {task.task_time && (
                            <>
                              <span>•</span>
                              <Clock className="h-3 w-3" />
                              <span>{task.task_time.slice(0, 5)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className={cn("w-2 h-2 rounded-full", prioInfo.color)} />
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditTask(task)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        task={editingTask}
        selectedDate={selectedDate || new Date()}
        onSave={handleSaveTask}
        onDelete={editingTask ? handleDeleteTask : undefined}
      />

      {/* Help Button */}
      {!showTutorial && (
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-6 right-6 gap-2"
          onClick={() => setShowTutorial(true)}
        >
          <HelpCircle className="h-4 w-4" />
          Ajuda
        </Button>
      )}
    </div>
  );
}
