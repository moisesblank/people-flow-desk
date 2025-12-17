// ============================================
// EMPRESARIAL 2.0 - KANBAN AVANÇADO
// Sub-tarefas, automações, templates
// Conforme documento AJUDA5
// ============================================

import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Tag,
  Link2,
  MessageSquare,
  Paperclip,
  ChevronDown,
  ChevronRight,
  Zap,
  Copy,
  Trash2,
  Edit,
  Timer,
  Flag,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface AdvancedTask {
  id: string;
  title: string;
  description?: string;
  status: "backlog" | "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: Date;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  tags: string[];
  subtasks: SubTask[];
  comments: number;
  attachments: number;
  estimatedTime?: number; // minutos
  actualTime?: number;
  createdAt: Date;
  automationRule?: string;
}

const STATUSES = [
  { value: "backlog", label: "Backlog", color: "bg-muted" },
  { value: "todo", label: "A Fazer", color: "bg-[hsl(var(--stats-blue))]/20" },
  { value: "in_progress", label: "Em Progresso", color: "bg-[hsl(var(--stats-gold))]/20" },
  { value: "review", label: "Revisão", color: "bg-[hsl(var(--stats-purple))]/20" },
  { value: "done", label: "Concluído", color: "bg-[hsl(var(--stats-green))]/20" },
];

const PRIORITIES = {
  low: { label: "Baixa", color: "text-muted-foreground", bg: "bg-muted" },
  medium: { label: "Média", color: "text-[hsl(var(--stats-blue))]", bg: "bg-[hsl(var(--stats-blue))]/20" },
  high: { label: "Alta", color: "text-[hsl(var(--stats-gold))]", bg: "bg-[hsl(var(--stats-gold))]/20" },
  urgent: { label: "Urgente", color: "text-destructive", bg: "bg-destructive/20" },
};

const mockTasks: AdvancedTask[] = [
  {
    id: "1",
    title: "Preparar material da aula",
    description: "Preparar slides e exercícios para a aula de química orgânica",
    status: "in_progress",
    priority: "high",
    dueDate: new Date(Date.now() + 86400000),
    assignee: { id: "1", name: "Moisés", avatar: "" },
    tags: ["aula", "química"],
    subtasks: [
      { id: "s1", title: "Criar slides", completed: true },
      { id: "s2", title: "Preparar exercícios", completed: false },
      { id: "s3", title: "Revisar conteúdo", completed: false },
    ],
    comments: 3,
    attachments: 2,
    estimatedTime: 120,
    actualTime: 60,
    createdAt: new Date(),
  },
  {
    id: "2",
    title: "Responder alunos no WhatsApp",
    status: "todo",
    priority: "urgent",
    dueDate: new Date(),
    tags: ["comunicação", "alunos"],
    subtasks: [],
    comments: 0,
    attachments: 0,
    createdAt: new Date(),
  },
  {
    id: "3",
    title: "Atualizar site",
    description: "Adicionar novos cursos e atualizar preços",
    status: "backlog",
    priority: "medium",
    tags: ["site", "marketing"],
    subtasks: [
      { id: "s4", title: "Atualizar preços", completed: false },
      { id: "s5", title: "Adicionar novos cursos", completed: false },
    ],
    comments: 1,
    attachments: 0,
    createdAt: new Date(),
  },
];

// Templates de automação
const AUTOMATION_TEMPLATES = [
  { id: "1", name: "Mover para revisão quando todas subtarefas concluídas", trigger: "subtasks_complete" },
  { id: "2", name: "Notificar quando tarefa atrasada", trigger: "overdue" },
  { id: "3", name: "Atribuir automaticamente por tag", trigger: "tag_match" },
  { id: "4", name: "Criar tarefa recorrente", trigger: "recurring" },
];

export function KanbanAdvanced() {
  const [tasks, setTasks] = useState<AdvancedTask[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<AdvancedTask | null>(null);
  const [showSubtasks, setShowSubtasks] = useState<Record<string, boolean>>({});
  const [showAutomations, setShowAutomations] = useState(false);

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          
          // Automação: mover para revisão quando todas subtarefas concluídas
          const allCompleted = updatedSubtasks.every(st => st.completed);
          if (allCompleted && task.status === "in_progress") {
            toast.success("🤖 Automação: Movido para Revisão!");
            return { ...task, subtasks: updatedSubtasks, status: "review" as const };
          }
          
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      })
    );
  };

  const moveTask = (taskId: string, newStatus: AdvancedTask["status"]) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    toast.success(`Tarefa movida para ${STATUSES.find(s => s.value === newStatus)?.label}`);
  };

  const duplicateTask = (task: AdvancedTask) => {
    const newTask: AdvancedTask = {
      ...task,
      id: String(Date.now()),
      title: `${task.title} (cópia)`,
      subtasks: task.subtasks.map(st => ({ ...st, id: `${st.id}-copy`, completed: false })),
      createdAt: new Date(),
    };
    setTasks([...tasks, newTask]);
    toast.success("Tarefa duplicada!");
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast.success("Tarefa excluída!");
  };

  const getSubtaskProgress = (subtasks: SubTask[]) => {
    if (subtasks.length === 0) return 0;
    return (subtasks.filter(st => st.completed).length / subtasks.length) * 100;
  };

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Kanban Avançado</h2>
          <p className="text-sm text-muted-foreground">
            {tasks.length} tarefas • {tasks.filter(t => t.status === "done").length} concluídas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAutomations(true)}
          >
            <Zap className="h-4 w-4 mr-1" />
            Automações
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Board Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map(status => {
          const statusTasks = tasks.filter(t => t.status === status.value);
          
          return (
            <div
              key={status.value}
              className="flex-shrink-0 w-72"
            >
              <div className={`rounded-xl p-3 ${status.color} border border-border/30 h-full min-h-[400px]`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    {status.label}
                    <Badge variant="secondary" className="text-xs">
                      {statusTasks.length}
                    </Badge>
                  </h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="space-y-2 pr-1">
                    <AnimatePresence>
                      {statusTasks.map((task, index) => (
                        <TaskCardAdvanced
                          key={task.id}
                          task={task}
                          index={index}
                          showSubtasks={showSubtasks[task.id]}
                          onToggleSubtasks={() =>
                            setShowSubtasks(prev => ({
                              ...prev,
                              [task.id]: !prev[task.id],
                            }))
                          }
                          onToggleSubtask={(subtaskId) =>
                            toggleSubtask(task.id, subtaskId)
                          }
                          onMove={(newStatus) => moveTask(task.id, newStatus)}
                          onDuplicate={() => duplicateTask(task)}
                          onDelete={() => deleteTask(task.id)}
                          onSelect={() => setSelectedTask(task)}
                          getProgress={getSubtaskProgress}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog de Automações */}
      <Dialog open={showAutomations} onOpenChange={setShowAutomations}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Automações
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {AUTOMATION_TEMPLATES.map(automation => (
              <div
                key={automation.id}
                className="p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{automation.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Gatilho: {automation.trigger}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Ativo
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskCardAdvanced({
  task,
  index,
  showSubtasks,
  onToggleSubtasks,
  onToggleSubtask,
  onMove,
  onDuplicate,
  onDelete,
  onSelect,
  getProgress,
}: {
  task: AdvancedTask;
  index: number;
  showSubtasks: boolean;
  onToggleSubtasks: () => void;
  onToggleSubtask: (subtaskId: string) => void;
  onMove: (status: AdvancedTask["status"]) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSelect: () => void;
  getProgress: (subtasks: SubTask[]) => number;
}) {
  const priority = PRIORITIES[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
  const subtaskProgress = getProgress(task.subtasks);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03 }}
      className="group"
    >
      <Card
        className={`glass-card border-border/50 hover:border-primary/30 transition-all cursor-pointer ${
          isOverdue ? "border-destructive/50 bg-destructive/5" : ""
        }`}
      >
        <CardContent className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge className={`${priority.bg} ${priority.color} text-[10px] px-1.5`}>
                <Flag className="h-2.5 w-2.5 mr-0.5" />
                {priority.label}
              </Badge>
              {isOverdue && (
                <Badge className="bg-destructive/20 text-destructive text-[10px] px-1.5">
                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                  Atrasada
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onSelect}>
                  <Edit className="h-3 w-3 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-3 w-3 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {STATUSES.filter(s => s.value !== task.status).map(status => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => onMove(status.value as AdvancedTask["status"])}
                  >
                    <ArrowRight className="h-3 w-3 mr-2" />
                    Mover para {status.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3 w-3 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title */}
          <h4 className="font-medium text-sm line-clamp-2" onClick={onSelect}>
            {task.title}
          </h4>

          {/* Subtasks */}
          {task.subtasks.length > 0 && (
            <div className="space-y-1">
              <button
                onClick={onToggleSubtasks}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showSubtasks ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <span>
                  {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtarefas
                </span>
              </button>

              <Progress value={subtaskProgress} className="h-1" />

              <AnimatePresence>
                {showSubtasks && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-1 mt-2 overflow-hidden"
                  >
                    {task.subtasks.map(subtask => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Checkbox
                          checked={subtask.completed}
                          onCheckedChange={() => onToggleSubtask(subtask.id)}
                          className="h-3 w-3"
                        />
                        <span className={subtask.completed ? "line-through text-muted-foreground" : ""}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-[9px] px-1 h-4">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground">
              {task.dueDate && (
                <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? "text-destructive" : ""}`}>
                  <Calendar className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </span>
              )}
              {task.comments > 0 && (
                <span className="flex items-center gap-1 text-[10px]">
                  <MessageSquare className="h-3 w-3" />
                  {task.comments}
                </span>
              )}
              {task.attachments > 0 && (
                <span className="flex items-center gap-1 text-[10px]">
                  <Paperclip className="h-3 w-3" />
                  {task.attachments}
                </span>
              )}
            </div>

            {task.assignee && (
              <Avatar className="h-5 w-5">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="text-[8px]">
                  {task.assignee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
