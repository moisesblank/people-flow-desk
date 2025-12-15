// ============================================
// MOISÉS MEDEIROS v7.0 - SITE PROGRAMADOR
// Spider-Man Theme - Gestão de Equipe Dev
// Conectado ao Supabase
// ============================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Code, 
  User,
  CheckCircle2,
  Circle,
  Plus,
  MessageSquare,
  Clock,
  AlertTriangle,
  Loader2,
  Trash2,
  RefreshCw,
  Save
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DevTask {
  id: string;
  member_name: string;
  member_role: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  deadline: string | null;
  created_at: string;
}

interface ChecklistItem {
  id: string;
  task: string;
  category: string;
  is_completed: boolean;
}

export default function SiteProgramador() {
  const [tasks, setTasks] = useState<DevTask[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string>("todos");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    member_name: "Jean",
    member_role: "Desenvolvedor",
    title: "",
    priority: "media",
    deadline: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchTasks(), fetchChecklist()]);
    setLoading(false);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('dev_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }
    setTasks(data || []);
  };

  const fetchChecklist = async () => {
    const { data, error } = await supabase
      .from('studio_checklist')
      .select('*')
      .order('category');

    if (error) {
      console.error('Error fetching checklist:', error);
      return;
    }
    setChecklist(data || []);
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Digite o título da tarefa");
      return;
    }

    const { error } = await supabase
      .from('dev_tasks')
      .insert({
        member_name: newTask.member_name,
        member_role: newTask.member_role,
        title: newTask.title,
        priority: newTask.priority,
        deadline: newTask.deadline || null
      });

    if (error) {
      toast.error("Erro ao adicionar tarefa");
      return;
    }

    toast.success("Tarefa adicionada!");
    setNewTask({ member_name: "Jean", member_role: "Desenvolvedor", title: "", priority: "media", deadline: "" });
    setIsAddDialogOpen(false);
    fetchTasks();
  };

  const handleToggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'concluido' ? 'pendente' : 'concluido';
    
    const { error } = await supabase
      .from('dev_tasks')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error("Erro ao atualizar tarefa");
      return;
    }
    fetchTasks();
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase
      .from('dev_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao excluir tarefa");
      return;
    }
    toast.success("Tarefa excluída!");
    fetchTasks();
  };

  const handleToggleChecklist = async (id: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from('studio_checklist')
      .update({ 
        is_completed: !isCompleted,
        completed_at: !isCompleted ? new Date().toISOString() : null
      })
      .eq('id', id);

    if (error) {
      toast.error("Erro ao atualizar checklist");
      return;
    }
    fetchChecklist();
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "alta":
        return <Badge className="bg-red-500">Alta</Badge>;
      case "media":
        return <Badge className="bg-amber-500">Média</Badge>;
      case "baixa":
        return <Badge variant="secondary">Baixa</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "concluido":
        return <Badge className="bg-emerald-500">Concluído</Badge>;
      case "em_andamento":
        return <Badge className="bg-blue-500">Em andamento</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const members = [...new Set(tasks.map(t => t.member_name))];
  const filteredTasks = selectedMember === "todos" 
    ? tasks 
    : tasks.filter(t => t.member_name === selectedMember);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'concluido').length,
    pending: tasks.filter(t => t.status === 'pendente').length,
    highPriority: tasks.filter(t => t.priority === 'alta' && t.status !== 'concluido').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <Code className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Desenvolvimento</h1>
            <p className="text-muted-foreground">Tarefas e checklist da equipe</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="brand-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Responsável</Label>
                    <Input 
                      value={newTask.member_name}
                      onChange={(e) => setNewTask({...newTask, member_name: e.target.value})}
                      placeholder="Nome do membro"
                    />
                  </div>
                  <div>
                    <Label>Função</Label>
                    <Input 
                      value={newTask.member_role}
                      onChange={(e) => setNewTask({...newTask, member_role: e.target.value})}
                      placeholder="Ex: Desenvolvedor"
                    />
                  </div>
                </div>
                <div>
                  <Label>Título da Tarefa</Label>
                  <Input 
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="Descreva a tarefa"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={newTask.priority} onValueChange={(v) => setNewTask({...newTask, priority: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prazo (opcional)</Label>
                    <Input 
                      type="date"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleAddTask}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total de Tarefas", value: stats.total, icon: Code, color: "text-blue-500" },
          { label: "Concluídas", value: stats.completed, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Pendentes", value: stats.pending, icon: Clock, color: "text-amber-500" },
          { label: "Alta Prioridade", value: stats.highPriority, icon: AlertTriangle, color: "text-red-500" },
        ].map((stat, idx) => (
          <Card key={idx} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="tasks">Tarefas da Equipe</TabsTrigger>
          <TabsTrigger value="checklist">Checklist Estúdio</TabsTrigger>
        </TabsList>

        {/* Tarefas */}
        <TabsContent value="tasks" className="space-y-4">
          {/* Filtro por membro */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={selectedMember === "todos" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedMember("todos")}
            >
              Todos
            </Button>
            {members.map(member => (
              <Button
                key={member}
                variant={selectedMember === member ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMember(member)}
              >
                {member}
              </Button>
            ))}
          </div>

          {/* Lista de tarefas */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma tarefa encontrada</p>
                  <p className="text-sm mt-1">Adicione tarefas para sua equipe</p>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task, idx) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`border-border/50 ${task.status === 'concluido' ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Checkbox 
                            checked={task.status === 'concluido'}
                            onCheckedChange={() => handleToggleTask(task.id, task.status)}
                          />
                          <div>
                            <p className={`font-medium ${task.status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{task.member_name}</Badge>
                              <span className="text-xs text-muted-foreground">{task.member_role}</span>
                              {task.deadline && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(task.deadline).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task.status)}
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Checklist */}
        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle>Checklist do Estúdio</CardTitle>
              <CardDescription>
                Itens para verificar antes das gravações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklist.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={item.is_completed}
                        onCheckedChange={() => handleToggleChecklist(item.id, item.is_completed)}
                      />
                      <div>
                        <p className={item.is_completed ? 'line-through text-muted-foreground' : ''}>
                          {item.task}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">{item.category}</Badge>
                      </div>
                    </div>
                    {item.is_completed && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Progresso do Checklist</p>
                    <p className="text-sm text-muted-foreground">
                      {checklist.filter(c => c.is_completed).length} de {checklist.length} itens
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {checklist.length > 0 
                      ? Math.round((checklist.filter(c => c.is_completed).length / checklist.length) * 100)
                      : 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
