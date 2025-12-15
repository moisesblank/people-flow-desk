// ============================================
// UPGRADE v10 - FASE 4: PÁGINA DE TAREFAS KANBAN
// Gestão visual de tarefas com drag & drop
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  Trash2,
  Edit,
  Flag,
} from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useTasks,
  useTasksKanban,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useMoveTask,
  useTasksStats,
  TASK_STATUSES,
  TASK_PRIORITIES,
  Task,
  TaskStatus,
  TaskPriority,
} from "@/hooks/useTasks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

function TaskCard({
  task,
  onEdit,
  onDelete,
  onMove,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
}) {
  const priorityConfig = TASK_PRIORITIES.find((p) => p.value === task.priority);
  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== "done";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group"
    >
      <Card
        className={`glass-card border-border/50 hover:border-primary/30 transition-all cursor-pointer ${
          isOverdue ? "border-destructive/50" : ""
        }`}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                {TASK_STATUSES.filter((s) => s.value !== task.status).map(
                  (status) => (
                    <DropdownMenuItem
                      key={status.value}
                      onClick={() => onMove(task.id, status.value)}
                    >
                      Mover para {status.label}
                    </DropdownMenuItem>
                  )
                )}
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(task.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs ${priorityConfig?.color || ""}`}
              >
                <Flag className="h-3 w-3 mr-1" />
                {priorityConfig?.label}
              </Badge>
            </div>

            {task.due_date && (
              <div
                className={`flex items-center gap-1 text-xs ${
                  isOverdue ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {isOverdue && <AlertTriangle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), "dd/MM", { locale: ptBR })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function KanbanColumn({
  status,
  tasks,
  onEdit,
  onDelete,
  onMove,
}: {
  status: (typeof TASK_STATUSES)[0];
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
}) {
  return (
    <div className="flex-1 min-w-[280px] max-w-[320px]">
      <div
        className={`rounded-xl p-3 ${status.color} border border-border/30 h-full`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            {status.label}
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
          </h3>
        </div>

        <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma tarefa
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskForm({
  task,
  onSubmit,
  onClose,
}: {
  task?: Task;
  onSubmit: (data: any) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "todo",
    priority: task?.priority || "medium",
    due_date: task?.due_date
      ? new Date(task.due_date).toISOString().split("T")[0]
      : "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    onSubmit({
      ...formData,
      due_date: formData.due_date || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Título *</Label>
        <Input
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          placeholder="Nome da tarefa"
        />
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Detalhes da tarefa"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(v) => setFormData({ ...formData, status: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select
            value={formData.priority}
            onValueChange={(v) => setFormData({ ...formData, priority: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Data de Vencimento</Label>
        <Input
          type="date"
          value={formData.due_date}
          onChange={(e) =>
            setFormData({ ...formData, due_date: e.target.value })
          }
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">{task ? "Salvar" : "Criar Tarefa"}</Button>
      </div>
    </form>
  );
}

export default function Tarefas() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { columns, isLoading } = useTasksKanban();
  const stats = useTasksStats();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const moveTask = useMoveTask();

  const handleCreate = (data: any) => {
    createTask.mutate(data, {
      onSuccess: () => {
        setIsDialogOpen(false);
      },
    });
  };

  const handleUpdate = (data: any) => {
    if (!editingTask) return;
    updateTask.mutate(
      { id: editingTask.id, ...data },
      {
        onSuccess: () => {
          setEditingTask(null);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      deleteTask.mutate(id);
    }
  };

  const handleMove = (id: string, status: TaskStatus) => {
    moveTask.mutate({ id, status });
  };

  // Filtrar tarefas por busca
  const filteredColumns = columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
    ),
  }));

  return (
    <div className="p-4 md:p-8 lg:p-12 space-y-6 gradient-mesh min-h-screen">
      <div className="fixed inset-0 cyber-grid pointer-events-none opacity-20" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Tarefas
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas tarefas com visão Kanban
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>

          <div className="flex items-center border border-border rounded-lg p-1">
            <Button
              variant={view === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("kanban")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Tarefa</DialogTitle>
              </DialogHeader>
              <TaskForm
                onSubmit={handleCreate}
                onClose={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-stats-blue">
              {stats.byStatus.in_progress}
            </div>
            <div className="text-xs text-muted-foreground">Em Progresso</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-stats-green">
              {stats.byStatus.done}
            </div>
            <div className="text-xs text-muted-foreground">Concluídas</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-stats-gold">
              {stats.byPriority.urgent + stats.byPriority.high}
            </div>
            <div className="text-xs text-muted-foreground">Prioridade Alta</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">
              {stats.overdue}
            </div>
            <div className="text-xs text-muted-foreground">Atrasadas</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Kanban Board */}
      {view === "kanban" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-4 overflow-x-auto pb-4"
        >
          {filteredColumns.map((column) => (
            <KanbanColumn
              key={column.value}
              status={column}
              tasks={column.tasks}
              onEdit={setEditingTask}
              onDelete={handleDelete}
              onMove={handleMove}
            />
          ))}
        </motion.div>
      )}

      {/* List View */}
      {view === "list" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {filteredColumns.flatMap((col) =>
            col.tasks.map((task) => (
              <Card key={task.id} className="glass-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className={
                        TASK_STATUSES.find((s) => s.value === task.status)
                          ?.color
                      }
                    >
                      {
                        TASK_STATUSES.find((s) => s.value === task.status)
                          ?.label
                      }
                    </Badge>
                    <div>
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        TASK_PRIORITIES.find((p) => p.value === task.priority)
                          ?.color
                      }
                    >
                      {
                        TASK_PRIORITIES.find((p) => p.value === task.priority)
                          ?.label
                      }
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTask(task)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(task.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </motion.div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              task={editingTask}
              onSubmit={handleUpdate}
              onClose={() => setEditingTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
