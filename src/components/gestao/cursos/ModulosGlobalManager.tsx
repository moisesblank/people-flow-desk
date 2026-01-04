// ============================================
// 📦 GESTÃO GLOBAL DE MÓDULOS — DESIGN 2300
// Interface futurística para gerenciamento completo
// Hierarquia: Curso → Subcategoria → Módulo → Aulas → Vídeo
// ============================================

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Layers, Search, Edit2, Trash2, Plus, Eye, EyeOff,
  ChevronRight, ChevronDown, PlayCircle, MoreHorizontal,
  FolderOpen, BookOpen, Check, AlertTriangle, Image, Video, 
  Clock, Save, X, RefreshCw, Sparkles, GraduationCap,
  MonitorPlay, FileVideo, Pencil, ChevronUp, ExternalLink, Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
        .select('id, module_id, title, position, is_published, video_url, duration_minutes')
        .eq('module_id', moduleId)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!moduleId
  });
}

// ============================================
// HUD STAT ORB - Visual futurístico
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
      "relative p-4 rounded-2xl border backdrop-blur-xl transition-all duration-500",
      "bg-gradient-to-br hover:scale-[1.02]",
      color
    )}>
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-50 blur-xl -z-10" 
           style={{ background: `linear-gradient(135deg, currentColor, transparent)` }} />
      
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-background/20 backdrop-blur-sm">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{value.toLocaleString()}</p>
          <p className="text-xs opacity-70 uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LEGENDA VISUAL - Ajuda para leigos
// ============================================
function HierarchyLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-purple-500/5 via-cyan-500/5 to-pink-500/5 border border-border/30">
      <span className="text-xs text-muted-foreground mr-2">📚 Hierarquia:</span>
      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
        <GraduationCap className="h-3 w-3 mr-1" />
        Curso
      </Badge>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
        <FolderOpen className="h-3 w-3 mr-1" />
        Subcategoria
      </Badge>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
        <Layers className="h-3 w-3 mr-1" />
        Módulo
      </Badge>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
        <PlayCircle className="h-3 w-3 mr-1" />
        Aulas
      </Badge>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
        <MonitorPlay className="h-3 w-3 mr-1" />
        Vídeo
      </Badge>
    </div>
  );
}

// ============================================
// CURSO SECTION - Card principal por curso
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
  const [isOpen, setIsOpen] = useState(true);
  const totalModules = subcategoryGroups.reduce((acc, g) => acc + g.modules.length, 0);
  const totalLessons = subcategoryGroups.reduce((acc, g) => 
    acc + g.modules.reduce((a, m) => a + (m._count?.lessons || 0), 0), 0);
  const totalSubcats = subcategoryGroups.length;

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl",
      "border-purple-500/20 hover:border-purple-500/40",
      "shadow-lg shadow-purple-500/5"
    )}>
      {/* Header do Curso */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 border-b border-border/30 hover:from-purple-500/15 hover:to-pink-500/15 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Ícone animado */}
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur-xl animate-pulse" />
                  <div className="relative p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <GraduationCap className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
                
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    {course?.title || 'Sem Curso'}
                    {course?.is_published && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        Publicado
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-cyan-400" />
                      <strong className="text-foreground">{totalModules}</strong> módulos
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="flex items-center gap-1">
                      <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
                      <strong className="text-foreground">{totalSubcats}</strong> subcategorias
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="flex items-center gap-1">
                      <PlayCircle className="h-3.5 w-3.5 text-green-400" />
                      <strong className="text-foreground">{totalLessons}</strong> aulas
                    </span>
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-4">
                {subcategoryGroups.map(({ subcategory, modules: groupModules }, groupIdx) => (
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
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================
// SUBCATEGORY SECTION - Agrupador visual
// ============================================
function SubcategorySection({
  subcategory,
  modules,
  expandedModules,
  onToggleModule,
  onEditModule,
  onDeleteModule,
  onTogglePublish
}: {
  subcategory: string | null;
  modules: Module[];
  expandedModules: Set<string>;
  onToggleModule: (id: string) => void;
  onEditModule: (module: Module) => void;
  onDeleteModule: (module: Module) => void;
  onTogglePublish: (module: Module) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const totalLessons = modules.reduce((a, m) => a + (m._count?.lessons || 0), 0);

  return (
    <div className="space-y-2">
      {/* Header Subcategoria */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all">
            <div className="p-1.5 rounded-lg bg-amber-500/20">
              <FolderOpen className="h-4 w-4 text-amber-400" />
            </div>
            <span className="font-semibold text-amber-300 flex-1">
              {subcategory || '📁 Sem Subcategoria'}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 bg-amber-500/10">
                {modules.length} módulo{modules.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline" className="text-xs border-green-500/30 text-green-400 bg-green-500/10">
                {totalLessons} aula{totalLessons !== 1 ? 's' : ''}
              </Badge>
              {isOpen ? <ChevronUp className="h-4 w-4 text-amber-400" /> : <ChevronDown className="h-4 w-4 text-amber-400" />}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="pl-4 mt-2 space-y-2 border-l-2 border-amber-500/20">
            {modules.map((module, idx) => (
              <ModuleCard
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
        </CollapsibleContent>
      </Collapsible>
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

  const handleSave = () => {
    updateMutation.mutate(videoUrl);
  };

  const handleOpenVideo = () => {
    if (lesson.video_url) {
      window.open(lesson.video_url, '_blank', 'noopener,noreferrer');
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
          
          {lesson.video_url ? (
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

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-300",
        "bg-gradient-to-br from-cyan-500/5 to-blue-500/5",
        isExpanded ? "border-cyan-500/40 shadow-lg shadow-cyan-500/10" : "border-cyan-500/20",
        module.is_published ? "opacity-100" : "opacity-60",
        "hover:border-cyan-500/50"
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className="flex items-center gap-3 p-3">
          {/* Expand button */}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-cyan-500/20">
              <ChevronRight className={cn("h-4 w-4 text-cyan-400 transition-transform", isExpanded && "rotate-90")} />
            </Button>
          </CollapsibleTrigger>

          {/* Thumbnail */}
          {module.thumbnail_url ? (
            <div className="relative w-12 h-14 rounded-lg overflow-hidden border border-green-500/30 bg-muted shrink-0">
              <img src={module.thumbnail_url} alt={module.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-0.5 right-0.5 p-0.5 rounded-full bg-green-500">
                <Check className="h-2 w-2 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-12 h-14 rounded-lg border-2 border-dashed border-red-500/40 bg-red-500/10 flex items-center justify-center shrink-0">
              <Image className="h-4 w-4 text-red-400" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                #{module.position + 1}
              </Badge>
              <h4 className="font-medium text-sm truncate">{module.title}</h4>
              {!module.is_published && (
                <Badge variant="secondary" className="text-xs bg-muted/50">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Oculto
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <PlayCircle className="h-3 w-3 text-green-400" />
                <strong className="text-green-400">{module._count?.lessons || 0}</strong> aulas
              </span>
              {module.subcategory && (
                <span className="flex items-center gap-1 text-amber-400">
                  <FolderOpen className="h-3 w-3" />
                  {module.subcategory}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-cyan-500/20 hover:text-cyan-400"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              title="Editar módulo"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
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
          <div className="px-3 pb-3">
            <div className="ml-11 pl-3 border-l-2 border-green-500/20 space-y-1">
              {lessons && lessons.length > 0 ? (
                lessons.map((lesson, idx) => (
                  <LessonRow key={lesson.id} lesson={lesson} />
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-3 text-center italic">
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

      {/* Imagem */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Image className="h-4 w-4 text-green-400" />
          Imagem de Capa
          <Badge variant="outline" className="text-xs">752 × 940 px</Badge>
        </Label>
        <Input
          value={form.thumbnail_url}
          onChange={(e) => setForm(p => ({ ...p, thumbnail_url: e.target.value }))}
          placeholder="/images/modules/meu-modulo.jpg"
          className="bg-background/50"
        />
        {form.thumbnail_url && (
          <div className="relative w-20 h-24 rounded-lg overflow-hidden border border-green-500/30 bg-muted">
            <img src={form.thumbnail_url} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

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

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('modules-global-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
        queryClient.invalidateQueries({ queryKey: ['gestao-module-lessons'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

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

  // Group by course AND subcategory
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
    
    return Array.from(courseMap.values()).map(({ course, subcategories }) => ({
      course,
      subcategoryGroups: Array.from(subcategories.entries()).map(([key, mods]) => ({
        subcategory: key === '__sem_subcategoria__' ? null : key,
        modules: mods
      }))
    }));
  }, [filteredModules]);

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
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-xl border-cyan-500/30">
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
          
          <ModuleFormContent
            form={moduleForm}
            setForm={setModuleForm}
            courses={courses || []}
            availableSubcategories={availableSubcategories}
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancelar</Button>
            <Button 
              onClick={() => selectedModule && updateModule.mutate({ id: selectedModule.id, ...moduleForm })}
              disabled={!moduleForm.title || updateModule.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
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
    </div>
  );
}

export default ModulosGlobalManager;
