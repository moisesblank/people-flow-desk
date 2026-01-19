// ============================================
// 📂 SUBCATEGORY REORDER MODAL — YEAR 2300
// Modal para reordenar subcategorias por curso
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatError } from '@/lib/utils/formatError';
import { cn } from '@/lib/utils';
import {
  ChevronUp,
  ChevronDown,
  FolderOpen,
  Save,
  Layers,
  GraduationCap,
  ArrowUpDown,
  MoveUp,
  MoveDown
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  is_published: boolean;
}

interface SubcategoryOrder {
  id?: string;
  course_id: string;
  subcategory: string;
  position: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  allModules: { subcategory: string | null; course_id: string }[];
}

export function SubcategoryReorderModal({ open, onOpenChange, courses, allModules }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [localOrder, setLocalOrder] = useState<SubcategoryOrder[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Subcategorias do curso selecionado
  const courseSubcategories = useMemo(() => {
    if (!selectedCourse) return [];
    
    const subcatSet = new Set<string>();
    allModules.forEach(m => {
      if (m.course_id === selectedCourse && m.subcategory) {
        subcatSet.add(m.subcategory);
      }
    });
    
    return Array.from(subcatSet).sort();
  }, [allModules, selectedCourse]);

  // Buscar ordenação salva
  const { data: savedOrder, refetch: refetchOrder } = useQuery({
    queryKey: ['subcategory-ordering', selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return [];
      
      const { data, error } = await supabase
        .from('subcategory_ordering')
        .select('*')
        .eq('course_id', selectedCourse)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as SubcategoryOrder[];
    },
    enabled: !!selectedCourse
  });

  // Sincronizar ordem local com dados salvos
  useEffect(() => {
    if (!selectedCourse || !courseSubcategories.length) {
      setLocalOrder([]);
      return;
    }

    const savedMap = new Map<string, number>();
    savedOrder?.forEach(s => savedMap.set(s.subcategory, s.position));

    // Ordenar: primeiro as que têm posição salva, depois alfabético
    const ordered = courseSubcategories
      .map(sub => ({
        course_id: selectedCourse,
        subcategory: sub,
        position: savedMap.has(sub) ? savedMap.get(sub)! : 999999,
        id: savedOrder?.find(s => s.subcategory === sub)?.id
      }))
      .sort((a, b) => {
        if (a.position === b.position) {
          return a.subcategory.localeCompare(b.subcategory, 'pt-BR');
        }
        return a.position - b.position;
      })
      .map((item, idx) => ({ ...item, position: idx }));

    setLocalOrder(ordered);
  }, [selectedCourse, courseSubcategories, savedOrder]);

  // Mover subcategoria para cima
  const moveUp = (index: number) => {
    if (index === 0) return;
    
    setLocalOrder(prev => {
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      return newOrder.map((item, idx) => ({ ...item, position: idx }));
    });
  };

  // Mover subcategoria para baixo
  const moveDown = (index: number) => {
    if (index >= localOrder.length - 1) return;
    
    setLocalOrder(prev => {
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      return newOrder.map((item, idx) => ({ ...item, position: idx }));
    });
  };

  // Mover para o topo
  const moveToTop = (index: number) => {
    if (index === 0) return;
    
    setLocalOrder(prev => {
      const item = prev[index];
      const newOrder = prev.filter((_, i) => i !== index);
      newOrder.unshift(item);
      return newOrder.map((item, idx) => ({ ...item, position: idx }));
    });
  };

  // Mover para o final
  const moveToBottom = (index: number) => {
    if (index >= localOrder.length - 1) return;
    
    setLocalOrder(prev => {
      const item = prev[index];
      const newOrder = prev.filter((_, i) => i !== index);
      newOrder.push(item);
      return newOrder.map((item, idx) => ({ ...item, position: idx }));
    });
  };

  // Salvar ordenação
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCourse || !localOrder.length) return;

      // Upsert todas as subcategorias
      const { error } = await supabase
        .from('subcategory_ordering')
        .upsert(
          localOrder.map(item => ({
            course_id: item.course_id,
            subcategory: item.subcategory,
            position: item.position,
            updated_at: new Date().toISOString()
          })),
          { 
            onConflict: 'course_id,subcategory',
            ignoreDuplicates: false 
          }
        );

      if (error) throw error;
    },
    onSuccess: async () => {
      // Atualizar cache da ordenação (modal + listagem principal)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['subcategory-ordering', selectedCourse] }),
        queryClient.invalidateQueries({ queryKey: ['subcategory-ordering-all'] }),
        queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] })
      ]);
      toast({ title: '✅ Ordem salva com sucesso!' });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: '❌ Erro ao salvar', description: formatError(err), variant: 'destructive' });
    }
  });

  // Contagem de módulos por subcategoria
  const moduleCountMap = useMemo(() => {
    const map = new Map<string, number>();
    allModules.forEach(m => {
      if (m.course_id === selectedCourse && m.subcategory) {
        map.set(m.subcategory, (map.get(m.subcategory) || 0) + 1);
      }
    });
    return map;
  }, [allModules, selectedCourse]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-card/95 border-amber-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40">
              <ArrowUpDown className="h-5 w-5 text-amber-400" />
            </div>
            <span>Ordenar Subcategorias</span>
          </DialogTitle>
          <DialogDescription>
            Reorganize a ordem de exibição das subcategorias dentro de cada curso
          </DialogDescription>
        </DialogHeader>

        {/* Seletor de Curso */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-purple-400" />
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="flex-1 bg-background/50 border-purple-500/30">
                <SelectValue placeholder="Selecione um curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Subcategorias */}
          {selectedCourse && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                <span className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-amber-400" />
                  {localOrder.length} subcategoria{localOrder.length !== 1 ? 's' : ''} encontrada{localOrder.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs">Arraste ou use os botões para reordenar</span>
              </div>

              <div className="overflow-y-auto max-h-[50vh] space-y-2 pr-2">
                {localOrder.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma subcategoria encontrada neste curso</p>
                  </div>
                ) : (
                  localOrder.map((item, index) => (
                    <div
                      key={item.subcategory}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl",
                        "bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10",
                        "border-2 border-amber-500/30",
                        "group"
                      )}
                    >
                      {/* Posição */}
                      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/40 font-bold text-amber-300">
                        {index + 1}
                      </div>

                      {/* Nome da Subcategoria */}
                      <div className="flex-1 flex items-center gap-3">
                        <FolderOpen className="h-5 w-5 text-amber-400" />
                        <span className="font-semibold text-amber-200">{item.subcategory}</span>
                        <Badge className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          <Layers className="h-3 w-3 mr-1" />
                          {moduleCountMap.get(item.subcategory) || 0} módulo{(moduleCountMap.get(item.subcategory) || 0) !== 1 ? 's' : ''}
                        </Badge>
                      </div>

                      {/* Botões de Ordenação */}
                      <div className="flex items-center gap-1">
                        {/* Mover para o topo */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg border border-amber-500/30 hover:bg-amber-500/20 disabled:opacity-30"
                          onClick={() => moveToTop(index)}
                          disabled={index === 0}
                          title="Mover para o topo"
                        >
                          <MoveUp className="h-4 w-4 text-amber-400" />
                        </Button>

                        {/* Subir uma posição */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg border border-amber-500/30 hover:bg-amber-500/20 disabled:opacity-30"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          title="Subir"
                        >
                          <ChevronUp className="h-4 w-4 text-amber-400" />
                        </Button>

                        {/* Descer uma posição */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg border border-amber-500/30 hover:bg-amber-500/20 disabled:opacity-30"
                          onClick={() => moveDown(index)}
                          disabled={index >= localOrder.length - 1}
                          title="Descer"
                        >
                          <ChevronDown className="h-4 w-4 text-amber-400" />
                        </Button>

                        {/* Mover para o final */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg border border-amber-500/30 hover:bg-amber-500/20 disabled:opacity-30"
                          onClick={() => moveToBottom(index)}
                          disabled={index >= localOrder.length - 1}
                          title="Mover para o final"
                        >
                          <MoveDown className="h-4 w-4 text-amber-400" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!selectedCourse || localOrder.length === 0 || saveMutation.isPending}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Ordem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
