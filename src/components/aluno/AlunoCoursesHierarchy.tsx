// ============================================
// 📚 HIERARQUIA DE CURSOS DO ALUNO — DESIGN 2300
// Visualização organizada: Curso → Subcategoria → Módulo → Aulas
// Mesmo padrão visual da Gestão, mas modo leitura
// ============================================

import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Layers, Search, ChevronRight, PlayCircle,
  FolderOpen, BookOpen, Eye, Video, Clock, Sparkles, GraduationCap,
  ChevronUp, ChevronDown, Play, ChevronLeft, Info
} from 'lucide-react';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Chronolock } from '@/components/ui/chronolock';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { OmegaFortressPlayer } from '@/components/video/OmegaFortressPlayer';
import { LessonTabs } from '@/components/player/LessonTabs';
import { useModulesProgress, type ModuleProgressData } from '@/hooks/useModuleProgress';

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
  // 🔒 COLLAPSIBLE: Inicia fechado - usuário deve clicar para expandir
  const [isOpen, setIsOpen] = useState(false);
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
            {/* SCROLLABLE CONTENT RULE: Conteúdo acessível sem limite de altura */}
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
  // 🔒 COLLAPSIBLE: Inicia fechado - usuário deve clicar para expandir módulos
  const [isOpen, setIsOpen] = useState(false);
  const totalLessons = modules.reduce((a, m) => a + (m._count?.lessons || 0), 0);
  
  // 📊 PROGRESS: Buscar progresso de todos os módulos desta subcategoria (UMA única query)
  const moduleIds = useMemo(() => modules.map(m => m.id), [modules]);
  const { progressMap } = useModulesProgress(isOpen ? moduleIds : []);

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
          {/* 🎬 NETFLIX HORIZONTAL CAROUSEL — Scroll suave estilo streaming */}
          <div className="mt-4 relative group/carousel">
            {/* Header do carousel com contagem */}
            <div className="flex items-center justify-between gap-3 mb-4 px-2">
              <div className="flex items-center gap-3">
                <Layers className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-muted-foreground">
                  <strong className="text-cyan-400">{modules.length}</strong> módulos
                </span>
              </div>
              
              {/* 🎮 Navigation hint */}
              <span className="text-xs text-muted-foreground flex items-center gap-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                <ChevronLeft className="h-3 w-3" />
                <span>Arraste para navegar</span>
                <ChevronRight className="h-3 w-3" />
              </span>
            </div>
            
            {/* 🎬 NETFLIX CAROUSEL ROW */}
            <NetflixCarouselRow
              modules={modules}
              expandedModules={expandedModules}
              onToggleModule={onToggleModule}
              onPlayLesson={onPlayLesson}
              progressMap={progressMap}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================
// 🎬 NETFLIX ULTRA PREMIUM — Full-Width Section Layout
// Cada módulo ocupa uma seção horizontal completa
// Design cinematográfico estilo streaming premium
// ============================================
const NetflixCarouselRow = memo(function NetflixCarouselRow({
  modules,
  expandedModules,
  onToggleModule,
  onPlayLesson,
  progressMap
}: {
  modules: Module[];
  expandedModules: Set<string>;
  onToggleModule: (id: string) => void;
  onPlayLesson: (lesson: Lesson) => void;
  progressMap: Map<string, ModuleProgressData>;
}) {
  return (
    <div className="space-y-2">
      {modules.map((module, idx) => (
        <NetflixModuleSection
          key={module.id}
          module={module}
          index={idx}
          isExpanded={expandedModules.has(module.id)}
          onToggle={() => onToggleModule(module.id)}
          onPlayLesson={onPlayLesson}
          progress={progressMap.get(module.id)}
        />
      ))}
    </div>
  );
});
NetflixCarouselRow.displayName = 'NetflixCarouselRow';

// ============================================
// 🎬 NETFLIX MODULE SECTION — Full-Width Premium
// Módulo com thumbnail grande + carrossel de aulas
// ============================================
const NetflixModuleSection = memo(function NetflixModuleSection({ 
  module, 
  index, 
  isExpanded, 
  onToggle,
  onPlayLesson,
  progress
}: {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onPlayLesson: (lesson: Lesson) => void;
  progress?: ModuleProgressData;
}) {
  const { data: lessons, isLoading } = useModuleLessons(isExpanded ? module.id : null);
  const { shouldAnimate, isLowEnd } = useConstitutionPerformance();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const updateScrollButtons = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const ref = scrollRef.current;
    if (!ref) return;
    ref.addEventListener('scroll', updateScrollButtons, { passive: true });
    const timer = setTimeout(updateScrollButtons, 100);
    return () => {
      ref.removeEventListener('scroll', updateScrollButtons);
      clearTimeout(timer);
    };
  }, [updateScrollButtons, lessons]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -400 : 400,
      behavior: shouldAnimate ? 'smooth' : 'auto'
    });
  }, [shouldAnimate]);

  const isChronolocked = module.title?.toLowerCase().includes('resolução provas enem 2025');
  const lessonCount = module._count?.lessons || 0;
  const progressPercent = progress?.progressPercent || 0;

  const sectionContent = (
    <div 
      className="group/section relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* === MODULE SECTION — NETFLIX ULTRA CINEMATIC === */}
      <div 
        onClick={onToggle}
        className={cn(
          "group/module relative flex flex-row items-center w-full cursor-pointer overflow-hidden",
          "min-h-[280px] md:min-h-[340px] lg:min-h-[380px]",
          "bg-gradient-to-r from-black via-[#0c1929] to-black",
          "rounded-xl border transition-all duration-500",
          isExpanded 
            ? "border-cyan-400/60 shadow-2xl shadow-cyan-500/20"
            : "border-slate-800/60 hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10"
        )}
      >
        {/* === CINEMATIC BACKGROUND EFFECTS === */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Animated gradient sweep */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent",
            "translate-x-[-100%] group-hover/module:translate-x-[100%] transition-transform duration-1000"
          )} />
          {/* Top light reflection */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          {/* Ambient glow */}
          <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full",
            "bg-gradient-radial from-cyan-500/10 via-transparent to-transparent blur-3xl",
            "opacity-0 group-hover/module:opacity-100 transition-opacity duration-700"
          )} />
        </div>
        
        {/* === LEFT SIDE — MODULE INFO (Premium Typography) === */}
        <div className="flex-1 flex flex-col justify-center items-end text-right py-6 md:py-8 pr-8 md:pr-12 lg:pr-16 min-w-0 z-10">
          
          {/* Module Number Badge - Cinematic */}
          <div className="mb-4 md:mb-5">
            <div className={cn(
              "relative inline-flex items-center gap-2 px-5 py-2 rounded-lg overflow-hidden",
              "bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-600",
              "shadow-2xl shadow-cyan-500/50"
            )}>
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-white/30" />
              <span className="relative text-sm md:text-base font-black uppercase tracking-[0.2em] text-white drop-shadow-lg">
                Módulo {String(module.position + 1).padStart(2, '0')}
              </span>
            </div>
          </div>
          
          {/* Title - Massive Cinematic */}
          <h3 className={cn(
            "font-black text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white leading-[1.1] uppercase",
            "tracking-wide line-clamp-2 transition-all duration-300",
            "drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]",
            isHovered && "text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-200"
          )}>
            {module.title}
          </h3>
          
          {/* Description - Elegant */}
          {module.description && (
            <p className={cn(
              "mt-3 md:mt-4 text-base md:text-lg text-slate-300/90 font-medium line-clamp-2 max-w-[500px]",
              "leading-relaxed tracking-wide"
            )}>
              {module.description}
            </p>
          )}
        </div>
        
        {/* === CENTER — MODULE THUMBNAIL (Hero Poster) === */}
        <div className={cn(
          "relative shrink-0 rounded-xl overflow-hidden z-10",
          "w-44 h-60 md:w-56 md:h-76 lg:w-64 lg:h-88 xl:w-72 xl:h-96",
          "bg-gradient-to-br from-purple-900/50 to-slate-900",
          "border-2 border-white/10",
          "shadow-[0_20px_60px_-10px_rgba(0,0,0,0.9),0_0_40px_-10px_rgba(139,92,246,0.3)]",
          !isLowEnd && "transition-all duration-500 ease-out",
          !isLowEnd && isHovered && "scale-[1.03] shadow-[0_25px_80px_-10px_rgba(0,0,0,0.95),0_0_60px_-10px_rgba(139,92,246,0.5)]"
        )}>
          {module.thumbnail_url ? (
            <img
              src={module.thumbnail_url}
              alt={module.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-red-600">
              <Layers className="h-14 w-14 text-white/80" />
            </div>
          )}
          
          {/* Poster overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
          
          {/* Progress Bar - Cinematic */}
          {progressPercent > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/90">
              <div 
                className={cn(
                  "h-full rounded-r transition-all duration-500",
                  progressPercent >= 100 
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/50" 
                    : "bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-500/50"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
        
        {/* === RIGHT SIDE — EPISODES + ACTIONS (Command Center) === */}
        <div className="flex-1 flex flex-col justify-center items-start text-left py-6 md:py-8 pl-8 md:pl-12 lg:pl-16 min-w-0 z-10">
          
          {/* Episodes Counter - Premium Badge */}
          <div className="flex items-center gap-3 mb-5 md:mb-6">
            <div className={cn(
              "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900",
              "border border-slate-600/50 shadow-xl shadow-black/50"
            )}>
              <Play className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tight drop-shadow-lg">
                {lessonCount}
              </span>
              <span className="text-sm md:text-base text-slate-400 font-semibold uppercase tracking-widest -mt-1">
                Episódios
              </span>
            </div>
          </div>
          
          {/* Progress Status - Premium Indicator */}
          {progressPercent > 0 && (
            <div className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-base md:text-lg font-bold mb-5 md:mb-6",
              "backdrop-blur-sm transition-all duration-300",
              progressPercent >= 100
                ? "bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400/50 shadow-xl shadow-emerald-500/30"
                : "bg-slate-800/80 text-slate-200 border border-slate-600/50"
            )}>
              {progressPercent >= 100 ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="uppercase tracking-wider">Concluído</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <span>{progressPercent}% completo</span>
                </>
              )}
            </div>
          )}

          {/* Action Buttons - Cinematic Command Panel */}
          <div className="flex items-center gap-4 flex-wrap">
            
            {/* Toggle Episodes - Ghost Premium */}
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={cn(
                "h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-bold rounded-xl",
                "bg-slate-900/90 border-2 backdrop-blur-sm",
                "transition-all duration-300 uppercase tracking-wider",
                isExpanded
                  ? "text-cyan-300 border-cyan-400/60 shadow-xl shadow-cyan-500/30 hover:bg-cyan-500/20"
                  : "text-slate-200 border-slate-600/60 hover:text-cyan-300 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20"
              )}
            >
              <ChevronDown className={cn(
                "w-5 h-5 mr-2 transition-transform duration-500",
                isExpanded && "rotate-180"
              )} />
              {isExpanded ? 'Ocultar' : 'Ver Episódios'}
            </Button>
            
            {/* Watch Now - Netflix RED Cinematic */}
            {lessonCount > 0 && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  // Play first lesson logic
                }}
                className={cn(
                  "relative h-12 md:h-14 px-7 md:px-10 text-base md:text-lg font-black uppercase tracking-widest rounded-xl",
                  "bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white border-0",
                  "hover:from-red-600 hover:via-red-500 hover:to-red-600",
                  "shadow-2xl shadow-red-600/50 hover:shadow-red-500/70",
                  "transition-all duration-300 overflow-hidden group/btn"
                )}
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                <Play className="w-5 h-5 md:w-6 md:h-6 mr-2 relative" fill="currentColor" />
                <span className="relative">Assistir</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* === LESSONS CAROUSEL === */}
      {isExpanded && (
        <div className={cn(
          "relative mt-2 rounded-xl overflow-hidden",
          "bg-gradient-to-b from-[#161b22]/80 to-transparent",
          "border border-gray-800/50",
          shouldAnimate && "animate-fade-in"
        )}>
          {/* Carousel Container */}
          <div className="relative py-4">
            {/* Gradient Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#161b22] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#161b22] to-transparent z-10 pointer-events-none" />
            
            {/* Navigation Buttons */}
            {canScrollLeft && (
              <button
                onClick={(e) => { e.stopPropagation(); scroll('left'); }}
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 z-20",
                  "w-10 h-10 flex items-center justify-center",
                  "rounded-full bg-black/90 border border-white/20",
                  "hover:bg-white hover:text-black transition-all duration-200",
                  "opacity-0 group-hover/section:opacity-100"
                )}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            
            {canScrollRight && (
              <button
                onClick={(e) => { e.stopPropagation(); scroll('right'); }}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 z-20",
                  "w-10 h-10 flex items-center justify-center",
                  "rounded-full bg-black/90 border border-white/20",
                  "hover:bg-white hover:text-black transition-all duration-200",
                  "opacity-0 group-hover/section:opacity-100"
                )}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
            
            {/* Lessons */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-gray-400">
                  <div className="h-6 w-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Carregando episódios...</span>
                </div>
              </div>
            ) : lessons && lessons.length > 0 ? (
              <div
                ref={scrollRef}
                className={cn(
                  "flex gap-3 px-4 overflow-x-auto",
                  "scrollbar-none [&::-webkit-scrollbar]:hidden"
                )}
                style={{ scrollbarWidth: 'none' }}
              >
                {lessons.map((lesson, idx) => (
                  <NetflixEpisodeCard 
                    key={lesson.id} 
                    lesson={lesson} 
                    index={idx}
                    onPlay={() => onPlayLesson(lesson)}
                    isLowEnd={isLowEnd}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Video className="h-10 w-10 mb-3 opacity-30" />
                <span className="text-sm font-medium">Nenhum episódio disponível</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (isChronolocked) {
    return (
      <Chronolock message="EM BREVE" subtitle="31/01" variant="warning">
        {sectionContent}
      </Chronolock>
    );
  }

  return sectionContent;
});
NetflixModuleSection.displayName = 'NetflixModuleSection';

// ============================================
// 🎬 PREMIUM EPISODE CARD — Year 2300 Cinematic Design
// Card vertical premium com número grande, play destacado e bordas neon
// Inspirado no design de referência premium
// ============================================
const NetflixEpisodeCard = memo(function NetflixEpisodeCard({ 
  lesson, 
  index,
  onPlay,
  isLowEnd
}: { 
  lesson: Lesson; 
  index: number;
  onPlay: () => void;
  isLowEnd: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const hasVideo = lesson.panda_video_id || lesson.video_url || lesson.youtube_video_id;

  return (
    <div
      onClick={onPlay}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex-shrink-0 cursor-pointer group/card",
        "w-[120px] sm:w-[136px] md:w-[152px]",
        "rounded-xl overflow-hidden",
        "transition-all duration-300",
        !isLowEnd && isHovered && "scale-[1.05] z-20"
      )}
    >
      {/* === OUTER GLOW BORDER === */}
      <div className={cn(
        "absolute -inset-[2px] rounded-xl transition-all duration-300",
        isHovered 
          ? "bg-gradient-to-br from-green-500 via-cyan-500 to-green-500 opacity-100"
          : "bg-gradient-to-br from-green-500/50 via-cyan-500/30 to-green-500/50 opacity-60"
      )} />
      
      {/* === INNER CARD CONTAINER === */}
      <div className={cn(
        "relative rounded-xl overflow-hidden m-[2px]",
        "bg-gradient-to-br from-[#0a1a1a] via-[#0d1f1f] to-[#0a1a1a]",
        "border border-green-500/30"
      )}>
        
        {/* === HEADER SECTION — Number + Menu === */}
        <div className="relative flex items-center justify-between px-3 py-2 border-b border-green-500/20 bg-gradient-to-r from-green-900/20 to-transparent">
          {/* Episode Number — Big & Bold */}
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs text-green-400 font-bold">#</span>
            <span className={cn(
              "text-xl font-black tabular-nums",
              "text-transparent bg-clip-text bg-gradient-to-b from-green-400 to-green-600"
            )}>
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center gap-2">
            {lesson.duration_minutes && (
              <span className="text-[10px] font-bold text-green-400/70">
                {lesson.duration_minutes}min
              </span>
            )}
            {/* Options Menu Dot */}
            <div className="flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-green-500/60" />
              <div className="w-1 h-1 rounded-full bg-green-500/60" />
              <div className="w-1 h-1 rounded-full bg-green-500/60" />
            </div>
          </div>
        </div>
        
        {/* === CENTER SECTION — Icon + Play === */}
        <div className="relative flex items-center justify-center py-4 px-3">
          {/* Background Glow Effect */}
          <div className={cn(
            "absolute inset-0 transition-all duration-500",
            isHovered 
              ? "bg-gradient-to-br from-green-500/20 via-transparent to-cyan-500/20"
              : "bg-transparent"
          )} />
          
          {/* Main Icon Container */}
          <div className={cn(
            "relative w-12 h-12 rounded-lg flex items-center justify-center",
            "transition-all duration-300",
            isHovered 
              ? "bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.6)]"
              : "bg-gradient-to-br from-green-900/60 to-green-800/40 border border-green-500/40"
          )}>
            {/* Animated rings on hover */}
            {!isLowEnd && isHovered && (
              <>
                <div className="absolute inset-0 rounded-xl border-2 border-green-400/50 animate-ping" style={{ animationDuration: '1.5s' }} />
                <div className="absolute -inset-2 rounded-xl border border-green-400/30 animate-pulse" />
              </>
            )}
            
            {hasVideo ? (
              <Play className={cn(
                "h-5 w-5 ml-0.5 transition-all duration-300",
                isHovered ? "text-black scale-110" : "text-green-400"
              )} fill={isHovered ? "currentColor" : "none"} />
            ) : (
              <Video className={cn(
                "h-5 w-5 transition-colors duration-300",
                isHovered ? "text-black" : "text-green-500/60"
              )} />
            )}
          </div>
        </div>
        
        {/* === BOTTOM SECTION — Title + Action === */}
        <div className="relative px-3 pb-3 space-y-2">
          {/* Title */}
          <h4 className={cn(
            "font-bold text-sm leading-tight text-center transition-colors duration-200",
            "line-clamp-2 min-h-[2.5rem]",
            isHovered ? "text-green-400" : "text-white"
          )}>
            {lesson.title}
          </h4>
          
          {/* Tags Row */}
          <div className="flex items-center justify-center gap-2 text-[10px]">
            <span className={cn(
              "px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1",
              "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
            )}>
              <Video className="h-2.5 w-2.5" />
              Videoaula
            </span>
          </div>
          
          {/* Action Button */}
          <button
            className={cn(
              "w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider",
              "flex items-center justify-center gap-1.5",
              "transition-all duration-300",
              isHovered 
                ? "bg-green-500 text-black shadow-lg shadow-green-500/30"
                : "bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30"
            )}
          >
            <Play className="h-3.5 w-3.5" fill="currentColor" />
            Assistir
          </button>
        </div>
        
        {/* === CORNER ACCENTS === */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-green-500/50 rounded-tl-lg pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-green-500/50 rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-green-500/50 rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-green-500/50 rounded-br-lg pointer-events-none" />
        
        {/* === SCANLINE EFFECT (High-End Only) === */}
        {!isLowEnd && isHovered && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
});
NetflixEpisodeCard.displayName = 'NetflixEpisodeCard';

// ============================================
// 🎬 NETFLIX LESSON CARD — Card Horizontal para Carousel
// Design cinematográfico com thumbnail + info
// ============================================
const NetflixLessonCard = memo(function NetflixLessonCard({ 
  lesson, 
  index,
  onPlay,
  shouldAnimate,
  isLowEnd
}: { 
  lesson: Lesson; 
  index: number;
  onPlay: () => void;
  shouldAnimate: boolean;
  isLowEnd: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasVideo = lesson.panda_video_id || lesson.video_url || lesson.youtube_video_id;

  return (
    <div
      className={cn(
        "relative flex-shrink-0 cursor-pointer",
        "w-[200px] sm:w-[220px] md:w-[240px]",
        !isLowEnd && "transition-all duration-300",
        !isLowEnd && isHovered && "scale-105 z-10"
      )}
      onMouseEnter={() => !isLowEnd && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPlay}
    >
      <div className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-gradient-to-br from-slate-800 to-slate-900",
        "border-2 transition-all duration-200",
        isHovered 
          ? "border-green-400/80 shadow-[0_0_20px_rgba(74,222,128,0.3)]"
          : "border-slate-700/50 shadow-lg shadow-black/40"
      )}>
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          {lesson.thumbnail_url ? (
            <img
              src={lesson.thumbnail_url}
              alt={lesson.title}
              className={cn(
                "absolute inset-0 w-full h-full object-cover",
                "transition-all duration-300",
                imageLoaded ? "opacity-100" : "opacity-0",
                !isLowEnd && isHovered && "scale-110"
              )}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-900/30 to-cyan-900/30">
              <Video className="h-8 w-8 text-green-400/50" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-300",
            isHovered 
              ? "bg-gradient-to-t from-black via-black/40 to-transparent"
              : "bg-gradient-to-t from-black/80 via-transparent to-transparent"
          )} />
          
          {/* Index badge */}
          <div className="absolute top-2 left-2">
            <span className="w-6 h-6 flex items-center justify-center rounded bg-green-500/90 text-white text-xs font-bold">
              {index + 1}
            </span>
          </div>
          
          {/* Duration badge */}
          {lesson.duration_minutes && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 rounded text-xs bg-black/80 text-white flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lesson.duration_minutes}min
              </span>
            </div>
          )}
          
          {/* Play button overlay */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            "transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            <div className={cn(
              "p-4 rounded-full",
              "bg-green-500 text-white",
              "shadow-[0_0_30px_rgba(74,222,128,0.5)]",
              !isLowEnd && "animate-pulse"
            )}>
              <Play className="h-6 w-6" fill="white" />
            </div>
          </div>
          
          {/* Title at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h5 className={cn(
              "font-semibold text-white text-sm leading-tight",
              isHovered ? "line-clamp-3" : "line-clamp-2"
            )}>
              {lesson.title}
            </h5>
          </div>
        </div>
        
        {/* Hover info panel */}
        {!isLowEnd && isHovered && (
          <div className="p-3 bg-slate-900/95 border-t border-green-500/20 animate-fade-in">
            <div className="flex items-center gap-2">
              {hasVideo && (
                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                  HD
                </span>
              )}
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <PlayCircle className="h-3 w-3" />
                Assistir
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
NetflixLessonCard.displayName = 'NetflixLessonCard';

// ============================================
// 🎬 NETFLIX MODULE CARD — LEGACY (for compatibility)
// Agora usa NetflixModuleSectionRow internally
// ============================================
const NetflixModuleCard = memo(function NetflixModuleCard({ 
  module, 
  index, 
  isExpanded, 
  onToggle,
  onPlayLesson,
  progress,
  isLowEnd,
  shouldAnimate,
  shouldBlur
}: {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onPlayLesson: (lesson: Lesson) => void;
  progress?: ModuleProgressData;
  isLowEnd: boolean;
  shouldAnimate: boolean;
  shouldBlur: boolean;
}) {
  // Legacy component now redirects to section row
  return null;
});
NetflixModuleCard.displayName = 'NetflixModuleCard';

// ============================================
// 🎬 NETFLIX LESSON ROW — Compact list item
// ============================================
const NetflixLessonRow = memo(function NetflixLessonRow({ 
  lesson, 
  index,
  onPlay
}: { 
  lesson: Lesson; 
  index: number;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      className={cn(
        "w-full flex items-center gap-3 px-2 py-2 text-left rounded-lg",
        "hover:bg-cyan-500/20 transition-colors group"
      )}
    >
      <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded bg-cyan-500/20 text-cyan-400 text-xs font-bold">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white group-hover:text-cyan-300 truncate transition-colors">
          {lesson.title}
        </p>
        {lesson.duration_minutes && (
          <p className="text-xs text-gray-500">{lesson.duration_minutes}min</p>
        )}
      </div>
      <Play className="h-4 w-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
    </button>
  );
});
NetflixLessonRow.displayName = 'NetflixLessonRow';

// ============================================
// 📦 MODULE CARD — LEGACY GRID VIEW (kept for compatibility)
// ============================================
const ModuleCard = memo(function ModuleCard({ 
  module, 
  index, 
  isExpanded, 
  onToggle,
  onPlayLesson,
  progress
}: {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onPlayLesson: (lesson: Lesson) => void;
  progress?: ModuleProgressData;
}) {
  return (
    <NetflixModuleCard
      module={module}
      index={index}
      isExpanded={isExpanded}
      onToggle={onToggle}
      onPlayLesson={onPlayLesson}
      progress={progress}
      isLowEnd={false}
      shouldAnimate={true}
      shouldBlur={true}
    />
  );
});
ModuleCard.displayName = 'ModuleCard';

// ============================================
// 🎬 LESSON CARD — CARD GRID ORIGINAL
// Design como no print: thumbnail + número + título + botão assistir
// PERFORMANCE: Memoizado para evitar re-renders
// ============================================
const LessonCard = memo(function LessonCard({ 
  lesson, 
  index,
  onPlay
}: { 
  lesson: Lesson; 
  index: number;
  onPlay: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const hasValidThumbnail = lesson.thumbnail_url && !imageError;

  return (
    <div
      onClick={onPlay}
      className={cn(
        "group relative flex flex-col rounded-xl overflow-hidden cursor-pointer",
        "bg-gradient-to-br from-slate-800/90 via-cyan-900/30 to-slate-800/90",
        "border-2 border-cyan-500/30 hover:border-cyan-400/70",
        "hover:shadow-[0_0_25px_rgba(34,211,238,0.2)]",
        "transition-all duration-300 hover:scale-[1.02]"
      )}
    >
      {/* ✨ Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/50 rounded-tl-xl pointer-events-none z-10" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/50 rounded-tr-xl pointer-events-none z-10" />
      
      {/* 🖼️ Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {hasValidThumbnail ? (
          <img
            src={lesson.thumbnail_url!}
            alt=""
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900/50 to-blue-900/50">
            <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
              <Play className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* 🔢 Lesson number — Premium badge */}
        <div className="absolute top-2 left-2 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400/40 blur-sm rounded-lg" />
            <span className="relative px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-xs font-black border border-cyan-300/50 shadow-lg">
              #{String(index + 1).padStart(2, '0')}
            </span>
          </div>
        </div>
        
        {/* ⏱️ Duration badge */}
        {lesson.duration_minutes && (
          <div className="absolute top-2 right-2 z-10">
            <span className="px-2 py-1 rounded-lg bg-black/70 text-white text-xs font-bold border border-white/20 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lesson.duration_minutes}min
            </span>
          </div>
        )}
        
        {/* ▶️ Play button — Centered, pulsing */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "relative p-4 rounded-2xl transition-all duration-300",
            "bg-gradient-to-br from-green-500 to-emerald-600",
            "border-2 border-green-300/50",
            "shadow-[0_0_30px_rgba(34,197,94,0.4)]",
            "opacity-90 group-hover:opacity-100 group-hover:scale-110"
          )}>
            <div className="absolute inset-0 bg-green-400/30 rounded-2xl blur-xl animate-pulse" />
            <Play className="relative h-6 w-6 text-white" fill="white" />
          </div>
        </div>
      </div>
      
      {/* 📝 Content */}
      <div className="p-3 flex-1 flex flex-col gap-2 bg-gradient-to-b from-transparent to-slate-900/50">
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-cyan-300 transition-colors">
          {lesson.title}
        </p>
        
        {/* Action bar */}
        <div className="mt-auto pt-2 border-t border-cyan-500/20">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold uppercase tracking-wider">
              <Video className="h-3.5 w-3.5" />
              Videoaula
            </span>
            <span className="flex items-center gap-1 text-xs text-green-400 font-bold group-hover:text-green-300 transition-colors">
              Assistir
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
LessonCard.displayName = 'LessonCard';

// ============================================
// 🎬 LESSON ROW — LISTA VERTICAL COMPACTA (LEGACY)
// Design clean: thumbnail pequena + título + duração
// PERFORMANCE: Memoizado para evitar re-renders
// ============================================
const LessonRow = memo(function LessonRow({ 
  lesson, 
  index,
  onPlay
}: { 
  lesson: Lesson; 
  index: number;
  onPlay: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '--';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}min`;
    return `${mins}min`;
  };

  const hasValidThumbnail = lesson.thumbnail_url && !imageError;

  return (
    <button
      onClick={onPlay}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 text-left",
        "hover:bg-cyan-500/10 transition-colors duration-150",
        "group cursor-pointer"
      )}
    >
      {/* Número da aula */}
      <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-cyan-500/20 text-cyan-400 text-xs font-bold">
        {index + 1}
      </span>
      
      {/* Thumbnail pequena (opcional) */}
      <div className="shrink-0 w-16 h-10 rounded-md overflow-hidden bg-cyan-900/30">
        {hasValidThumbnail ? (
          <img
            src={lesson.thumbnail_url!}
            alt=""
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-4 w-4 text-cyan-500/50" />
          </div>
        )}
      </div>
      
      {/* Título */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-cyan-400 transition-colors">
          {lesson.title}
        </p>
        {lesson.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {lesson.description}
          </p>
        )}
      </div>
      
      {/* Duração */}
      <div className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>{formatDuration(lesson.duration_minutes)}</span>
      </div>
      
      {/* Play icon on hover */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="p-1.5 rounded-full bg-green-500/20 text-green-400">
          <Play className="h-3.5 w-3.5 fill-current" />
        </div>
      </div>
    </button>
  );
});

LessonRow.displayName = 'LessonRow';

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
