// ============================================
// 📚 HIERARQUIA DE CURSOS DO ALUNO — DESIGN 2300
// Visualização organizada: Curso → Subcategoria → Módulo → Aulas
// Mesmo padrão visual da Gestão, mas modo leitura
// ============================================

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Layers, Search, ChevronRight, ChevronDown, PlayCircle,
  FolderOpen, BookOpen, Eye, Video, Clock, Sparkles, GraduationCap,
  MonitorPlay, ChevronUp, Play, Filter, LayoutGrid, List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { OmegaFortressPlayer } from '@/components/video/OmegaFortressPlayer';
import { LessonTabs } from '@/components/player/LessonTabs';

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
  course?: { id: string; title: string; is_published: boolean; };
  _count?: { lessons: number; };
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  position: number;
  is_published: boolean;
  video_url: string | null;
  duration_minutes: number | null;
  panda_video_id: string | null;
  youtube_video_id: string | null;
  video_provider: string | null;
  thumbnail_url: string | null;
}

interface Course {
  id: string;
  title: string;
  is_published: boolean;
}

// ============================================
// HOOKS
// ============================================
function usePublishedModules() {
  return useQuery({
    queryKey: ['aluno-all-modules-hierarchy'],
    queryFn: async () => {
      const { data: modules, error } = await supabase
        .from('modules')
        .select(`*, course:courses(id, title, is_published)`)
        .eq('is_published', true)
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
          .eq('is_published', true)
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

      console.log(`[AlunoCoursesHierarchy] Total aulas carregadas: ${allLessons.length}`);

      const countMap = new Map<string, number>();
      allLessons.forEach(l => {
        countMap.set(l.module_id, (countMap.get(l.module_id) || 0) + 1);
      });

      // Filtrar apenas módulos com cursos publicados
      return ((modules || [])
        .filter(m => m.course?.is_published)
        .map(m => ({
          ...m,
          _count: { lessons: countMap.get(m.id) || 0 }
        })) as Module[]);
    }
  });
}

function usePublishedCourses() {
  return useQuery({
    queryKey: ['aluno-courses-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, is_published')
        .eq('is_published', true)
        .order('title');
      if (error) throw error;
      return data as Course[];
    }
  });
}

function useModuleLessons(moduleId: string | null) {
  return useQuery({
    queryKey: ['aluno-module-lessons', moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      const { data, error } = await supabase
        .from('lessons')
        .select('id, module_id, title, description, position, is_published, video_url, duration_minutes, panda_video_id, youtube_video_id, video_provider, thumbnail_url')
        .eq('module_id', moduleId)
        .eq('is_published', true)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!moduleId
  });
}

// ============================================
// REALTIME HOOK
// ============================================
function useLMSRealtime() {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce 5s para conteúdo de gestão (evita Thundering Herd com 5.000 alunos)
  const debouncedInvalidate = useCallback((queryKeys: string[][]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      queryKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
    }, 5000);
  }, [queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel('lms-aluno-hierarchy-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        debouncedInvalidate([['aluno-all-modules-hierarchy'], ['aluno-courses-dropdown']]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, () => {
        debouncedInvalidate([['aluno-all-modules-hierarchy']]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => {
        debouncedInvalidate([['aluno-all-modules-hierarchy'], ['aluno-module-lessons']]);
      })
      .subscribe();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [debouncedInvalidate]);
}

// ============================================
// 🎯 HUD STAT ORB — YEAR 2300 CINEMATIC DESIGN
// Orbes flutuantes com glow holográfico intenso
// ============================================
function HudStatOrb({ 
  icon, 
  value, 
  label, 
  color,
  glowColor
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string; 
  color: string;
  glowColor?: string;
}) {
  return (
    <div className={cn(
      "group relative p-5 md:p-6 rounded-2xl border-2 backdrop-blur-xl transition-all duration-500",
      "bg-gradient-to-br hover:scale-[1.03] hover:shadow-2xl",
      "cursor-default select-none",
      color
    )}>
      {/* Outer glow ring */}
      <div className={cn(
        "absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500 -z-10",
        glowColor || "bg-primary"
      )} />
      
      {/* Animated corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-current opacity-50 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-current opacity-50 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-current opacity-50 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-current opacity-50 rounded-br-xl" />
      
      <div className="flex items-center gap-4">
        {/* Icon container with pulse */}
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-current opacity-20 blur-md animate-pulse" />
          <div className="relative p-3 rounded-xl bg-background/30 backdrop-blur-sm border border-current/30 shadow-inner">
            {icon}
          </div>
        </div>
        
        {/* Value and label */}
        <div>
          <p className="text-3xl md:text-4xl font-black tracking-tight tabular-nums">
            {value.toLocaleString()}
          </p>
          <p className="text-xs md:text-sm font-semibold uppercase tracking-widest opacity-80">{label}</p>
        </div>
      </div>
      
      {/* Subtle scan line effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-[scan_3s_ease-in-out_infinite]" />
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
    <div className="relative p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-green-500/10 border-2 border-border/40 backdrop-blur-xl overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-0 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
      
      <div className="flex flex-wrap items-center gap-3 justify-center">
        <span className="text-sm font-bold text-foreground/80 mr-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
          NAVEGAÇÃO:
        </span>
        
        {/* Curso */}
        <Badge className="px-4 py-2 text-sm bg-purple-500/30 text-purple-200 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform">
          <GraduationCap className="h-4 w-4 mr-2" />
          Curso
        </Badge>
        
        <ChevronRight className="h-5 w-5 text-purple-400" />
        
        {/* Subcategoria */}
        <Badge className="px-4 py-2 text-sm bg-amber-500/30 text-amber-200 border-2 border-amber-500/50 shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform">
          <FolderOpen className="h-4 w-4 mr-2" />
          Subcategoria
        </Badge>
        
        <ChevronRight className="h-5 w-5 text-amber-400" />
        
        {/* Módulo */}
        <Badge className="px-4 py-2 text-sm bg-cyan-500/30 text-cyan-200 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform">
          <Layers className="h-4 w-4 mr-2" />
          Módulo
        </Badge>
        
        <ChevronRight className="h-5 w-5 text-cyan-400" />
        
        {/* Aulas */}
        <Badge className="px-4 py-2 text-sm bg-green-500/30 text-green-200 border-2 border-green-500/50 shadow-lg shadow-green-500/20 hover:scale-105 transition-transform">
          <PlayCircle className="h-4 w-4 mr-2" />
          Aulas
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
  onPlayLesson
}: {
  course: Course | null;
  subcategoryGroups: { subcategory: string | null; modules: Module[] }[];
  expandedModules: Set<string>;
  onToggleModule: (id: string) => void;
  onPlayLesson: (lesson: Lesson) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const totalModules = subcategoryGroups.reduce((acc, g) => acc + g.modules.length, 0);
  const totalLessons = subcategoryGroups.reduce((acc, g) => 
    acc + g.modules.reduce((a, m) => a + (m._count?.lessons || 0), 0), 0);
  const totalSubcats = subcategoryGroups.length;

  return (
    <Card className={cn(
      "group/card relative overflow-hidden transition-all duration-500 animate-fade-in",
      "bg-gradient-to-br from-card via-card/95 to-purple-950/20 backdrop-blur-2xl",
      "border-2 border-purple-500/30 hover:border-purple-400/60",
      "shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20",
      "rounded-3xl"
    )}>
      {/* Holographic corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20 border-l-4 border-t-4 border-purple-500/40 rounded-tl-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-20 h-20 border-r-4 border-t-4 border-pink-500/40 rounded-tr-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-20 h-20 border-l-4 border-b-4 border-purple-500/40 rounded-bl-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-20 h-20 border-r-4 border-b-4 border-pink-500/40 rounded-br-3xl pointer-events-none" />
      
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-transparent to-pink-500/0 group-hover/card:from-purple-500/5 group-hover/card:to-pink-500/5 transition-all duration-500 pointer-events-none" />
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer relative z-10 py-6 px-6 bg-gradient-to-r from-purple-500/15 via-purple-500/5 to-pink-500/15 border-b-2 border-purple-500/20 hover:from-purple-500/25 hover:to-pink-500/25 transition-all duration-300">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                {/* Animated icon orb */}
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500/30 rounded-2xl blur-2xl animate-pulse" />
                  <div className="relative p-4 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-500/50 shadow-xl shadow-purple-500/20">
                    <GraduationCap className="h-8 w-8 text-purple-300" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-2xl md:text-3xl font-black flex items-center gap-3 flex-wrap">
                    {course?.title || 'Sem Curso'}
                    <Badge className="px-3 py-1 text-sm bg-green-500/30 text-green-300 border-2 border-green-500/50 shadow-lg shadow-green-500/20">
                      <Eye className="h-4 w-4 mr-1" />
                      ATIVO
                    </Badge>
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
                className="h-12 w-12 rounded-xl border-2 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/30 hover:border-purple-400/50 transition-all"
              >
                {isOpen ? <ChevronUp className="h-6 w-6 text-purple-300" /> : <ChevronDown className="h-6 w-6 text-purple-300" />}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-0">
            <ScrollArea className="h-auto max-h-[700px]">
              <div className="p-5 space-y-5">
                {subcategoryGroups.map(({ subcategory, modules: groupModules }) => (
                  <SubcategorySection
                    key={subcategory || 'default'}
                    subcategory={subcategory}
                    modules={groupModules}
                    expandedModules={expandedModules}
                    onToggleModule={onToggleModule}
                    onPlayLesson={onPlayLesson}
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
// 📂 SUBCATEGORY SECTION — YEAR 2300 CINEMATIC
// Agrupador visual com design holográfico
// ============================================
function SubcategorySection({
  subcategory,
  modules,
  expandedModules,
  onToggleModule,
  onPlayLesson
}: {
  subcategory: string | null;
  modules: Module[];
  expandedModules: Set<string>;
  onToggleModule: (id: string) => void;
  onPlayLesson: (lesson: Lesson) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const totalLessons = modules.reduce((a, m) => a + (m._count?.lessons || 0), 0);

  return (
    <div className="space-y-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="group flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/30 hover:border-amber-400/60 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300">
            {/* Icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-2.5 rounded-xl bg-amber-500/30 border border-amber-500/40">
                <FolderOpen className="h-5 w-5 text-amber-300" />
              </div>
            </div>
            
            <span className="font-bold text-lg text-amber-200 flex-1">
              {subcategory || '📁 Geral'}
            </span>
            
            <div className="flex items-center gap-3">
              <Badge className="px-3 py-1.5 text-sm bg-amber-500/25 text-amber-200 border-2 border-amber-500/40 shadow-md">
                <Layers className="h-4 w-4 mr-1" />
                {modules.length}
              </Badge>
              <Badge className="px-3 py-1.5 text-sm bg-green-500/25 text-green-200 border-2 border-green-500/40 shadow-md">
                <PlayCircle className="h-4 w-4 mr-1" />
                {totalLessons}
              </Badge>
              <div className="p-1 rounded-lg bg-amber-500/20">
                {isOpen ? <ChevronUp className="h-5 w-5 text-amber-300" /> : <ChevronDown className="h-5 w-5 text-amber-300" />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="pl-6 mt-3 space-y-3 border-l-4 border-amber-500/30 ml-4">
            {modules.map((module, idx) => (
              <ModuleCard
                key={module.id}
                module={module}
                index={idx}
                isExpanded={expandedModules.has(module.id)}
                onToggle={() => onToggleModule(module.id)}
                onPlayLesson={onPlayLesson}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================
// MODULE CARD
// ============================================
function ModuleCard({ 
  module, 
  index, 
  isExpanded, 
  onToggle,
  onPlayLesson
}: {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onPlayLesson: (lesson: Lesson) => void;
}) {
  const { data: lessons, isLoading } = useModuleLessons(isExpanded ? module.id : null);

  return (
    <div className={cn(
      "rounded-xl border transition-all duration-300",
      "bg-gradient-to-br from-cyan-500/5 to-blue-500/5",
      isExpanded ? "border-cyan-500/40 shadow-lg shadow-cyan-500/10" : "border-cyan-500/20",
      "hover:border-cyan-500/50"
    )}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className="flex items-center gap-3 p-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-cyan-500/20">
              <ChevronRight className={cn("h-4 w-4 text-cyan-400 transition-transform", isExpanded && "rotate-90")} />
            </Button>
          </CollapsibleTrigger>

          {/* Thumbnail */}
          {module.thumbnail_url ? (
            <div className="relative w-12 h-14 rounded-lg overflow-hidden border border-cyan-500/30 bg-muted shrink-0">
              <img src={module.thumbnail_url} alt={module.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-14 rounded-lg border-2 border-dashed border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4 text-cyan-400" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                #{module.position + 1}
              </Badge>
              <h4 className="font-medium text-sm truncate">{module.title}</h4>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <PlayCircle className="h-3 w-3 text-green-400" />
                <strong className="text-green-400">{module._count?.lessons || 0}</strong> aulas
              </span>
            </div>
          </div>

          {/* Quick Play */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="hover:bg-green-500/20 hover:text-green-400"
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isExpanded) onToggle();
            }}
          >
            <Play className="h-4 w-4 mr-1" />
            Ver Aulas
          </Button>
        </div>

        <CollapsibleContent>
          <div className="px-3 pb-3">
            <div className="mt-2 pl-4 border-l-2 border-green-500/30 space-y-1">
              {isLoading ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  <div className="inline-block animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                  Carregando aulas...
                </div>
              ) : lessons && lessons.length > 0 ? (
                lessons.map((lesson, idx) => (
                  <LessonItem 
                    key={lesson.id} 
                    lesson={lesson} 
                    index={idx}
                    onPlay={() => onPlayLesson(lesson)}
                  />
                ))
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma aula disponível
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
// LESSON ITEM
// ============================================
function LessonItem({ 
  lesson, 
  index,
  onPlay
}: { 
  lesson: Lesson; 
  index: number;
  onPlay: () => void;
}) {
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '--';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}min`;
    return `${mins}min`;
  };

  return (
    <div 
      className={cn(
        "group flex items-center gap-3 p-2.5 rounded-lg cursor-pointer",
        "bg-card/40 hover:bg-green-500/10",
        "border border-transparent hover:border-green-500/30",
        "transition-all duration-200"
      )}
      onClick={onPlay}
    >
      {/* Play button */}
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
        "bg-green-500/10 group-hover:bg-green-500/20",
        "border border-green-500/20 group-hover:border-green-500/40",
        "transition-all"
      )}>
        <Play className="h-3.5 w-3.5 text-green-400 fill-green-400/50" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-green-400/60">#{String(index + 1).padStart(2, '0')}</span>
          <p className="text-sm font-medium truncate group-hover:text-green-400 transition-colors">
            {lesson.title}
          </p>
        </div>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3 w-3 text-green-400/60" />
        <span className="font-mono">{formatDuration(lesson.duration_minutes)}</span>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
function AlunoCoursesHierarchy() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const [busca, setBusca] = useState('');
  const [filtroNivel, setFiltroNivel] = useState<'cursos' | 'subcategorias' | 'modulos'>('cursos');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Realtime sync
  useLMSRealtime();

  const { data: modules, isLoading: loadingModules } = usePublishedModules();
  const { data: courses } = usePublishedCourses();

  // Agrupar por Curso → Subcategoria → Módulos
  const groupedData = useMemo(() => {
    if (!modules) return [];

    const filtered = modules.filter(m => {
      const term = busca.toLowerCase();
      return m.title.toLowerCase().includes(term) || 
             m.course?.title.toLowerCase().includes(term) ||
             m.subcategory?.toLowerCase().includes(term) ||
             m.description?.toLowerCase().includes(term);
    });

    const courseMap = new Map<string, { course: Course | null; subcategoryGroups: Map<string | null, Module[]> }>();

    filtered.forEach(module => {
      const courseId = module.course_id;
      const courseData = module.course || null;
      
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, { course: courseData, subcategoryGroups: new Map() });
      }

      const courseEntry = courseMap.get(courseId)!;
      const subcat = module.subcategory;

      if (!courseEntry.subcategoryGroups.has(subcat)) {
        courseEntry.subcategoryGroups.set(subcat, []);
      }
      courseEntry.subcategoryGroups.get(subcat)!.push(module);
    });

    return Array.from(courseMap.entries()).map(([courseId, data]) => ({
      courseId,
      course: data.course,
      subcategoryGroups: Array.from(data.subcategoryGroups.entries())
        .map(([subcat, mods]) => ({ subcategory: subcat, modules: mods }))
        .sort((a, b) => (a.subcategory || 'ZZZ').localeCompare(b.subcategory || 'ZZZ'))
    }));
  }, [modules, busca]);

  // Stats
  const stats = useMemo(() => {
    if (!modules) return { courses: 0, subcategories: 0, modules: 0, lessons: 0 };
    
    const uniqueCourses = new Set(modules.map(m => m.course_id)).size;
    const uniqueSubcats = new Set(modules.map(m => m.subcategory || 'default')).size;
    const totalLessons = modules.reduce((a, m) => a + (m._count?.lessons || 0), 0);

    return {
      courses: uniqueCourses,
      subcategories: uniqueSubcats,
      modules: modules.length,
      lessons: totalLessons
    };
  }, [modules]);

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Video player helpers
  const getVideoType = (lesson: Lesson): "youtube" | "panda" => {
    if (lesson.video_provider === 'panda') return "panda";
    if (lesson.video_provider === 'youtube') return "youtube";
    if (lesson.panda_video_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lesson.panda_video_id)) {
      return "panda";
    }
    return "youtube";
  };

  const getVideoId = (lesson: Lesson): string => {
    const type = getVideoType(lesson);
    if (type === "panda") return lesson.panda_video_id || "";
    return lesson.youtube_video_id || lesson.panda_video_id || "";
  };

  const handlePlayLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
  };

  const closePlayer = () => {
    setSelectedLesson(null);
  };

  return (
    <div className="space-y-6">
      {/* Video Player Modal - SCROLLABLE CONTENT RULE */}
      <Dialog open={!!selectedLesson} onOpenChange={(open) => !open && closePlayer()}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] flex flex-col p-0 gap-0 overflow-hidden bg-card/95 backdrop-blur-xl border-2 border-purple-500/30">
          {selectedLesson && (
            <>
              {/* Fixed Header */}
              <DialogHeader className="shrink-0 px-6 py-4 border-b-2 border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-card to-cyan-500/10">
                <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20">
                    <Video className="h-6 w-6 text-purple-300" />
                  </div>
                  <span className="line-clamp-1">{selectedLesson.title}</span>
                </DialogTitle>
              </DialogHeader>
              
              {/* Scrollable Body */}
              <DialogBody className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6">
                {/* Video Player */}
                <div className="aspect-video rounded-2xl overflow-hidden bg-black border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
                  <OmegaFortressPlayer
                    videoId={getVideoId(selectedLesson)}
                    type={getVideoType(selectedLesson)}
                    title={selectedLesson.title}
                    thumbnail={selectedLesson.thumbnail_url || undefined}
                    lessonId={selectedLesson.id}
                    showSecurityBadge
                    showWatermark
                    autoplay
                  />
                </div>

                {/* Lesson Tabs */}
                <div className="rounded-2xl border-2 border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden">
                  <LessonTabs 
                    lessonId={selectedLesson.id}
                    lessonTitle={selectedLesson.title}
                  />
                </div>

                {/* Description */}
                {selectedLesson.description && (
                  <Card className="bg-gradient-to-br from-card via-card to-purple-950/10 border-2 border-border/30 rounded-2xl">
                    <CardHeader className="pb-2 border-b border-border/20">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-purple-400" />
                        Sobre esta aula
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-base text-muted-foreground leading-relaxed">
                        {selectedLesson.description}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </DialogBody>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HudStatOrb
          icon={<GraduationCap className="h-5 w-5 text-purple-400" />}
          value={stats.courses}
          label="Cursos"
          color="from-purple-500/10 to-purple-500/5 border-purple-500/30 text-purple-400"
        />
        <HudStatOrb
          icon={<FolderOpen className="h-5 w-5 text-amber-400" />}
          value={stats.subcategories}
          label="Subcategorias"
          color="from-amber-500/10 to-amber-500/5 border-amber-500/30 text-amber-400"
        />
        <HudStatOrb
          icon={<Layers className="h-5 w-5 text-cyan-400" />}
          value={stats.modules}
          label="Módulos"
          color="from-cyan-500/10 to-cyan-500/5 border-cyan-500/30 text-cyan-400"
        />
        <HudStatOrb
          icon={<PlayCircle className="h-5 w-5 text-green-400" />}
          value={stats.lessons}
          label="Aulas"
          color="from-green-500/10 to-green-500/5 border-green-500/30 text-green-400"
        />
      </div>

      {/* Legend */}
      <HierarchyLegend />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar curso, subcategoria, módulo ou aula..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 bg-card/50 border-border/50"
          />
        </div>
      </div>

      {/* Content */}
      {loadingModules ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="bg-muted/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted/30" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-muted/30 rounded w-1/3" />
                    <div className="h-4 bg-muted/20 rounded w-1/2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-12 bg-muted/20 rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groupedData.length === 0 ? (
        <Card className="p-12 text-center bg-card/50 backdrop-blur-xl border-border/30">
          <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">Nenhum curso encontrado</h3>
          <p className="text-muted-foreground mt-2">
            {busca ? 'Nenhum resultado para sua busca.' : 'Os cursos aparecerão aqui quando forem publicados.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedData.map(({ courseId, course, subcategoryGroups }) => (
            <CourseSection
              key={courseId}
              course={course}
              subcategoryGroups={subcategoryGroups}
              expandedModules={expandedModules}
              onToggleModule={toggleModule}
              onPlayLesson={handlePlayLesson}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AlunoCoursesHierarchy;
