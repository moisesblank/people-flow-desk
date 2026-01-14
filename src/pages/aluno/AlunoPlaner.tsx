// ============================================
// 🚀 PLANER DIÁRIO DO ALUNO — Year 2300 Edition
// Sistema ULTRA-ÚTIL para organização diária
// ============================================

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth, addMonths, subMonths, parseISO, startOfWeek, endOfWeek, addDays, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, 
  Clock, CheckCircle2, Circle, Trash2, Edit2, HelpCircle,
  Sparkles, Target, BookOpen, Brain, Dumbbell, Coffee,
  X, AlertCircle, Bell, Star, Filter, LayoutGrid, List,
  Flame, Trophy, Zap, TrendingUp, Moon, Sun, Sunrise,
  Video, FileQuestion, CalendarCheck, Lightbulb, MousePointer, Pencil,
  Play, BookMarked, ClipboardList, GraduationCap, ArrowRight
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
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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
// CATEGORIAS E PRIORIDADES MELHORADAS
// ===========================================

const CATEGORIES = [
  { value: 'videoaula', label: 'Videoaula', icon: Video, color: 'text-purple-500 bg-purple-500/10', gradient: 'from-purple-500 to-pink-500' },
  { value: 'estudo', label: 'Estudo', icon: BookOpen, color: 'text-blue-500 bg-blue-500/10', gradient: 'from-blue-500 to-cyan-500' },
  { value: 'revisao', label: 'Revisão', icon: Brain, color: 'text-indigo-500 bg-indigo-500/10', gradient: 'from-indigo-500 to-violet-500' },
  { value: 'simulado', label: 'Simulado', icon: ClipboardList, color: 'text-orange-500 bg-orange-500/10', gradient: 'from-orange-500 to-amber-500' },
  { value: 'questoes', label: 'Questões', icon: FileQuestion, color: 'text-green-500 bg-green-500/10', gradient: 'from-green-500 to-emerald-500' },
  { value: 'leitura', label: 'Leitura', icon: BookMarked, color: 'text-rose-500 bg-rose-500/10', gradient: 'from-rose-500 to-pink-500' },
  { value: 'exercicio', label: 'Exercício', icon: Dumbbell, color: 'text-teal-500 bg-teal-500/10', gradient: 'from-teal-500 to-cyan-500' },
  { value: 'pausa', label: 'Pausa', icon: Coffee, color: 'text-amber-500 bg-amber-500/10', gradient: 'from-amber-500 to-yellow-500' },
  { value: 'outro', label: 'Outro', icon: Star, color: 'text-gray-500 bg-gray-500/10', gradient: 'from-gray-500 to-slate-500' },
];

const PRIORITIES = [
  { value: 'urgente', label: 'Urgente', color: 'bg-red-500', textColor: 'text-red-500', icon: Flame },
  { value: 'alta', label: 'Alta', color: 'bg-orange-500', textColor: 'text-orange-500', icon: Zap },
  { value: 'media', label: 'Média', color: 'bg-yellow-500', textColor: 'text-yellow-500', icon: Target },
  { value: 'baixa', label: 'Baixa', color: 'bg-green-500', textColor: 'text-green-500', icon: Circle },
];

const TIME_BLOCKS = [
  { value: 'manha', label: 'Manhã (6h-12h)', icon: Sunrise, range: [6, 12] },
  { value: 'tarde', label: 'Tarde (12h-18h)', icon: Sun, range: [12, 18] },
  { value: 'noite', label: 'Noite (18h-23h)', icon: Moon, range: [18, 23] },
];

// ===========================================
// QUICK ACTIONS - Atalhos rápidos
// ===========================================

const QUICK_ACTIONS = [
  { 
    id: 'videoaulas', 
    label: 'Videoaulas', 
    icon: Video, 
    url: '/alunos/videoaulas',
    color: 'from-purple-500 to-pink-500',
    description: 'Assistir aulas'
  },
  { 
    id: 'materiais', 
    label: 'Materiais', 
    icon: BookOpen, 
    url: '/alunos/materiais',
    color: 'from-blue-500 to-cyan-500',
    description: 'PDFs e apostilas'
  },
  { 
    id: 'simulados', 
    label: 'Simulados', 
    icon: ClipboardList, 
    url: '/alunos/simulados',
    color: 'from-orange-500 to-amber-500',
    description: 'Testar conhecimento'
  },
  { 
    id: 'questoes', 
    label: 'Questões', 
    icon: FileQuestion, 
    url: '/alunos/questoes',
    color: 'from-green-500 to-emerald-500',
    description: 'Praticar exercícios'
  },
  { 
    id: 'livros', 
    label: 'Livros', 
    icon: BookMarked, 
    url: '/alunos/livro-web',
    color: 'from-rose-500 to-pink-500',
    description: 'Biblioteca digital'
  },
  { 
    id: 'planejamento', 
    label: 'Hub Central', 
    icon: Target, 
    url: '/alunos/planejamento',
    color: 'from-indigo-500 to-violet-500',
    description: 'Visão geral'
  },
];

// ===========================================
// GUIA INICIAL - Como usar
// ===========================================

function InitialGuide({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6"
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-purple-500/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  COMO USAR O PLANER
                </h3>
                <p className="text-xs text-muted-foreground">Seu organizador diário pessoal</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="shrink-0 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 3 Passos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs font-bold">1</div>
                <span className="font-semibold text-blue-400">Adicione Tarefas</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Clique em <strong className="text-foreground">+ Nova Tarefa</strong> ou no <strong className="text-foreground">+</strong> de qualquer dia para criar.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white text-xs font-bold">2</div>
                <span className="font-semibold text-green-400">Organize por Categoria</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Use categorias como <strong className="text-foreground">Videoaula</strong>, <strong className="text-foreground">Simulado</strong>, <strong className="text-foreground">Revisão</strong> para organizar.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">3</div>
                <span className="font-semibold text-purple-400">Complete e Evolua</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Marque tarefas como <strong className="text-foreground">concluídas</strong> e acompanhe seu progresso diário!
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-amber-400">Dica de Ouro:</strong> Use os <strong className="text-foreground">Atalhos Rápidos</strong> abaixo para ir direto às áreas de estudo e depois volte aqui para marcar como concluído!
            </p>
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

  // Reset form when task changes
  useState(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setTaskTime(task.task_time || '');
      setPriority(task.priority || 'media');
      setCategory(task.category || 'estudo');
      setReminderEnabled(task.reminder_enabled);
    } else {
      setTitle('');
      setDescription('');
      setTaskTime('');
      setPriority('media');
      setCategory('estudo');
      setReminderEnabled(false);
    }
  });

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

  const selectedCategory = CATEGORIES.find(c => c.value === category);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg bg-gradient-to-br", selectedCategory?.gradient || 'from-primary to-purple-500')}>
              {selectedCategory?.icon && <selectedCategory.icon className="h-4 w-4 text-white" />}
            </div>
            {task ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">O que você vai fazer? *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Assistir aula de Química Orgânica"
              autoFocus
              className="text-base"
            />
          </div>

          {/* Categoria com visual melhorado */}
          <div className="space-y-2">
            <Label>Tipo de Atividade</Label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all",
                    category === cat.value
                      ? `bg-gradient-to-br ${cat.gradient} text-white border-transparent`
                      : "bg-background hover:bg-muted/50 border-border"
                  )}
                >
                  <cat.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.slice(6).map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all",
                    category === cat.value
                      ? `bg-gradient-to-br ${cat.gradient} text-white border-transparent`
                      : "bg-background hover:bg-muted/50 border-border"
                  )}
                >
                  <cat.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hora e Prioridade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                type="time"
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <div className="flex gap-1">
                {PRIORITIES.map((p) => {
                  const PrioIcon = p.icon;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg border transition-all text-xs",
                        priority === p.value
                          ? `${p.color} text-white border-transparent`
                          : "bg-background hover:bg-muted/50 border-border"
                      )}
                    >
                      <PrioIcon className="h-3 w-3" />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Anotações (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes, links, observações..."
              rows={2}
            />
          </div>

          {/* Lembrete */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="reminder" className="text-sm cursor-pointer">Lembrete por email</Label>
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
          <Button onClick={handleSubmit} className="bg-gradient-to-r from-primary to-purple-600">
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

export default function AlunoPlaner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem('planer_guide_dismissed') !== 'true';
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'today'>('today');
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
      toast.success('Tarefa criada! 🎯');
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

  // Tarefas de hoje
  const todayTasks = useMemo(() => {
    const today = startOfDay(new Date());
    return filteredTasks.filter(t => isSameDay(parseISO(t.task_date), today));
  }, [filteredTasks]);

  // Tarefas atrasadas
  const overdueTasks = useMemo(() => {
    const today = startOfDay(new Date());
    return filteredTasks.filter(t => 
      isBefore(parseISO(t.task_date), today) && !t.is_completed
    );
  }, [filteredTasks]);

  // Próximos 7 dias
  const upcomingTasks = useMemo(() => {
    const today = startOfDay(new Date());
    const weekEnd = addDays(today, 7);
    return filteredTasks.filter(t => {
      const taskDate = parseISO(t.task_date);
      return !isBefore(taskDate, today) && isBefore(taskDate, weekEnd) && !isSameDay(taskDate, today);
    });
  }, [filteredTasks]);

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

  // Stats melhorados
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.is_completed).length;
    const pending = total - completed;
    const todayTotal = todayTasks.length;
    const todayCompleted = todayTasks.filter(t => t.is_completed).length;
    const overdueCount = overdueTasks.length;
    const streak = completed >= 3 ? Math.floor(completed / 3) : 0;
    const progressPercent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
    
    return { total, completed, pending, todayTotal, todayCompleted, overdueCount, streak, progressPercent };
  }, [tasks, todayTasks, overdueTasks]);

  const handleDismissGuide = () => {
    localStorage.setItem('planer_guide_dismissed', 'true');
    setShowGuide(false);
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
    return CATEGORIES.find(c => c.value === categoryValue) || CATEGORIES[1];
  };

  const getPriorityInfo = (priorityValue: string | null) => {
    return PRIORITIES.find(p => p.value === priorityValue) || PRIORITIES[2];
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* HERO HEADER */}
      <div className="mb-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 border border-primary/30 p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-2xl" />
          
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/30">
                <CalendarCheck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
                  Meu Planer
                </h1>
                <p className="text-muted-foreground text-sm">
                  Organize seu dia • Conquiste seus objetivos
                </p>
              </div>
            </div>

            {/* Progress de hoje */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
              <div className="text-center">
                <div className="text-3xl font-black text-primary">{stats.todayCompleted}/{stats.todayTotal}</div>
                <p className="text-xs text-muted-foreground">Tarefas Hoje</p>
              </div>
              <div className="w-20">
                <Progress value={stats.progressPercent} className="h-3" />
                <p className="text-xs text-center text-muted-foreground mt-1">{stats.progressPercent}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GUIA INICIAL */}
      <AnimatePresence>
        {showGuide && <InitialGuide onDismiss={handleDismissGuide} />}
      </AnimatePresence>

      {/* QUICK ACTIONS - Atalhos para estudar */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          ATALHOS RÁPIDOS — Vá estudar e volte para marcar como concluído
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => navigate(action.url)}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-background border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
            >
              <div className={cn("p-3 rounded-xl bg-gradient-to-br text-white transition-transform group-hover:scale-110", action.color)}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
              <span className="text-xs text-muted-foreground">{action.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total do Mês</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
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
        <Card className={cn("border-red-500/20", stats.overdueCount > 0 && "bg-gradient-to-br from-red-500/10 to-transparent")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className={cn("text-2xl font-bold", stats.overdueCount > 0 ? "text-red-500" : "text-muted-foreground")}>{stats.overdueCount}</p>
              <p className="text-xs text-muted-foreground">Atrasadas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Flame className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-500">{stats.streak}</p>
              <p className="text-xs text-muted-foreground">Streak 🔥</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border rounded-lg overflow-hidden bg-background">
            <Button
              variant={viewMode === 'today' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('today')}
              className="rounded-none gap-1"
            >
              <Sun className="h-4 w-4" />
              <span className="hidden sm:inline">Hoje</span>
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-none gap-1"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Mês</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none gap-1"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
            </Button>
          </div>

          {viewMode === 'calendar' && (
            <>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[140px] text-center">
                <h2 className="text-sm font-semibold capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </h2>
              </div>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro */}
          <Select value={filterCategory || 'all'} onValueChange={(v) => setFilterCategory(v === 'all' ? null : v)}>
            <SelectTrigger className="w-[130px]">
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

          {/* Add task */}
          <Button onClick={() => handleOpenNewTask(new Date())} className="bg-gradient-to-r from-primary to-purple-600">
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* CONTENT VIEWS */}
      {viewMode === 'today' ? (
        /* TODAY VIEW - Foco no dia */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tarefas de Hoje */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-500" />
                  Hoje — {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
                <CardDescription>
                  {todayTasks.length === 0 ? 'Nenhuma tarefa para hoje' : `${stats.todayCompleted} de ${stats.todayTotal} concluídas`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">Seu dia está livre!</p>
                    <Button onClick={() => handleOpenNewTask(new Date())} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar tarefa
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayTasks.map((task) => {
                      const catInfo = getCategoryInfo(task.category);
                      const prioInfo = getPriorityInfo(task.priority);
                      const CatIcon = catInfo.icon;
                      
                      return (
                        <motion.div
                          key={task.id}
                          layout
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-xl border transition-all",
                            task.is_completed 
                              ? "bg-green-500/5 border-green-500/20" 
                              : "bg-background hover:border-primary/30"
                          )}
                        >
                          <Checkbox
                            checked={task.is_completed}
                            onCheckedChange={() => toggleCompleted(task)}
                            className="h-5 w-5"
                          />
                          
                          <div className={cn("p-2 rounded-lg bg-gradient-to-br text-white", catInfo.gradient)}>
                            <CatIcon className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-medium",
                              task.is_completed && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              {task.task_time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {task.task_time.slice(0, 5)}
                                </span>
                              )}
                              <Badge variant="outline" className={cn("text-[10px] h-5", prioInfo.textColor)}>
                                {prioInfo.label}
                              </Badge>
                            </div>
                          </div>
                          
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

            {/* Atrasadas */}
            {overdueTasks.length > 0 && (
              <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="h-5 w-5" />
                    Atrasadas ({overdueTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {overdueTasks.slice(0, 5).map((task) => {
                      const catInfo = getCategoryInfo(task.category);
                      const CatIcon = catInfo.icon;
                      
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-background border border-red-500/20"
                        >
                          <Checkbox
                            checked={task.is_completed}
                            onCheckedChange={() => toggleCompleted(task)}
                          />
                          <div className={cn("p-1.5 rounded-lg", catInfo.color)}>
                            <CatIcon className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{task.title}</p>
                            <p className="text-xs text-red-400">
                              {format(parseISO(task.task_date), "dd 'de' MMM", { locale: ptBR })}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEditTask(task)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Próximos dias */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Próximos 7 Dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa agendada</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingTasks.slice(0, 8).map((task) => {
                      const catInfo = getCategoryInfo(task.category);
                      const CatIcon = catInfo.icon;
                      
                      return (
                        <button
                          key={task.id}
                          onClick={() => handleOpenEditTask(task)}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 text-left transition-colors"
                        >
                          <div className={cn("p-1.5 rounded", catInfo.color)}>
                            <CatIcon className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(task.task_date), "EEE, dd/MM", { locale: ptBR })}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ajuda */}
            {!showGuide && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowGuide(true)}
              >
                <HelpCircle className="h-4 w-4" />
                Como usar o Planer
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === 'calendar' ? (
        /* CALENDAR VIEW */
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayTasks = tasksByDay.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "min-h-[90px] p-2 rounded-lg border transition-colors group",
                      isCurrentMonth ? 'bg-background' : 'bg-muted/30 opacity-50',
                      isCurrentDay && 'border-primary ring-1 ring-primary/30 bg-primary/5',
                      !isCurrentDay && 'border-border/50 hover:border-primary/50'
                    )}
                  >
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
                        className="h-5 w-5 opacity-0 group-hover:opacity-100"
                        onClick={() => handleOpenNewTask(day)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 3).map((task) => {
                        const catInfo = getCategoryInfo(task.category);
                        return (
                          <button
                            key={task.id}
                            onClick={() => handleOpenEditTask(task)}
                            className={cn(
                              "w-full text-left px-1.5 py-0.5 rounded text-[10px] truncate transition-all",
                              catInfo.color,
                              task.is_completed && "line-through opacity-60"
                            )}
                          >
                            {task.title}
                          </button>
                        );
                      })}
                      {dayTasks.length > 3 && (
                        <p className="text-[10px] text-muted-foreground text-center">
                          +{dayTasks.length - 3}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* LIST VIEW */
        <Card>
          <CardContent className="p-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Nenhuma tarefa este mês</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comece adicionando suas atividades
                </p>
                <Button onClick={() => handleOpenNewTask(new Date())}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar tarefa
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
    </div>
  );
}
