import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ClipboardCheck, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle,
  Trash2,
  Clock,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Json } from "@/integrations/supabase/types";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Checklist {
  id: string;
  titulo: string;
  professor_id: string;
  semana_inicio: string;
  itens: ChecklistItem[];
  status: string;
  observacoes: string | null;
  created_at: string;
}

export default function AreaProfessor() {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form states
  const [titulo, setTitulo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [newItemText, setNewItemText] = useState("");
  const [items, setItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    if (user) {
      fetchChecklists();
    }
  }, [user, selectedWeek]);

  const fetchChecklists = async () => {
    try {
      const weekStart = format(selectedWeek, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('professor_checklists')
        .select('*')
        .eq('semana_inicio', weekStart)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse the JSON itens field with proper type handling
      const parsedData: Checklist[] = (data || []).map(item => ({
        ...item,
        itens: Array.isArray(item.itens) 
          ? (item.itens as unknown as ChecklistItem[]) 
          : []
      }));
      
      setChecklists(parsedData);
    } catch (error: any) {
      console.error('Error fetching checklists:', error);
      toast.error('Erro ao carregar checklists');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newItemText.trim(),
      completed: false
    };
    
    setItems([...items, newItem]);
    setNewItemText("");
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleCreateChecklist = async () => {
    if (!user || !titulo.trim() || items.length === 0) {
      toast.error('Preencha o título e adicione pelo menos um item');
      return;
    }

    try {
      const { error } = await supabase
        .from('professor_checklists')
        .insert({
          titulo: titulo.trim(),
          professor_id: user.id,
          semana_inicio: format(selectedWeek, 'yyyy-MM-dd'),
          itens: items as unknown as Json,
          observacoes: observacoes.trim() || null,
          status: 'em_andamento'
        });

      if (error) throw error;

      toast.success('Checklist criado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
      fetchChecklists();
    } catch (error: any) {
      console.error('Error creating checklist:', error);
      toast.error('Erro ao criar checklist');
    }
  };

  const handleToggleItem = async (checklistId: string, itemId: string) => {
    const checklist = checklists.find(c => c.id === checklistId);
    if (!checklist) return;

    const updatedItems = checklist.itens.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const allCompleted = updatedItems.every(item => item.completed);
    const newStatus = allCompleted ? 'concluido' : 'em_andamento';

    try {
      const { error } = await supabase
        .from('professor_checklists')
        .update({ 
          itens: updatedItems as unknown as Json,
          status: newStatus
        })
        .eq('id', checklistId);

      if (error) throw error;

      setChecklists(checklists.map(c => 
        c.id === checklistId 
          ? { ...c, itens: updatedItems, status: newStatus }
          : c
      ));

      if (allCompleted) {
        toast.success('Checklist concluído! 🎉');
      }
    } catch (error: any) {
      console.error('Error updating checklist:', error);
      toast.error('Erro ao atualizar item');
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('professor_checklists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Checklist excluído');
      fetchChecklists();
    } catch (error: any) {
      console.error('Error deleting checklist:', error);
      toast.error('Erro ao excluir checklist');
    }
  };

  const resetForm = () => {
    setTitulo("");
    setObservacoes("");
    setItems([]);
    setNewItemText("");
  };

  const getCompletionPercentage = (checklist: Checklist) => {
    if (checklist.itens.length === 0) return 0;
    const completed = checklist.itens.filter(i => i.completed).length;
    return Math.round((completed / checklist.itens.length) * 100);
  };

  const stats = {
    totalChecklists: checklists.length,
    completed: checklists.filter(c => c.status === 'concluido').length,
    inProgress: checklists.filter(c => c.status === 'em_andamento').length,
    totalItems: checklists.reduce((acc, c) => acc + c.itens.length, 0),
    completedItems: checklists.reduce((acc, c) => acc + c.itens.filter(i => i.completed).length, 0)
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ClipboardCheck className="h-8 w-8 text-primary" />
              Área do Professor
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus checklists semanais e acompanhe suas atividades
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Checklist
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Checklist Semanal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input 
                    placeholder="Ex: Atividades da Semana"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Itens do Checklist</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Adicionar item..."
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                    />
                    <Button type="button" onClick={handleAddItem} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {items.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="text-sm text-muted-foreground">{index + 1}.</span>
                        <span className="flex-1 text-sm">{item.text}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Observações (opcional)</Label>
                  <Textarea 
                    placeholder="Notas adicionais..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={handleCreateChecklist} 
                  className="w-full"
                  disabled={!titulo.trim() || items.length === 0}
                >
                  Criar Checklist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Week Navigation */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSelectedWeek(subWeeks(selectedWeek, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Semana de</p>
                <p className="text-lg font-semibold">
                  {format(selectedWeek, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalChecklists}</p>
                  <p className="text-xs text-muted-foreground">Checklists</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Concluídos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">Em Andamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.completedItems}/{stats.totalItems}
                  </p>
                  <p className="text-xs text-muted-foreground">Itens Feitos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checklists */}
        <div className="grid md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4">Carregando checklists...</p>
                </CardContent>
              </Card>
            ) : checklists.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum checklist nesta semana</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie seu primeiro checklist para organizar suas atividades
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Checklist
                  </Button>
                </CardContent>
              </Card>
            ) : (
              checklists.map((checklist) => (
                <motion.div
                  key={checklist.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{checklist.titulo}</CardTitle>
                          <CardDescription className="mt-1">
                            {checklist.itens.filter(i => i.completed).length} de {checklist.itens.length} itens completos
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={checklist.status === 'concluido' ? 'default' : 'secondary'}>
                            {checklist.status === 'concluido' ? 'Concluído' : 'Em Andamento'}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteChecklist(checklist.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${getCompletionPercentage(checklist)}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                          {getCompletionPercentage(checklist)}% completo
                        </p>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-2">
                        {checklist.itens.map((item) => (
                          <div 
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer
                              ${item.completed ? 'bg-green-500/10' : 'bg-muted hover:bg-muted/80'}`}
                            onClick={() => handleToggleItem(checklist.id, item.id)}
                          >
                            {item.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {checklist.observacoes && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Observações:</p>
                          <p className="text-sm">{checklist.observacoes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
