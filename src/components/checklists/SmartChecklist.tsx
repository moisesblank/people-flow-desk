// ============================================
// SMART CHECKLIST - Sistema de Checklists Inteligentes
// Com IA integrada para sugestões e automações
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Sparkles,
  Calendar,
  MoreVertical,
  Loader2,
  CheckSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  category?: string;
  aiSuggested?: boolean;
  order: number;
}

interface SmartChecklistProps {
  title: string;
  entityType: string;
  entityId?: string;
  showAISuggestions?: boolean;
  categories?: string[];
  onProgressChange?: (progress: number) => void;
  className?: string;
}

const PRIORITY_COLORS = {
  low: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  high: 'bg-red-500/20 text-red-500 border-red-500/30',
};

const PRIORITY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

export function SmartChecklist({
  title,
  entityType,
  entityId,
  showAISuggestions = true,
  onProgressChange,
  className,
}: SmartChecklistProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Calcular progresso
  const progress = items.length > 0 
    ? Math.round((items.filter(i => i.completed).length / items.length) * 100)
    : 0;

  useEffect(() => {
    onProgressChange?.(progress);
  }, [progress, onProgressChange]);

  // Buscar itens salvos
  useEffect(() => {
    fetchChecklist();
  }, [entityType, entityId]);

  const fetchChecklist = async () => {
    if (!entityId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('smart_checklists' as any)
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('order_index');

      if (error) throw error;

      setItems((data || []).map((item: any) => ({
        id: item.id,
        text: item.text,
        completed: item.completed || false,
        priority: (item.priority as 'low' | 'medium' | 'high') || 'medium',
        dueDate: item.due_date,
        category: item.category,
        aiSuggested: item.ai_suggested || false,
        order: item.order_index || 0,
      })));
    } catch (error) {
      console.error('Error fetching checklist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItemText.trim() || !entityId) return;

    const newItem: ChecklistItem = {
      id: `temp-${Date.now()}`,
      text: newItemText.trim(),
      completed: false,
      priority: 'medium',
      order: items.length,
    };

    setItems(prev => [...prev, newItem]);
    setNewItemText('');

    try {
      const { data, error } = await supabase
        .from('smart_checklists' as any)
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          text: newItem.text,
          completed: false,
          priority: 'medium',
          order_index: items.length,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === newItem.id ? { ...item, id: (data as any).id } : item
      ));
    } catch (error) {
      console.error('Error adding item:', error);
      setItems(prev => prev.filter(item => item.id !== newItem.id));
      toast.error('Erro ao adicionar item');
    }
  };

  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newCompleted = !item.completed;
    setItems(prev => prev.map(i => 
      i.id === id ? { ...i, completed: newCompleted } : i
    ));

    try {
      await supabase
        .from('smart_checklists' as any)
        .update({ completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null })
        .eq('id', id);
    } catch (error) {
      console.error('Error toggling item:', error);
      setItems(prev => prev.map(i => 
        i.id === id ? { ...i, completed: !newCompleted } : i
      ));
    }
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));

    try {
      await supabase.from('smart_checklists' as any).delete().eq('id', id);
    } catch (error) {
      console.error('Error deleting item:', error);
      fetchChecklist();
    }
  };

  const updatePriority = async (id: string, priority: 'low' | 'medium' | 'high') => {
    setItems(prev => prev.map(i => 
      i.id === id ? { ...i, priority } : i
    ));

    try {
      await supabase.from('smart_checklists' as any).update({ priority }).eq('id', id);
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const generateAISuggestions = async () => {
    if (!entityId) return;
    
    setIsGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'checklist_suggestions',
          context: {
            entityType,
            entityId,
            existingItems: items.map(i => i.text),
            title,
          }
        }
      });

      if (error) throw error;

      if (data.suggestions && Array.isArray(data.suggestions)) {
        const newItems: ChecklistItem[] = data.suggestions.map((suggestion: any, idx: number) => ({
          id: `ai-${Date.now()}-${idx}`,
          text: suggestion.text || suggestion,
          completed: false,
          priority: suggestion.priority || 'medium',
          aiSuggested: true,
          order: items.length + idx,
        }));

        // Salvar sugestões no banco
        for (const item of newItems) {
          const { data: saved } = await supabase
            .from('smart_checklists' as any)
            .insert({
              entity_type: entityType,
              entity_id: entityId,
              text: item.text,
              completed: false,
              priority: item.priority,
              ai_suggested: true,
              order_index: item.order,
              created_by: user?.id,
            })
            .select()
            .single();

          if (saved) {
            item.id = (saved as any).id;
          }
        }

        setItems(prev => [...prev, ...newItems]);
        toast.success(`${newItems.length} sugestões da IA adicionadas!`);
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      toast.error('Erro ao gerar sugestões');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'pending') return !item.completed;
    if (filter === 'completed') return item.completed;
    return true;
  });

  const pendingCount = items.filter(i => !i.completed).length;
  const highPriorityPending = items.filter(i => !i.completed && i.priority === 'high').length;

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
                </span>
                {highPriorityPending > 0 && (
                  <Badge variant="outline" className={PRIORITY_COLORS.high}>
                    {highPriorityPending} urgente{highPriorityPending !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showAISuggestions && entityId && (
              <Button
                variant="outline"
                size="sm"
                onClick={generateAISuggestions}
                disabled={isGeneratingAI}
                className="gap-1.5"
              >
                {isGeneratingAI ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                IA
              </Button>
            )}
            
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Input para novo item */}
        <div className="flex gap-2">
          <Input
            placeholder="Adicionar novo item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            className="flex-1"
          />
          <Button onClick={addItem} size="icon" disabled={!newItemText.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Lista de itens */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {filter === 'all' 
                    ? 'Nenhum item no checklist'
                    : filter === 'pending'
                    ? 'Nenhum item pendente'
                    : 'Nenhum item concluído'
                  }
                </p>
              </motion.div>
            ) : (
              filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    item.completed 
                      ? "bg-muted/30 border-border/30" 
                      : "bg-card border-border/50 hover:border-primary/30"
                  )}
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="h-5 w-5"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm transition-all",
                      item.completed && "line-through text-muted-foreground"
                    )}>
                      {item.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={cn("text-[10px]", PRIORITY_COLORS[item.priority])}
                      >
                        {PRIORITY_LABELS[item.priority]}
                      </Badge>
                      {item.aiSuggested && (
                        <Badge variant="outline" className="text-[10px] gap-1 bg-purple-500/10 text-purple-500 border-purple-500/30">
                          <Sparkles className="h-2.5 w-2.5" />
                          IA
                        </Badge>
                      )}
                      {item.dueDate && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updatePriority(item.id, 'low')}>
                        <Circle className="h-3 w-3 mr-2 text-emerald-500" />
                        Prioridade Baixa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updatePriority(item.id, 'medium')}>
                        <Circle className="h-3 w-3 mr-2 text-amber-500" />
                        Prioridade Média
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updatePriority(item.id, 'high')}>
                        <Circle className="h-3 w-3 mr-2 text-red-500" />
                        Prioridade Alta
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => deleteItem(item.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
