// ============================================
// 📚 HIERARQUIA DE CURSOS DO ALUNO — DESIGN 2300
// Visualização organizada: Curso → Subcategoria → Módulo → Aulas
// Mesmo padrão visual da Gestão, mas modo leitura
// ============================================

import { useState, useMemo, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

  useEffect(() => {
    const channel = supabase
      .channel('lms-aluno-hierarchy-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        queryClient.invalidateQueries({ queryKey: ['aluno-all-modules-hierarchy'] });
        queryClient.invalidateQueries({ queryKey: ['aluno-courses-dropdown'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, () => {
        queryClient.invalidateQueries({ queryKey: ['aluno-all-modules-hierarchy'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => {
        queryClient.invalidateQueries({ queryKey: ['aluno-all-modules-hierarchy'] });
        queryClient.invalidateQueries({ queryKey: ['aluno-module-lessons'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
}

// ============================================
// HUD STAT ORB
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
// LEGENDA VISUAL
// ============================================
function HierarchyLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-purple-500/5 via-cyan-500/5 to-pink-500/5 border border-border/30">
      <span className="text-xs text-muted-foreground mr-2">📚 Navegue:</span>
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
    </div>
  );
}

// ============================================
// COURSE SECTION
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
      "overflow-hidden transition-all duration-300 animate-fade-in",
      "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-xl",
      "border-purple-500/20 hover:border-purple-500/40",
      "shadow-lg shadow-purple-500/5"
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 border-b border-border/30 hover:from-purple-500/15 hover:to-pink-500/15 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur-xl animate-pulse" />
                  <div className="relative p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <GraduationCap className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
                
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    {course?.title || 'Sem Curso'}
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      Disponível
                    </Badge>
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
              
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-0">
            <ScrollArea className="h-auto max-h-[600px]">
              <div className="p-4 space-y-4">
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
// SUBCATEGORY SECTION
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
    <div className="space-y-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all">
            <div className="p-1.5 rounded-lg bg-amber-500/20">
              <FolderOpen className="h-4 w-4 text-amber-400" />
            </div>
            <span className="font-semibold text-amber-300 flex-1">
              {subcategory || '📁 Geral'}
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
export function AlunoCoursesHierarchy() {
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
      {/* Video Player Modal */}
      <Dialog open={!!selectedLesson} onOpenChange={(open) => !open && closePlayer()}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] overflow-y-auto p-0">
          {selectedLesson && (
            <>
              <DialogHeader className="p-4 pb-0">
                <DialogTitle className="text-lg font-semibold line-clamp-1">
                  {selectedLesson.title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="p-4 space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
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

                <LessonTabs 
                  lessonId={selectedLesson.id}
                  lessonTitle={selectedLesson.title}
                />

                {selectedLesson.description && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Sobre esta aula</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {selectedLesson.description}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
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
