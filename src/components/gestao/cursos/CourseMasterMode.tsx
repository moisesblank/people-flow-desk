// ============================================
// 👑 MODO MASTER — REORGANIZAÇÃO DE CURSOS
// Drag & Drop completo com @dnd-kit
// Edição inline, mover aulas, reordenar tudo
// TEMPO REAL via Supabase Realtime
// ============================================

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GripVertical, Save, X, Check, AlertTriangle, Layers,
  PlayCircle, ChevronDown, ChevronRight, Edit2, Trash2,
  Eye, EyeOff, FolderOpen, Sparkles, Zap, Move, RotateCcw,
  ArrowRight, GraduationCap, CheckCircle2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ============================================
// TIPOS
// ============================================
interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  subcategory: string | null;
  position: number;
  is_published: boolean;
  thumbnail_url: string | null;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  position: number;
  is_published: boolean;
}

interface Course {
  id: string;
  title: string;
  is_published: boolean;
}

interface PendingChange {
  type: 'module_position' | 'lesson_position' | 'lesson_move' | 'module_title' | 'lesson_title';
  table: 'modules' | 'lessons';
  id: string;
  changes: Record<string, any>;
  description: string;
}

// ============================================
// HOOKS
// ============================================
function useCourseModulesForMaster(courseId: string | null) {
  return useQuery({
    queryKey: ['master-mode-modules', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('modules')
        .select('id, course_id, title, description, subcategory, position, is_published, thumbnail_url')
        .eq('course_id', courseId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as Module[];
    },
    enabled: !!courseId
  });
}

function useModuleLessonsForMaster(moduleIds: string[]) {
  return useQuery({
    queryKey: ['master-mode-lessons', moduleIds],
    queryFn: async () => {
      if (moduleIds.length === 0) return [];
      const { data, error } = await supabase
        .from('lessons')
        .select('id, module_id, title, position, is_published')
        .in('module_id', moduleIds)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: moduleIds.length > 0
  });
}

function useAllCourses() {
  return useQuery({
    queryKey: ['master-mode-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, is_published')
        .order('title');
      if (error) throw error;
      return data as Course[];
    }
  });
}

// ============================================
// SORTABLE MODULE ITEM
// ============================================
function SortableModuleItem({
  module,
  lessons,
  isExpanded,
  onToggle,
  onTitleChange,
  editingTitle,
  setEditingTitle,
  onLessonTitleChange,
  editingLessonTitle,
  setEditingLessonTitle,
}: {
  module: Module;
  lessons: Lesson[];
  isExpanded: boolean;
  onToggle: () => void;
  onTitleChange: (id: string, title: string) => void;
  editingTitle: string | null;
  setEditingTitle: (id: string | null) => void;
  onLessonTitleChange: (id: string, title: string) => void;
  editingLessonTitle: string | null;
  setEditingLessonTitle: (id: string | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id, data: { type: 'module', module } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [localTitle, setLocalTitle] = useState(module.title);

  useEffect(() => {
    setLocalTitle(module.title);
  }, [module.title]);

  const handleSaveTitle = () => {
    if (localTitle.trim() && localTitle !== module.title) {
      onTitleChange(module.id, localTitle.trim());
    }
    setEditingTitle(null);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border transition-all duration-200 group",
        isDragging 
          ? "opacity-50 scale-[1.02] shadow-2xl shadow-purple-500/30 z-50 bg-purple-900/50" 
          : "bg-card/80 border-border/50 hover:border-purple-500/50"
      )}
    >
      {/* Module Header */}
      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/5 rounded-t-xl border-b border-border/30">
        {/* Drag Handle - ÁREA GRANDE PARA ARRASTAR */}
        <div
          {...attributes}
          {...listeners}
          className="p-2 -m-1 rounded-lg hover:bg-purple-500/20 cursor-grab active:cursor-grabbing transition-colors touch-none select-none"
          title="Segure e arraste para reordenar"
        >
          <GripVertical className="h-5 w-5 text-purple-400" />
        </div>

        {/* Expand Toggle */}
        <button
          onClick={onToggle}
          className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Module Icon */}
        <div className="p-1.5 rounded-lg bg-purple-500/20">
          <Layers className="h-4 w-4 text-purple-400" />
        </div>

        {/* Title (Editable) */}
        {editingTitle === module.id ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              className="h-8 text-sm bg-background/50 border-purple-500/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') setEditingTitle(null);
              }}
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveTitle}>
              <Check className="h-4 w-4 text-green-500" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingTitle(null)}>
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <span className="font-medium text-sm truncate">{module.title}</span>
            <button
              onClick={() => setEditingTitle(module.id)}
              className="p-1 rounded hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Edit2 className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Position Badge */}
        <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
          #{module.position + 1}
        </Badge>

        {/* Status */}
        {module.is_published ? (
          <Eye className="h-4 w-4 text-green-500" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}

        {/* Lesson Count */}
        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
          {lessons.length} aulas
        </Badge>
      </div>

      {/* Lessons List (Collapsible) */}
      <Collapsible open={isExpanded}>
        <CollapsibleContent>
          <div className="p-3 space-y-1">
            <SortableContext
              items={lessons.map(l => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {lessons.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed border-border/50 rounded-lg">
                  Nenhuma aula neste módulo
                  <br />
                  <span className="text-xs">Arraste aulas aqui</span>
                </div>
              ) : (
                lessons.map((lesson) => (
                  <SortableLessonItem
                    key={lesson.id}
                    lesson={lesson}
                    onTitleChange={onLessonTitleChange}
                    isEditing={editingLessonTitle === lesson.id}
                    setEditing={(editing) => setEditingLessonTitle(editing ? lesson.id : null)}
                  />
                ))
              )}
            </SortableContext>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================
// SORTABLE LESSON ITEM
// ============================================
function SortableLessonItem({
  lesson,
  onTitleChange,
  isEditing,
  setEditing,
}: {
  lesson: Lesson;
  onTitleChange: (id: string, title: string) => void;
  isEditing: boolean;
  setEditing: (editing: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id, data: { type: 'lesson', lesson } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [localTitle, setLocalTitle] = useState(lesson.title);

  useEffect(() => {
    setLocalTitle(lesson.title);
  }, [lesson.title]);

  const handleSave = () => {
    if (localTitle.trim() && localTitle !== lesson.title) {
      onTitleChange(lesson.id, localTitle.trim());
    }
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg transition-all duration-200 group",
        isDragging
          ? "opacity-50 scale-[1.02] shadow-xl shadow-cyan-500/20 z-50 bg-cyan-500/20"
          : "bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-cyan-500/30"
      )}
    >
      {/* Drag Handle - ÁREA GRANDE PARA ARRASTAR */}
      <div
        {...attributes}
        {...listeners}
        className="p-1.5 -m-0.5 rounded hover:bg-cyan-500/20 cursor-grab active:cursor-grabbing touch-none select-none"
        title="Segure e arraste para reordenar"
      >
        <GripVertical className="h-4 w-4 text-cyan-400" />
      </div>

      {/* Play Icon */}
      <PlayCircle className="h-4 w-4 text-cyan-400 shrink-0" />

      {/* Title */}
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1">
          <Input
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            className="h-7 text-xs bg-background/50 border-cyan-500/50"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave}>
            <Check className="h-3 w-3 text-green-500" />
          </Button>
        </div>
      ) : (
        <span
          className="flex-1 text-sm truncate cursor-pointer hover:text-cyan-400 transition-colors"
          onDoubleClick={() => setEditing(true)}
        >
          {lesson.title}
        </span>
      )}

      {/* Position */}
      <Badge variant="outline" className="text-xs border-cyan-500/20 text-cyan-400/70">
        #{lesson.position + 1}
      </Badge>

      {/* Status */}
      {lesson.is_published ? (
        <Eye className="h-3 w-3 text-green-500" />
      ) : (
        <EyeOff className="h-3 w-3 text-muted-foreground" />
      )}
    </div>
  );
}

// ============================================
// DRAG OVERLAY COMPONENTS
// ============================================
function ModuleDragOverlay({ module }: { module: Module }) {
  return (
    <div className="p-3 rounded-xl border-2 border-purple-500 bg-card/95 backdrop-blur-sm shadow-2xl shadow-purple-500/30">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-purple-400" />
        <span className="font-medium">{module.title}</span>
        <Badge className="bg-purple-500/20 text-purple-400">Módulo</Badge>
      </div>
    </div>
  );
}

function LessonDragOverlay({ lesson }: { lesson: Lesson }) {
  return (
    <div className="p-2 rounded-lg border-2 border-cyan-500 bg-card/95 backdrop-blur-sm shadow-2xl shadow-cyan-500/30">
      <div className="flex items-center gap-2">
        <PlayCircle className="h-4 w-4 text-cyan-400" />
        <span className="text-sm">{lesson.title}</span>
        <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">Aula</Badge>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
interface CourseMasterModeProps {
  isOpen: boolean;
  onClose: () => void;
  initialCourseId?: string;
}

export function CourseMasterMode({ isOpen, onClose, initialCourseId }: CourseMasterModeProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(initialCourseId || null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editingModuleTitle, setEditingModuleTitle] = useState<string | null>(null);
  const [editingLessonTitle, setEditingLessonTitle] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeType, setActiveType] = useState<'module' | 'lesson' | null>(null);

  // Local state for optimistic updates
  const [localModules, setLocalModules] = useState<Module[]>([]);
  const [localLessons, setLocalLessons] = useState<Lesson[]>([]);

  // Queries
  const { data: courses } = useAllCourses();
  const { data: serverModules, isLoading: loadingModules } = useCourseModulesForMaster(selectedCourseId);
  const moduleIds = useMemo(() => localModules.map(m => m.id), [localModules]);
  const { data: serverLessons, isLoading: loadingLessons } = useModuleLessonsForMaster(moduleIds);

  // Sync server → local
  useEffect(() => {
    if (serverModules) setLocalModules(serverModules);
  }, [serverModules]);

  useEffect(() => {
    if (serverLessons) setLocalLessons(serverLessons);
  }, [serverLessons]);

  // Reset when course changes
  useEffect(() => {
    setPendingChanges([]);
    setExpandedModules(new Set());
  }, [selectedCourseId]);

  // Auto-expand all modules
  useEffect(() => {
    if (localModules.length > 0) {
      setExpandedModules(new Set(localModules.map(m => m.id)));
    }
  }, [localModules]);

  // DnD Sensors - configurado para funcionar melhor com scroll
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 8, // Um pouco maior para evitar ativação acidental
        delay: 100,  // Pequeno delay para diferenciar de clicks
        tolerance: 5
      } 
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Get lessons for a specific module
  const getLessonsForModule = useCallback((moduleId: string) => {
    return localLessons
      .filter(l => l.module_id === moduleId)
      .sort((a, b) => a.position - b.position);
  }, [localLessons]);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    setActiveId(active.id);
    setActiveType(data?.type || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData) return;

    // Module reordering
    if (activeData.type === 'module' && overData?.type === 'module') {
      const oldIndex = localModules.findIndex(m => m.id === active.id);
      const newIndex = localModules.findIndex(m => m.id === over.id);

      if (oldIndex !== newIndex) {
        const newModules = arrayMove(localModules, oldIndex, newIndex).map((m, idx) => ({
          ...m,
          position: idx
        }));
        setLocalModules(newModules);

        // Track changes
        newModules.forEach((m, idx) => {
          if (m.position !== localModules.find(om => om.id === m.id)?.position) {
            addPendingChange({
              type: 'module_position',
              table: 'modules',
              id: m.id,
              changes: { position: idx },
              description: `Módulo "${m.title}" → posição ${idx + 1}`
            });
          }
        });
      }
    }

    // Lesson reordering within same module
    if (activeData.type === 'lesson') {
      const activeLesson = activeData.lesson as Lesson;
      const overLesson = overData?.lesson as Lesson | undefined;

      if (overLesson && activeLesson.module_id === overLesson.module_id) {
        const moduleLessons = getLessonsForModule(activeLesson.module_id);
        const oldIndex = moduleLessons.findIndex(l => l.id === active.id);
        const newIndex = moduleLessons.findIndex(l => l.id === over.id);

        if (oldIndex !== newIndex) {
          const reorderedLessons = arrayMove(moduleLessons, oldIndex, newIndex).map((l, idx) => ({
            ...l,
            position: idx
          }));

          setLocalLessons(prev => {
            const otherLessons = prev.filter(l => l.module_id !== activeLesson.module_id);
            return [...otherLessons, ...reorderedLessons];
          });

          reorderedLessons.forEach(l => {
            addPendingChange({
              type: 'lesson_position',
              table: 'lessons',
              id: l.id,
              changes: { position: l.position },
              description: `Aula "${l.title}" → posição ${l.position + 1}`
            });
          });
        }
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || activeData.type !== 'lesson') return;

    const activeLesson = activeData.lesson as Lesson;

    // Moving lesson to different module
    if (overData?.type === 'module') {
      const targetModuleId = overData.module.id;
      
      if (activeLesson.module_id !== targetModuleId) {
        setLocalLessons(prev => {
          const updated = prev.map(l => {
            if (l.id === activeLesson.id) {
              return { ...l, module_id: targetModuleId };
            }
            return l;
          });
          return updated;
        });

        addPendingChange({
          type: 'lesson_move',
          table: 'lessons',
          id: activeLesson.id,
          changes: { module_id: targetModuleId },
          description: `Aula "${activeLesson.title}" movida para outro módulo`
        });
      }
    }

    // Moving lesson to where another lesson is (different module)
    if (overData?.type === 'lesson') {
      const overLesson = overData.lesson as Lesson;
      
      if (activeLesson.module_id !== overLesson.module_id) {
        setLocalLessons(prev => {
          return prev.map(l => {
            if (l.id === activeLesson.id) {
              return { ...l, module_id: overLesson.module_id };
            }
            return l;
          });
        });

        addPendingChange({
          type: 'lesson_move',
          table: 'lessons',
          id: activeLesson.id,
          changes: { module_id: overLesson.module_id },
          description: `Aula "${activeLesson.title}" movida para outro módulo`
        });
      }
    }
  };

  // Add pending change (deduplicated by id+type)
  const addPendingChange = (change: PendingChange) => {
    setPendingChanges(prev => {
      const existing = prev.findIndex(c => c.id === change.id && c.type === change.type);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], changes: { ...updated[existing].changes, ...change.changes } };
        return updated;
      }
      return [...prev, change];
    });
  };

  // Title change handlers
  const handleModuleTitleChange = (id: string, title: string) => {
    setLocalModules(prev => prev.map(m => m.id === id ? { ...m, title } : m));
    addPendingChange({
      type: 'module_title',
      table: 'modules',
      id,
      changes: { title },
      description: `Módulo renomeado para "${title}"`
    });
  };

  const handleLessonTitleChange = (id: string, title: string) => {
    setLocalLessons(prev => prev.map(l => l.id === id ? { ...l, title } : l));
    addPendingChange({
      type: 'lesson_title',
      table: 'lessons',
      id,
      changes: { title },
      description: `Aula renomeada para "${title}"`
    });
  };

  // Save all changes
  const saveAllChanges = async () => {
    if (pendingChanges.length === 0) return;

    setIsSaving(true);
    try {
      // Group by table for batch updates
      const moduleChanges = pendingChanges.filter(c => c.table === 'modules');
      const lessonChanges = pendingChanges.filter(c => c.table === 'lessons');

      // Update modules
      for (const change of moduleChanges) {
        const { error } = await supabase
          .from('modules')
          .update(change.changes)
          .eq('id', change.id);
        if (error) throw error;
      }

      // Update lessons
      for (const change of lessonChanges) {
        const { error } = await supabase
          .from('lessons')
          .update(change.changes)
          .eq('id', change.id);
        if (error) throw error;
      }

      // Clear pending changes
      setPendingChanges([]);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['master-mode-modules'] });
      queryClient.invalidateQueries({ queryKey: ['master-mode-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-modules'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      queryClient.invalidateQueries({ queryKey: ['aluno-videoaulas'] });

      toast({
        title: '✅ Alterações salvas!',
        description: `${pendingChanges.length} alterações aplicadas com sucesso.`,
      });

    } catch (err: any) {
      toast({
        title: '❌ Erro ao salvar',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Discard changes
  const discardChanges = () => {
    setPendingChanges([]);
    if (serverModules) setLocalModules(serverModules);
    if (serverLessons) setLocalLessons(serverLessons);
    toast({ title: '↩️ Alterações descartadas' });
  };

  // Get active item for overlay
  const getActiveItem = () => {
    if (!activeId) return null;
    if (activeType === 'module') {
      return localModules.find(m => m.id === activeId);
    }
    if (activeType === 'lesson') {
      return localLessons.find(l => l.id === activeId);
    }
    return null;
  };

  const activeItem = getActiveItem();

  const isLoading = loadingModules || loadingLessons;
  const hasPendingChanges = pendingChanges.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] p-0 gap-0 bg-background/95 backdrop-blur-xl border-purple-500/30">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-cyan-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  MODO MASTER — Reorganização
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Arraste para reordenar módulos e aulas. Duplo-clique para editar títulos.
                </DialogDescription>
              </div>
            </div>

            {/* Course Selector */}
            <div className="flex items-center gap-3">
              <Select value={selectedCourseId || ''} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-[250px] bg-background/50 border-purple-500/30">
                  <SelectValue placeholder="Selecionar curso..." />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-purple-400" />
                        {course.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {!selectedCourseId ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <GraduationCap className="h-16 w-16 text-purple-400/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Selecione um curso</h3>
              <p className="text-muted-foreground text-sm">
                Escolha um curso acima para reorganizar seus módulos e aulas
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                >
                  <SortableContext
                    items={localModules.map(m => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {localModules.map((module) => (
                      <SortableModuleItem
                        key={module.id}
                        module={module}
                        lessons={getLessonsForModule(module.id)}
                        isExpanded={expandedModules.has(module.id)}
                        onToggle={() => {
                          const newExpanded = new Set(expandedModules);
                          if (newExpanded.has(module.id)) {
                            newExpanded.delete(module.id);
                          } else {
                            newExpanded.add(module.id);
                          }
                          setExpandedModules(newExpanded);
                        }}
                        onTitleChange={handleModuleTitleChange}
                        editingTitle={editingModuleTitle}
                        setEditingTitle={setEditingModuleTitle}
                        onLessonTitleChange={handleLessonTitleChange}
                        editingLessonTitle={editingLessonTitle}
                        setEditingLessonTitle={setEditingLessonTitle}
                      />
                    ))}
                  </SortableContext>

                  <DragOverlay>
                    {activeItem && activeType === 'module' && (
                      <ModuleDragOverlay module={activeItem as Module} />
                    )}
                    {activeItem && activeType === 'lesson' && (
                      <LessonDragOverlay lesson={activeItem as Lesson} />
                    )}
                  </DragOverlay>
                </DndContext>

                {localModules.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum módulo neste curso</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer - Save Bar */}
        <AnimatePresence>
          {hasPendingChanges && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="border-t border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-cyan-500/10 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    {pendingChanges.length} alterações pendentes
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {pendingChanges.slice(0, 3).map(c => c.description).join(' • ')}
                    {pendingChanges.length > 3 && ` (+${pendingChanges.length - 3} mais)`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={discardChanges}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Descartar
                  </Button>
                  <Button
                    onClick={saveAllChanges}
                    disabled={isSaving}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar Tudo
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
