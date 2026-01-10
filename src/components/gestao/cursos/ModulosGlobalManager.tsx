// ============================================
// 📦 GESTÃO GLOBAL DE MÓDULOS — DESIGN 2300
// Interface futurística para gerenciamento completo
// Hierarquia: Curso → Subcategoria → Módulo → Aulas → Vídeo
// ============================================

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Layers, Search, Edit2, Trash2, Plus, Eye, EyeOff,
  ChevronRight, ChevronDown, PlayCircle, MoreHorizontal,
  FolderOpen, BookOpen, Check, AlertTriangle, Image, Video,
  Clock, Save, X, RefreshCw, Sparkles, GraduationCap,
  MonitorPlay, FileVideo, Pencil, ChevronUp, ExternalLink, Link2, ArrowUpDown,
  GripVertical, Upload,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SacredImage } from '@/components/performance/SacredImage';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// ScrollArea removido - usando div nativo com overflow-y-auto para garantir scroll
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ModuleImageUploader } from './ModuleImageUploader';
import { SubcategoryReorderModal } from './SubcategoryReorderModal';
import { ModuleLessonsPanel } from './ModuleLessonsPanel';

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
  status: string | null;
  xp_reward: number | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  course?: { id: string; title: string; is_published: boolean; };
  _count?: { lessons: number; lessons_published: number; };
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  position: number;
  is_published: boolean;
  video_url: string | null;
  panda_video_id: string | null;
  duration_minutes: number | null;
}

interface Course {
  id: string;
  title: string;
  is_published: boolean;
}

// ============================================
// HOOKS
// ============================================
function useAllModules() {
  return useQuery({
    queryKey: ['gestao-all-modules'],
    queryFn: async () => {
      const { data: modules, error } = await supabase
        .from('modules')
        .select(`*, course:courses(id, title, is_published)`)
        .order('course_id')
        .order('position', { ascending: true });
      
      if (error) throw error;

      // Batch loading para >1000 aulas
      const BATCH_SIZE = 1000;
      let allLessons: { module_id: string; is_published: boolean }[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: batch, error: batchError } = await supabase
          .from('lessons')
          .select('module_id, is_published')
          .range(offset, offset + BATCH_SIZE - 1);
        
        if (batchError) throw batchError;
        if (batch && batch.length > 0) {
          allLessons = [...allLessons, ...batch];
          offset += BATCH_SIZE;
          hasMore = batch.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }

      console.log(`[ModulosGlobalManager] Total aulas carregadas: ${allLessons.length}`);

      const countMap = new Map<string, { total: number; published: number }>();
      allLessons.forEach(l => {
        const curr = countMap.get(l.module_id) || { total: 0, published: 0 };
        curr.total++;
        if (l.is_published) curr.published++;
        countMap.set(l.module_id, curr);
      });

      return (modules || []).map(m => ({
        ...m,
        _count: {
          lessons: countMap.get(m.id)?.total || 0,
          lessons_published: countMap.get(m.id)?.published || 0
        }
      })) as Module[];
    }
  });
}

function useCoursesDropdown() {
  return useQuery({
    queryKey: ['gestao-courses-list'],
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

function useModuleLessonsQuery(moduleId: string | null) {
  return useQuery({
    queryKey: ['gestao-module-lessons', moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      const { data, error } = await supabase
        .from('lessons')
        .select('id, module_id, title, position, is_published, video_url, panda_video_id, duration_minutes')
        .eq('module_id', moduleId)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!moduleId
  });
}

// ============================================
// 🎯 HUD STAT ORB — YEAR 2300 CINEMATIC DESIGN
// Orbes flutuantes com glow holográfico intenso
// ============================================
function HudStatOrb({ 
  icon, 
  value, 
  label, 
  color
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string; 
  color: string;
}) {
  return (
    <div className={cn(
      "relative p-5 md:p-6 rounded-2xl border-2",
      "bg-gradient-to-br cursor-default select-none",
      color
    )}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-current opacity-50 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-current opacity-50 rounded-tr-xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-current opacity-50 rounded-bl-xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-current opacity-50 rounded-br-xl pointer-events-none" />
      
      <div className="flex items-center gap-4">
        {/* Icon container */}
        <div className="p-3 rounded-xl bg-background/30 border border-current/30 shadow-inner">
          {icon}
        </div>
        
        {/* Value and label */}
        <div>
          <p className="text-3xl md:text-4xl font-black tracking-tight tabular-nums">
            {value.toLocaleString()}
          </p>
          <p className="text-xs md:text-sm font-semibold uppercase tracking-widest opacity-80">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 🎨 LEGENDA VISUAL — YEAR 2300 CINEMATIC
// Barra de navegação hierárquica com glow
// ============================================
function HierarchyLegend() {
  return (
    <div className="relative p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-green-500/10 border-2 border-border/40 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 justify-center">
        <span className="text-sm font-bold text-foreground/80 mr-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          HIERARQUIA:
        </span>
        
        {/* Curso */}
        <Badge className="px-4 py-2 text-sm bg-purple-500/30 text-purple-200 border-2 border-purple-500/50">
          <GraduationCap className="h-4 w-4 mr-2" />
          Curso
        </Badge>
        
        <ChevronRight className="h-5 w-5 text-purple-400" />
        
        {/* Subcategoria */}
        <Badge className="px-4 py-2 text-sm bg-amber-500/30 text-amber-200 border-2 border-amber-500/50">
          <FolderOpen className="h-4 w-4 mr-2" />
          Subcategoria
        </Badge>
        
        <ChevronRight className="h-5 w-5 text-amber-400" />
        
        {/* Módulo */}
        <Badge className="px-4 py-2 text-sm bg-cyan-500/30 text-cyan-200 border-2 border-cyan-500/50">
          <Layers className="h-4 w-4 mr-2" />
          Módulo
        </Badge>
        
        <ChevronRight className="h-5 w-5 text-cyan-400" />
        
        {/* Aulas */}
        <Badge className="px-4 py-2 text-sm bg-green-500/30 text-green-200 border-2 border-green-500/50">
          <PlayCircle className="h-4 w-4 mr-2" />
          Aulas
        </Badge>
        
        <ChevronRight className="h-5 w-5 text-green-400" />
        
        {/* Vídeo */}
        <Badge className="px-4 py-2 text-sm bg-red-500/30 text-red-200 border-2 border-red-500/50">
          <MonitorPlay className="h-4 w-4 mr-2" />
          Vídeo
        </Badge>
      </div>
    </div>
  );
}

// ============================================
// 📚 COURSE SECTION — YEAR 2300 CINEMATIC CARD
// Card de curso com design holográfico premium
// ============================================
function CourseSection({ 
  course, 
  subcategoryGroups, 
  expandedModules,
  onToggleModule,
  onEditModule,
  onDeleteModule,
  onTogglePublish
}: {
  course: Course | null;
  subcategoryGroups: { subcategory: string | null; modules: Module[] }[];
  expandedModules: Set<string>;
  onToggleModule: (id: string) => void;
  onEditModule: (module: Module) => void;
  onDeleteModule: (module: Module) => void;
  onTogglePublish: (module: Module) => void;
}) {
  // 🔒 COLLAPSIBLE: Inicia fechado - usuário deve clicar para expandir
  const [isOpen, setIsOpen] = useState(false);
  const totalModules = subcategoryGroups.reduce((acc, g) => acc + g.modules.length, 0);
  const totalLessons = subcategoryGroups.reduce((acc, g) => 
    acc + g.modules.reduce((a, m) => a + (m._count?.lessons || 0), 0), 0);
  const totalSubcats = subcategoryGroups.length;

  return (
    <Card className={cn(
      "relative overflow-hidden",
      "bg-gradient-to-br from-card via-card/95 to-purple-950/20",
      "border-2 border-purple-500/30",
      "shadow-xl shadow-purple-500/10",
      "rounded-3xl"
    )}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20 border-l-4 border-t-4 border-purple-500/40 rounded-tl-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-20 h-20 border-r-4 border-t-4 border-pink-500/40 rounded-tr-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-20 h-20 border-l-4 border-b-4 border-purple-500/40 rounded-bl-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-r-4 border-b-4 border-pink-500/40 rounded-br-3xl pointer-events-none" />
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer relative z-10 py-6 px-6 bg-gradient-to-r from-purple-500/15 via-purple-500/5 to-pink-500/15 border-b-2 border-purple-500/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                {/* Icon orb */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-500/50 shadow-xl shadow-purple-500/20">
                  <GraduationCap className="h-8 w-8 text-purple-300" />
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-2xl md:text-3xl font-black flex items-center gap-3 flex-wrap">
                    {course?.title || 'Sem Curso'}
                    {course?.is_published && (
                      <Badge className="px-3 py-1 text-sm bg-green-500/30 text-green-300 border-2 border-green-500/50 shadow-lg shadow-green-500/20">
                        <Eye className="h-4 w-4 mr-1" />
                        Publicado
                      </Badge>
                    )}
                  </CardTitle>
                  
                  {/* Stats row */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                      <Layers className="h-4 w-4 text-cyan-400" />
                      <span className="text-lg font-bold text-cyan-300">{totalModules}</span>
                      <span className="text-xs text-cyan-400/80 uppercase tracking-wide">módulos</span>
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                      <FolderOpen className="h-4 w-4 text-amber-400" />
                      <span className="text-lg font-bold text-amber-300">{totalSubcats}</span>
                      <span className="text-xs text-amber-400/80 uppercase tracking-wide">subcategorias</span>
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-500/30">
                      <PlayCircle className="h-4 w-4 text-green-400" />
                      <span className="text-lg font-bold text-green-300">{totalLessons}</span>
                      <span className="text-xs text-green-400/80 uppercase tracking-wide">aulas</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Toggle button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-12 w-12 rounded-xl border-2 border-purple-500/30 bg-purple-500/10"
              >
                {isOpen ? <ChevronUp className="h-6 w-6 text-purple-300" /> : <ChevronDown className="h-6 w-6 text-purple-300" />}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-0">
            {/* SCROLLABLE CONTENT RULE: div nativo com overflow-y-auto */}
            <div className="overflow-y-auto max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh]">
              <div className="p-5 space-y-5">
                {subcategoryGroups.map(({ subcategory, modules: groupModules }) => (
                  <SubcategorySection
                    key={subcategory || 'default'}
                    subcategory={subcategory}
                    modules={groupModules}
                    expandedModules={expandedModules}
                    onToggleModule={onToggleModule}
                    onEditModule={onEditModule}
                    onDeleteModule={onDeleteModule}
                    onTogglePublish={onTogglePublish}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================
// 📂 SUBCATEGORY SECTION — YEAR 2300 CINEMATIC
// Agrupador visual com design holográfico
// ============================================
function SubcategorySection({
  subcategory,
  modules,
  expandedModules,
  onToggleModule,
  onEditModule,
  onDeleteModule,
  onTogglePublish,
}: {
  subcategory: string | null;
  modules: Module[];
  expandedModules: Set<string>;
  onToggleModule: (id: string) => void;
  onEditModule: (module: Module) => void;
  onDeleteModule: (module: Module) => void;
  onTogglePublish: (module: Module) => void;
}) {
  // 🔒 COLLAPSIBLE: Inicia fechado - usuário deve clicar para expandir módulos
  const [isOpen, setIsOpen] = useState(false);
  const [localModules, setLocalModules] = useState<Module[]>(modules);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const totalLessons = localModules.reduce((a, m) => a + (m._count?.lessons || 0), 0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setLocalModules(modules);
  }, [modules]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const persistReorderMutation = useMutation({
    mutationFn: async (ordered: Module[]) => {
      // Regrava posições 0..N-1 para esta subcategoria (verdade no banco)
      const updates = ordered.map((m, idx) => ({ id: m.id, position: idx }));
      const results = await Promise.all(
        updates.map((u) =>
          supabase
            .from('modules')
            .update({ position: u.position })
            .eq('id', u.id)
        )
      );
      const anyError = results.find((r) => r.error)?.error;
      if (anyError) throw anyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      toast({ title: '✅ Ordem salva', description: 'Módulos reordenados com sucesso.' });
    },
    onError: (err: any) => {
      toast({ title: '❌ Erro ao salvar ordem', description: err.message, variant: 'destructive' });
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveModuleId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveModuleId(null);
    if (!over || active.id === over.id) return;

    setLocalModules((prev) => {
      const oldIndex = prev.findIndex((m) => m.id === active.id);
      const newIndex = prev.findIndex((m) => m.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = arrayMove(prev, oldIndex, newIndex).map((m, idx) => ({ ...m, position: idx }));
      // Persistir em background (sem travar UI)
      persistReorderMutation.mutate(next);
      return next;
    });
  };

  const moduleIds = useMemo(() => localModules.map((m) => m.id), [localModules]);
  const activeModule = useMemo(
    () => localModules.find((m) => m.id === activeModuleId) || null,
    [localModules, activeModuleId]
  );

  return (
    <div className="space-y-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/30">
            {/* Icon */}
            <div className="p-2.5 rounded-xl bg-amber-500/30 border border-amber-500/40">
              <FolderOpen className="h-5 w-5 text-amber-300" />
            </div>

            <span className="font-bold text-lg text-amber-200 flex-1">{subcategory || '📁 Sem Subcategoria'}</span>

            <div className="flex items-center gap-3">
              <Badge className="px-3 py-1.5 text-sm bg-amber-500/20 text-amber-300 border-2 border-amber-500/40 shadow-md shadow-amber-500/10">
                <Layers className="h-3.5 w-3.5 mr-1.5" />
                {localModules.length} módulo{localModules.length !== 1 ? 's' : ''}
              </Badge>
              <Badge className="px-3 py-1.5 text-sm bg-green-500/20 text-green-300 border-2 border-green-500/40 shadow-md shadow-green-500/10">
                <PlayCircle className="h-3.5 w-3.5 mr-1.5" />
                {totalLessons} aula{totalLessons !== 1 ? 's' : ''}
              </Badge>

              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                {isOpen ? <ChevronUp className="h-4 w-4 text-amber-300" /> : <ChevronDown className="h-4 w-4 text-amber-300" />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="pl-6 mt-3 space-y-3 border-l-4 border-amber-500/30">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {localModules.map((module, idx) => (
                    <SortableModuleCard
                      key={module.id}
                      module={module}
                      index={idx}
                      isExpanded={expandedModules.has(module.id)}
                      onToggle={() => onToggleModule(module.id)}
                      onEdit={() => onEditModule(module)}
                      onDelete={() => onDeleteModule(module)}
                      onTogglePublish={() => onTogglePublish(module)}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Overlay simples */}
              {activeModule && (
                <div className="hidden" aria-hidden="true">
                  {activeModule.title}
                </div>
              )}
            </DndContext>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================
// SORTABLE MODULE CARD — drag dentro da subcategoria
// ============================================
function SortableModuleCard({
  module,
  index,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ModuleCard
        module={module}
        index={index}
        isExpanded={isExpanded}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePublish={onTogglePublish}
      />
    </div>
  );
}

// ============================================
// LESSON ROW - Linha de aula clicável e editável
// ============================================
function LessonRow({ lesson }: { lesson: Lesson }) {
  const [isEditing, setIsEditing] = useState(false);
  const [videoUrl, setVideoUrl] = useState(lesson.video_url || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (newUrl: string) => {
      const { error } = await supabase
        .from('lessons')
        .update({ video_url: newUrl || null })
        .eq('id', lesson.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-module-lessons'] });
      toast({ title: 'URL atualizada', description: 'O vídeo foi vinculado com sucesso.' });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    }
  });

  // Toggle publish mutation
  const togglePublishMutation = useMutation({
    mutationFn: async (newStatus: boolean) => {
      const { error } = await supabase
        .from('lessons')
        .update({ is_published: newStatus })
        .eq('id', lesson.id);
      if (error) throw error;
    },
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['gestao-module-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas'] });
      toast({ 
        title: newStatus ? 'Aula publicada' : 'Aula ocultada', 
        description: newStatus ? 'A aula está visível para alunos.' : 'A aula foi ocultada dos alunos.' 
      });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao alterar status', description: error.message, variant: 'destructive' });
    }
  });

  const handleTogglePublish = () => {
    togglePublishMutation.mutate(!lesson.is_published);
  };

  const handleSave = () => {
    updateMutation.mutate(videoUrl);
  };

  // Determina se há vídeo (video_url OU panda_video_id)
  const hasVideo = !!(lesson.video_url || lesson.panda_video_id);
  
  // Gera URL do vídeo (prioriza video_url, fallback para Panda)
  const getVideoUrl = () => {
    if (lesson.video_url) return lesson.video_url;
    if (lesson.panda_video_id) {
      return `https://player-vz-c3e3c21e-7ce.tv.pandavideo.com.br/embed/?v=${lesson.panda_video_id}`;
    }
    return null;
  };

  const handleOpenVideo = () => {
    const url = getVideoUrl();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg text-sm transition-all group",
        "bg-gradient-to-r from-green-500/5 to-emerald-500/5",
        "border border-green-500/10 hover:border-green-500/30",
        !lesson.is_published && "opacity-50"
      )}
    >
      <div className="p-1 rounded bg-green-500/20">
        <PlayCircle className="h-3 w-3 text-green-400" />
      </div>
      
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Cole a URL do vídeo (YouTube ou Panda)"
            className="h-7 text-xs bg-background/80 border-cyan-500/30 flex-1"
            autoFocus
          />
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6 hover:bg-green-500/20 text-green-400"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6 hover:bg-red-500/20 text-red-400"
            onClick={() => { setIsEditing(false); setVideoUrl(lesson.video_url || ''); }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <>
          <span className="truncate flex-1 text-sm">{lesson.title}</span>
          
          {hasVideo ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 gap-1 text-xs bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 hover:text-red-200"
              onClick={handleOpenVideo}
              title="Abrir vídeo em nova aba"
            >
              <MonitorPlay className="h-3 w-3" />
              Vídeo
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          ) : (
            <Badge className="text-xs bg-muted/50 text-muted-foreground border-border/30">
              <Link2 className="h-3 w-3 mr-1" />
              Sem vídeo
            </Badge>
          )}
          
          {/* Toggle Publish Button - Always Visible */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 transition-colors",
              lesson.is_published 
                ? "text-green-400 hover:bg-amber-500/20 hover:text-amber-400" 
                : "text-muted-foreground hover:bg-green-500/20 hover:text-green-400"
            )}
            onClick={handleTogglePublish}
            disabled={togglePublishMutation.isPending}
            title={lesson.is_published ? "Ocultar aula" : "Publicar aula"}
          >
            {lesson.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-cyan-500/20 text-cyan-400 transition-opacity"
            onClick={() => setIsEditing(true)}
            title="Editar URL do vídeo"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          
          {lesson.duration_minutes && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lesson.duration_minutes}min
            </span>
          )}
          <Badge variant="outline" className="text-xs border-border/30">
            #{lesson.position + 1}
          </Badge>
        </>
      )}
    </div>
  );
}


// ============================================
// 📦 MODULE CARD — YEAR 2300 CINEMATIC
// Card de módulo com design holográfico
// ============================================
function ModuleCard({ 
  module, 
  index, 
  isExpanded, 
  onToggle, 
  onEdit, 
  onDelete, 
  onTogglePublish
}: {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const { data: lessons } = useModuleLessonsQuery(isExpanded ? module.id : null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingPosition, setIsEditingPosition] = useState(false);
  const [positionValue, setPositionValue] = useState(String(module.position + 1));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const positionInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handler para salvar nova posição
  const handlePositionSave = async () => {
    const newPos = parseInt(positionValue, 10);
    if (isNaN(newPos) || newPos < 1) {
      setPositionValue(String(module.position + 1));
      setIsEditingPosition(false);
      return;
    }
    const dbPosition = newPos - 1; // UI mostra 1-indexed, DB é 0-indexed
    if (dbPosition === module.position) {
      setIsEditingPosition(false);
      return;
    }
    try {
      const { error } = await supabase
        .from('modules')
        .update({ position: dbPosition })
        .eq('id', module.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      toast({ title: '✅ Posição atualizada', description: `Módulo movido para posição ${newPos}` });
    } catch (err: any) {
      console.error('[ModuleCard] Position update error:', err);
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
      setPositionValue(String(module.position + 1));
    }
    setIsEditingPosition(false);
  };

  const handlePositionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePositionSave();
    } else if (e.key === 'Escape') {
      setPositionValue(String(module.position + 1));
      setIsEditingPosition(false);
    }
  };

  // Sincronizar quando module.position mudar externamente
  useEffect(() => {
    setPositionValue(String(module.position + 1));
  }, [module.position]);

  // Upload handler direto na thumbnail
  const handleThumbnailUpload = async (file: File) => {
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erro', description: 'Apenas imagens são permitidas', variant: 'destructive' });
      return;
    }
    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Erro', description: 'Imagem deve ter no máximo 5MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `module-${module.id}-${Date.now()}.${ext}`;
      const filePath = `modules/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('materiais')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('materiais')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Atualizar módulo com a nova URL
      const { error: updateError } = await supabase
        .from('modules')
        .update({ thumbnail_url: publicUrl })
        .eq('id', module.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      toast({ title: '✅ Capa atualizada', description: 'Imagem 752x940 salva com sucesso.' });
    } catch (err: any) {
      console.error('[ModuleCard] Upload error:', err);
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleThumbnailUpload(file);
    // Reset input para permitir re-upload do mesmo arquivo
    e.target.value = '';
  };

  const handleThumbnailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 transition-all",
        module.is_published 
          ? "bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-blue-500/10"
          : "bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-amber-500/10 opacity-70",
        isExpanded 
          ? module.is_published
            ? "border-cyan-400/60 shadow-xl shadow-cyan-500/15"
            : "border-rose-400/60 shadow-xl shadow-rose-500/20"
          : module.is_published
            ? "border-cyan-500/30"
            : "border-rose-500/40 border-dashed"
      )}
    >
      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Corner accents */}
      <div className={cn(
        "absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 rounded-tl-2xl pointer-events-none",
        module.is_published ? "border-cyan-500/40" : "border-rose-500/50"
      )} />
      <div className={cn(
        "absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 rounded-tr-2xl pointer-events-none",
        module.is_published ? "border-cyan-500/40" : "border-rose-500/50"
      )} />
      
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className="flex items-center gap-4 p-4">
          {/* Expand button */}
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 shrink-0 rounded-xl border-2 border-cyan-500/30 bg-cyan-500/10"
            >
              <ChevronRight className={cn("h-5 w-5 text-cyan-300", isExpanded && "rotate-90")} />
            </Button>
          </CollapsibleTrigger>

          {/* Thumbnail CLICÁVEL para upload direto (752x940) */}
          <div
            onClick={handleThumbnailClick}
            className={cn(
              "relative w-14 h-16 rounded-xl overflow-hidden shrink-0 cursor-pointer transition-all group/thumb",
              "hover:scale-105 hover:shadow-xl",
              module.thumbnail_url 
                ? "border-2 border-green-500/40 bg-muted shadow-lg shadow-green-500/10" 
                : "border-2 border-dashed border-red-500/50 bg-red-500/10",
              isUploading && "opacity-50 pointer-events-none animate-pulse"
            )}
            title="Clique para alterar capa (752x940)"
          >
            {module.thumbnail_url ? (
              <>
                <SacredImage src={module.thumbnail_url} alt={module.title} className="w-full h-full" objectFit="cover" />
                {/* Overlay de hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="h-5 w-5 text-white" />
                </div>
                {/* Badge de sucesso */}
                <div className="absolute bottom-1 right-1 p-1 rounded-full bg-green-500 shadow-lg shadow-green-500/30 group-hover/thumb:opacity-0 transition-opacity">
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                {isUploading ? (
                  <RefreshCw className="h-5 w-5 text-cyan-400 animate-spin" />
                ) : (
                  <>
                    <Image className="h-4 w-4 text-red-400 group-hover/thumb:hidden" />
                    <Upload className="h-4 w-4 text-cyan-400 hidden group-hover/thumb:block" />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Posição EDITÁVEL inline */}
              {isEditingPosition ? (
                <input
                  ref={positionInputRef}
                  type="number"
                  min={1}
                  value={positionValue}
                  onChange={(e) => setPositionValue(e.target.value)}
                  onBlur={handlePositionSave}
                  onKeyDown={handlePositionKeyDown}
                  autoFocus
                  className="w-14 h-7 px-2 text-sm font-bold text-center rounded-lg bg-cyan-500/30 text-cyan-200 border-2 border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <Badge 
                  className="px-3 py-1 text-sm bg-cyan-500/30 text-cyan-200 border-2 border-cyan-500/50 shadow-md shadow-cyan-500/10 cursor-pointer hover:bg-cyan-500/50 hover:border-cyan-400 transition-all"
                  onClick={(e) => { e.stopPropagation(); setIsEditingPosition(true); }}
                  title="Clique para editar posição"
                >
                  #{module.position + 1}
                </Badge>
              )}
              <h4 className="font-bold text-base truncate">{module.title}</h4>
              {!module.is_published && (
                <Badge className="px-2 py-1 text-xs bg-rose-500/30 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-500/20">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Oculto
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/15 border border-green-500/25">
                <PlayCircle className="h-4 w-4 text-green-400" />
                <strong className="text-green-300">{module._count?.lessons || 0}</strong>
                <span className="text-green-400/70 text-xs">aulas</span>
              </span>
              {module.subcategory && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25">
                  <FolderOpen className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-300 text-xs">{module.subcategory}</span>
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/30 hover:border-cyan-400/50"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              title="Editar módulo"
            >
              <Pencil className="h-4 w-4 text-cyan-300" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border/30 bg-muted/30 hover:bg-muted/60">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border/50">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="h-4 w-4 mr-2 text-cyan-400" />
                  Editar Módulo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onTogglePublish}>
                  {module.is_published ? (
                    <><EyeOff className="h-4 w-4 mr-2 text-amber-400" />Ocultar</>
                  ) : (
                    <><Eye className="h-4 w-4 mr-2 text-green-400" />Publicar</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Aulas expandidas */}
        <CollapsibleContent>
          <div className="px-4 pb-4">
            <div className="ml-14 pl-4 border-l-4 border-green-500/30 space-y-2">
              {lessons && lessons.length > 0 ? (
                lessons.map((lesson) => (
                  <LessonRow key={lesson.id} lesson={lesson} />
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center italic bg-muted/20 rounded-xl border border-dashed border-border/30">
                  Nenhuma aula neste módulo
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================
// MODULE FORM - Formulário de edição
// ============================================
interface ModuleFormState {
  title: string;
  description: string;
  subcategory: string;
  position: number;
  is_published: boolean;
  thumbnail_url: string;
  course_id: string;
}

function ModuleFormContent({ form, setForm, courses, availableSubcategories }: {
  form: ModuleFormState;
  setForm: React.Dispatch<React.SetStateAction<ModuleFormState>>;
  courses: Course[];
  availableSubcategories: string[];
}) {
  return (
    <div className="grid gap-4 py-4">
      {/* Curso */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-purple-400" />
          Curso <span className="text-destructive">*</span>
        </Label>
        <Select value={form.course_id} onValueChange={(v) => setForm(p => ({ ...p, course_id: v }))}>
          <SelectTrigger className="bg-background/50 border-purple-500/30 focus:border-purple-500">
            <SelectValue placeholder="Selecione o curso" />
          </SelectTrigger>
          <SelectContent>
            {courses.map(c => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-400" />
                  {c.title}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Título */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          Nome do Módulo <span className="text-destructive">*</span>
        </Label>
        <Input
          value={form.title}
          onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="Ex: Estequiometria - Cálculos Químicos"
          className="bg-background/50 border-cyan-500/30 focus:border-cyan-500"
        />
      </div>

      {/* Subcategoria */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-amber-400" />
          Subcategoria
          <Badge className="text-xs bg-amber-500/20 text-amber-300 border-amber-500/30">Agrupador</Badge>
        </Label>
        <div className="flex gap-2">
          <Input
            value={form.subcategory}
            onChange={(e) => setForm(p => ({ ...p, subcategory: e.target.value }))}
            placeholder="Ex: Resoluções, Teoria, Revisão"
            className="bg-background/50 border-amber-500/30 focus:border-amber-500 flex-1"
            list="subcategory-suggestions"
          />
          <datalist id="subcategory-suggestions">
            {availableSubcategories.map(sub => (
              <option key={sub} value={sub} />
            ))}
          </datalist>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Agrupa módulos dentro do curso. Use nomes como "Teoria ENEM", "Resoluções", etc.
        </p>
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label>Descrição (opcional)</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="Descreva brevemente o conteúdo deste módulo..."
          rows={2}
          className="bg-background/50"
        />
      </div>

      {/* Imagem - Upload Direto */}
      <ModuleImageUploader
        value={form.thumbnail_url}
        onChange={(url) => setForm(p => ({ ...p, thumbnail_url: url }))}
        showPreview={true}
        previewSize="sm"
      />

      {/* Posição e Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Posição/Ordem</Label>
          <Input
            type="number"
            value={form.position}
            onChange={(e) => setForm(p => ({ ...p, position: parseInt(e.target.value) || 0 }))}
            className="bg-background/50"
          />
        </div>
        <div className="flex items-center gap-3 pt-7">
          <Switch
            checked={form.is_published}
            onCheckedChange={(v) => setForm(p => ({ ...p, is_published: v }))}
          />
          <Label className="cursor-pointer flex items-center gap-2">
            {form.is_published ? (
              <><Eye className="h-4 w-4 text-green-400" /> Visível</>
            ) : (
              <><EyeOff className="h-4 w-4 text-muted-foreground" /> Oculto</>
            )}
          </Label>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export function ModulosGlobalManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('all');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Module | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [reorderSubcatDialog, setReorderSubcatDialog] = useState(false);
  const [moduleForm, setModuleForm] = useState<ModuleFormState>({
    title: '',
    description: '',
    subcategory: '',
    position: 0,
    is_published: true,
    thumbnail_url: '',
    course_id: ''
  });

  // Queries
  const { data: modules, isLoading, refetch } = useAllModules();
  const { data: courses } = useCoursesDropdown();
  
  // Buscar ordenação de subcategorias
  const { data: subcategoryOrdering } = useQuery({
    queryKey: ['subcategory-ordering-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcategory_ordering')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as { course_id: string; subcategory: string; position: number }[];
    }
  });

  // Realtime com debounce 5s (evita Thundering Herd)
  const invalidateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedInvalidateModules = useCallback(() => {
    if (invalidateTimeoutRef.current) clearTimeout(invalidateTimeoutRef.current);
    invalidateTimeoutRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-module-lessons'] });
    }, 5000);
  }, [queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel('modules-global-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, debouncedInvalidateModules)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, debouncedInvalidateModules)
      .subscribe();

    return () => {
      if (invalidateTimeoutRef.current) clearTimeout(invalidateTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [debouncedInvalidateModules]);

  // Mutations
  const createModule = useMutation({
    mutationFn: async (data: ModuleFormState) => {
      const { data: result, error } = await supabase
        .from('modules')
        .insert({
          title: data.title,
          description: data.description || null,
          subcategory: data.subcategory || null,
          position: data.position,
          is_published: data.is_published,
          thumbnail_url: data.thumbnail_url || null,
          course_id: data.course_id,
          status: 'active'
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      toast({ title: '✅ Módulo criado!' });
      setCreateDialog(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
    }
  });

  const updateModule = useMutation({
    mutationFn: async (data: ModuleFormState & { id: string }) => {
      const { error } = await supabase
        .from('modules')
        .update({
          title: data.title,
          description: data.description || null,
          subcategory: data.subcategory || null,
          position: data.position,
          is_published: data.is_published,
          thumbnail_url: data.thumbnail_url || null,
          course_id: data.course_id,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      toast({ title: '✅ Módulo atualizado!' });
      setEditDialog(false);
      setSelectedModule(null);
    },
    onError: (err: any) => {
      toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
    }
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('modules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      toast({ title: '🗑️ Módulo excluído!' });
      setDeleteDialog(null);
    },
    onError: (err: any) => {
      toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
    }
  });

  const togglePublish = useMutation({
    mutationFn: async (module: Module) => {
      const { error } = await supabase
        .from('modules')
        .update({ is_published: !module.is_published })
        .eq('id', module.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      toast({ title: '✅ Status atualizado!' });
    }
  });

  // Helpers
  const resetForm = () => {
    setModuleForm({
      title: '',
      description: '',
      subcategory: '',
      position: 0,
      is_published: true,
      thumbnail_url: '',
      course_id: ''
    });
  };

  const openEdit = (module: Module) => {
    setSelectedModule(module);
    setModuleForm({
      title: module.title,
      description: module.description || '',
      subcategory: module.subcategory || '',
      position: module.position,
      is_published: module.is_published,
      thumbnail_url: module.thumbnail_url || '',
      course_id: module.course_id
    });
    setEditDialog(true);
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedModules);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedModules(newSet);
  };

  // Available subcategories (dynamic)
  const availableSubcategories = useMemo(() => {
    const all = modules || [];
    const filtered = filterCourse !== 'all' 
      ? all.filter(m => m.course_id === filterCourse)
      : all;
    
    const subcatSet = new Set<string>();
    filtered.forEach(m => {
      if (m.subcategory) subcatSet.add(m.subcategory);
    });
    return Array.from(subcatSet).sort();
  }, [modules, filterCourse]);

  // Filtered modules
  const filteredModules = useMemo(() => {
    let result = modules || [];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(m => 
        m.title.toLowerCase().includes(term) ||
        m.description?.toLowerCase().includes(term) ||
        m.subcategory?.toLowerCase().includes(term) ||
        m.course?.title.toLowerCase().includes(term)
      );
    }
    
    if (filterCourse !== 'all') {
      result = result.filter(m => m.course_id === filterCourse);
    }

    if (filterSubcategory !== 'all') {
      result = result.filter(m => m.subcategory === filterSubcategory);
    }

    return result;
  }, [modules, searchTerm, filterCourse, filterSubcategory]);

  // Stats
  const stats = useMemo(() => {
    const all = modules || [];
    return {
      total: all.length,
      published: all.filter(m => m.is_published).length,
      totalLessons: all.reduce((sum, m) => sum + (m._count?.lessons || 0), 0),
      subcategories: new Set(all.map(m => m.subcategory).filter(Boolean)).size
    };
  }, [modules]);

  // Group by course AND subcategory (respeitando ordenação salva)
  const modulesByCourseAndSubcategory = useMemo(() => {
    const courseMap = new Map<string, { 
      course: Course | null; 
      subcategories: Map<string, Module[]>;
    }>();
    
    filteredModules.forEach(m => {
      const courseKey = m.course_id;
      const subcatKey = m.subcategory || '__sem_subcategoria__';
      
      if (!courseMap.has(courseKey)) {
        courseMap.set(courseKey, { 
          course: m.course || null, 
          subcategories: new Map() 
        });
      }
      
      const courseData = courseMap.get(courseKey)!;
      if (!courseData.subcategories.has(subcatKey)) {
        courseData.subcategories.set(subcatKey, []);
      }
      courseData.subcategories.get(subcatKey)!.push(m);
    });
    
    // Criar mapa de posições por curso
    const orderingMap = new Map<string, Map<string, number>>();
    subcategoryOrdering?.forEach(o => {
      if (!orderingMap.has(o.course_id)) {
        orderingMap.set(o.course_id, new Map());
      }
      orderingMap.get(o.course_id)!.set(o.subcategory, o.position);
    });
    
    return Array.from(courseMap.values()).map(({ course, subcategories }) => {
      const courseOrderMap = course?.id ? orderingMap.get(course.id) : null;
      
      const groups = Array.from(subcategories.entries()).map(([key, mods]) => ({
        subcategory: key === '__sem_subcategoria__' ? null : key,
        modules: mods,
        position: key === '__sem_subcategoria__' ? 999999 : (courseOrderMap?.get(key) ?? 999998)
      }));
      
      // Ordenar: primeiro por position salva, depois alfabético
      groups.sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        const aName = a.subcategory || '';
        const bName = b.subcategory || '';
        return aName.localeCompare(bName, 'pt-BR');
      });
      
      return {
        course,
        subcategoryGroups: groups.map(({ subcategory, modules }) => ({ subcategory, modules }))
      };
    });
  }, [filteredModules, subcategoryOrdering]);

  return (
    <div className="space-y-6">
      {/* Header com legenda */}
      <HierarchyLegend />

      {/* Stats HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HudStatOrb 
          icon={<Layers className="h-5 w-5 text-purple-400" />} 
          value={stats.total} 
          label="Módulos" 
          color="from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-300" 
        />
        <HudStatOrb 
          icon={<Eye className="h-5 w-5 text-green-400" />} 
          value={stats.published} 
          label="Publicados" 
          color="from-green-500/20 to-green-600/10 border-green-500/30 text-green-300" 
        />
        <HudStatOrb 
          icon={<PlayCircle className="h-5 w-5 text-cyan-400" />} 
          value={stats.totalLessons} 
          label="Total Aulas" 
          color="from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-300" 
        />
        <HudStatOrb 
          icon={<FolderOpen className="h-5 w-5 text-amber-400" />} 
          value={stats.subcategories} 
          label="Subcategorias" 
          color="from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-300" 
        />
      </div>

      {/* Toolbar */}
      <Card className="bg-card/80 backdrop-blur-xl border-border/30">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="🔍 Buscar módulos, aulas, subcategorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-border/50 focus:border-cyan-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Select value={filterCourse} onValueChange={(v) => { setFilterCourse(v); setFilterSubcategory('all'); }}>
                <SelectTrigger className="w-[180px] bg-background/50 border-purple-500/30">
                  <GraduationCap className="h-4 w-4 mr-2 text-purple-400" />
                  <SelectValue placeholder="Curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Cursos</SelectItem>
                  {courses?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSubcategory} onValueChange={setFilterSubcategory}>
                <SelectTrigger className="w-[180px] bg-background/50 border-amber-500/30">
                  <FolderOpen className="h-4 w-4 mr-2 text-amber-400" />
                  <SelectValue placeholder="Subcategoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {availableSubcategories.map(sub => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={() => refetch()} variant="outline" className="bg-background/50">
                <RefreshCw className="h-4 w-4" />
              </Button>

              <Button 
                onClick={() => setReorderSubcatDialog(true)} 
                variant="outline" 
                className="bg-background/50 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Ordenar Subcategorias
              </Button>

              <Button onClick={() => setCreateDialog(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25">
                <Plus className="h-4 w-4 mr-2" />
                Novo Módulo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-40 bg-muted/30 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredModules.length === 0 ? (
        <Card className="bg-card/80 backdrop-blur-xl border-border/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-purple-500/10 mb-4">
              <Sparkles className="h-12 w-12 text-purple-400" />
            </div>
            <h3 className="font-medium text-lg">Nenhum módulo encontrado</h3>
            <p className="text-muted-foreground mt-1">
              {searchTerm || filterCourse !== 'all' ? 'Tente ajustar os filtros' : 'Crie seu primeiro módulo'}
            </p>
            <Button onClick={() => setCreateDialog(true)} className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500">
              <Plus className="h-4 w-4 mr-2" />
              Criar Módulo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {modulesByCourseAndSubcategory.map(({ course, subcategoryGroups }) => (
            <CourseSection
              key={course?.id || 'no-course'}
              course={course}
              subcategoryGroups={subcategoryGroups}
              expandedModules={expandedModules}
              onToggleModule={toggleExpand}
              onEditModule={openEdit}
              onDeleteModule={(m) => setDeleteDialog(m)}
              onTogglePublish={(m) => togglePublish.mutate(m)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-xl border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Plus className="h-5 w-5 text-purple-400" />
              </div>
              Criar Novo Módulo
            </DialogTitle>
            <DialogDescription>
              Adicione um novo módulo ao curso
            </DialogDescription>
          </DialogHeader>
          
          <ModuleFormContent
            form={moduleForm}
            setForm={setModuleForm}
            courses={courses || []}
            availableSubcategories={availableSubcategories}
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancelar</Button>
            <Button 
              onClick={() => createModule.mutate(moduleForm)}
              disabled={!moduleForm.title || !moduleForm.course_id || createModule.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-card/95 backdrop-blur-xl border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <Pencil className="h-5 w-5 text-cyan-400" />
              </div>
              Editar Módulo
            </DialogTitle>
            <DialogDescription>
              {selectedModule?.course?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[60vh] pr-2">
            {/* Left: Module Form */}
            <div>
              <ModuleFormContent
                form={moduleForm}
                setForm={setModuleForm}
                courses={courses || []}
                availableSubcategories={availableSubcategories}
              />
            </div>
            
            {/* Right: Lessons Panel - FULL PARITY */}
            <div className="border-l border-border/30 pl-6">
              {selectedModule && (
                <ModuleLessonsPanel
                  moduleId={selectedModule.id}
                  moduleName={selectedModule.title}
                />
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancelar</Button>
            <Button 
              onClick={() => selectedModule && updateModule.mutate({ id: selectedModule.id, ...moduleForm })}
              disabled={!moduleForm.title || updateModule.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Módulo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-destructive/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Módulo
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>"{deleteDialog?.title}"</strong>?
              {(deleteDialog?._count?.lessons || 0) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ Este módulo possui {deleteDialog?._count?.lessons} aula(s) que também serão excluídas!
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button 
              variant="destructive"
              onClick={() => deleteDialog && deleteModule.mutate(deleteDialog.id)}
              disabled={deleteModule.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcategory Reorder Modal */}
      <SubcategoryReorderModal
        open={reorderSubcatDialog}
        onOpenChange={setReorderSubcatDialog}
        courses={courses || []}
        allModules={(modules || []).map(m => ({ subcategory: m.subcategory, course_id: m.course_id }))}
      />
    </div>
  );
}

export default ModulosGlobalManager;
