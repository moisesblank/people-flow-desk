// ============================================
// EMPRESARIAL 2.0 - TAREFAS COM KANBAN AVANÇADO
// Integração completa conforme AJUDA5
// + Sistema Universal de Anexos
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Zap,
  Phone,
  CheckSquare,
  Target,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { CyberBackground } from "@/components/ui/cyber-background";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/hooks/useTasks";
import { KanbanAdvanced } from "@/components/tasks/KanbanAdvanced";
import { UniversalAttachments } from "@/components/attachments/UniversalAttachments";
import { AttachmentIndicator } from "@/components/attachments/AttachmentIndicator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Dados dos assessores conforme AJUDA5
const ASSESSORS = {
  moises: { name: "Moisés", phone: "5583998920105", whatsapp: "558398920105" },
  bruna: { name: "Bruna", phone: "5583996354090", whatsapp: "558396354090" },
};

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

      {/* Seção de Anexos - só aparece se tarefa já existe */}
      {task?.id && (
        <div className="border-t border-border pt-4">
          <UniversalAttachments
            entityType="task"
            entityId={task.id}
            title="Anexos da Tarefa"
            showAIExtraction
          />
        </div>
      )}

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
  const [view, setView] = useState<"kanban" | "advanced" | "list">("advanced");
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
        toast.success("Tarefa criada com sucesso!");
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
          toast.success("Tarefa atualizada!");
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

  const contactAssessor = (assessor: 'moises' | 'bruna') => {
    const data = ASSESSORS[assessor];
    window.open(`https://wa.me/${data.whatsapp}?text=Olá ${data.name}, preciso de ajuda com uma tarefa!`, '_blank');
  };

  return (
    <div className="relative min-h-screen">
      <CyberBackground variant="grid" />
      
      <div className="relative z-10 p-4 md:p-8 lg:p-12 space-y-6">
        {/* Futuristic Header */}
        <FuturisticPageHeader
          title="Central de Tarefas"
          subtitle="Sistema Kanban Inteligente com IA"
          icon={CheckSquare}
          badge="NEURAL SYNC"
          accentColor="cyan"
          stats={[
            { label: "Total", value: stats.total, icon: Target },
            { label: "Em Progresso", value: stats.byStatus.in_progress, icon: Clock },
            { label: "Concluídas", value: stats.byStatus.done, icon: CheckSquare },
            { label: "Atrasadas", value: stats.overdue, icon: AlertTriangle },
          ]}
        />

        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => contactAssessor('moises')}
              className="gap-1 border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/10"
            >
              <Phone className="h-3 w-3 text-cyan-400" />
              Moisés
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => contactAssessor('bruna')}
              className="gap-1 border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10"
            >
              <Phone className="h-3 w-3 text-purple-400" />
              Bruna
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64 bg-background/50 border-border/50 focus:border-cyan-500/50"
              />
            </div>

            <div className="flex items-center border border-border/50 rounded-lg p-1 bg-background/30 backdrop-blur-sm">
              <Button
                variant={view === "advanced" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("advanced")}
                title="Kanban Avançado"
                className={view === "advanced" ? "bg-cyan-500/20 text-cyan-400" : ""}
              >
                <Zap className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "kanban" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("kanban")}
                title="Kanban Simples"
                className={view === "kanban" ? "bg-cyan-500/20 text-cyan-400" : ""}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
                title="Lista"
                className={view === "list" ? "bg-cyan-500/20 text-cyan-400" : ""}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent className="border-cyan-500/20 bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="text-cyan-400">Nova Tarefa</DialogTitle>
                </DialogHeader>
                <TaskForm
                  onSubmit={handleCreate}
                  onClose={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <FuturisticCard accentColor="cyan" className="p-4 text-center">
            <div className="text-3xl font-bold text-cyan-400">{stats.total}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
          </FuturisticCard>
          <FuturisticCard accentColor="blue" className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{stats.byStatus.in_progress}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Em Progresso</div>
          </FuturisticCard>
          <FuturisticCard accentColor="green" className="p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{stats.byStatus.done}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Concluídas</div>
          </FuturisticCard>
          <FuturisticCard accentColor="gold" className="p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{stats.byPriority.urgent + stats.byPriority.high}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Prioridade Alta</div>
          </FuturisticCard>
          <FuturisticCard accentColor="orange" className="p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{stats.overdue}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Atrasadas</div>
          </FuturisticCard>
        </div>

        {/* Views */}
      {view === "advanced" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-4"
        >
          <KanbanAdvanced />
        </motion.div>
      )}

      {view === "kanban" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-4 overflow-x-auto pb-4"
        >
          {columns.map((column) => (
            <div key={column.value} className="flex-1 min-w-[280px] max-w-[320px]">
              <div
                className={`rounded-xl p-3 ${column.color} border border-border/30 h-full`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    {column.label}
                    <Badge variant="secondary" className="text-xs">
                      {column.tasks.length}
                    </Badge>
                  </h3>
                </div>

                <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
                  {column.tasks
                    .filter((t) =>
                      t.title.toLowerCase().includes(search.toLowerCase()) ||
                      t.description?.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((task) => (
                      <Card
                        key={task.id}
                        className="glass-card border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                      >
                        <CardContent className="p-3 space-y-2">
                          <h4 className="font-medium text-sm line-clamp-2">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                TASK_PRIORITIES.find((p) => p.value === task.priority)
                                  ?.color || ""
                              }`}
                            >
                              {TASK_PRIORITIES.find((p) => p.value === task.priority)
                                ?.label}
                            </Badge>
                            {task.due_date && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(task.due_date), "dd/MM", {
                                  locale: ptBR,
                                })}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                  {column.tasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma tarefa
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {view === "list" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Tarefa
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Prioridade
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {columns
                .flatMap((col) => col.tasks)
                .filter(
                  (t) =>
                    t.title.toLowerCase().includes(search.toLowerCase()) ||
                    t.description?.toLowerCase().includes(search.toLowerCase())
                )
                .map((task) => (
                  <tr
                    key={task.id}
                    className="border-t border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">
                        {TASK_STATUSES.find((s) => s.value === task.status)?.label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        className={
                          TASK_PRIORITIES.find((p) => p.value === task.priority)
                            ?.color
                        }
                      >
                        {TASK_PRIORITIES.find((p) => p.value === task.priority)
                          ?.label}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {task.due_date
                        ? format(new Date(task.due_date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "-"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
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
    </div>
  );
}
