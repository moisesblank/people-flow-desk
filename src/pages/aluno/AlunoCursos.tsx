// ============================================
// 📚 CURSOS DO ALUNO - Year 2300 Cinematic Experience
// CONSTITUTIONAL: Student Courses Canonical Mirror v1.0
// 🚀 PERFORMANCE: CSS-only animations, GPU-accelerated
// ============================================

import { memo, useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  BookOpen, 
  Play, 
  ChevronRight, 
  ChevronDown,
  Clock,
  Video,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Layers,
  Zap,
  Target
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CyberBackground } from '@/components/ui/cyber-background';
import { FuturisticPageHeader } from '@/components/ui/futuristic-page-header';

// ============================================
// TYPES - Reusing canonical LMS types
// ============================================

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
  is_published: boolean;
  thumbnail_url: string | null;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  position: number;
  is_published: boolean;
  duration_minutes: number | null;
  video_url: string | null;
}

// ============================================
// HOOKS - Reusing canonical data queries
// ============================================

function usePublishedCourses() {
  return useQuery({
    queryKey: ['aluno-courses-published'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Course[];
    },
    staleTime: 5 * 60 * 1000
  });
}

function usePublishedModules(courseId: string | null) {
  return useQuery({
    queryKey: ['aluno-modules-published', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as Module[];
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000
  });
}

function usePublishedLessons(moduleId: string | null) {
  return useQuery({
    queryKey: ['aluno-lessons-published', moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      const { data, error } = await supabase
        .from('lessons')
        .select('id, module_id, title, description, position, is_published, duration_minutes, video_url')
        .eq('module_id', moduleId)
        .eq('is_published', true)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000
  });
}

// ============================================
// 🎬 CINEMATIC COURSE CARD - Year 2300
// ============================================

const CourseCard = memo(function CourseCard({ 
  course, 
  onSelect, 
  isSelected,
  index 
}: { 
  course: Course; 
  onSelect: () => void;
  isSelected: boolean;
  index: number;
}) {
  return (
    <div
      className="group animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Card 
        variant="2300-neon"
        className={cn(
          "cursor-pointer overflow-hidden transition-all duration-500",
          "hover:scale-[1.02] hover:-translate-y-2",
          "border-2 hover:border-primary/60",
          "shadow-[0_0_30px_hsl(var(--primary)/0.1)]",
          "hover:shadow-[0_0_60px_hsl(var(--primary)/0.25),0_20px_40px_hsl(var(--background)/0.5)]",
          isSelected && "border-primary ring-2 ring-primary/30"
        )}
        onClick={onSelect}
      >
        {/* 🎬 Thumbnail Area with Holographic Overlay */}
        <div className="relative aspect-video overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-holo-purple/20 to-holo-cyan/30" />
          
          {/* Holographic Grid */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--holo-cyan)) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--holo-cyan)) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />
          
          {course.thumbnail_url ? (
            <img 
              src={course.thumbnail_url} 
              alt={course.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
                <GraduationCap className="relative w-20 h-20 text-primary/60" />
              </div>
            </div>
          )}
          
          {/* Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none opacity-30 scanline-effect" />
          
          {/* Top Badge */}
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-primary/90 backdrop-blur-sm border border-primary-foreground/20 shadow-lg">
              <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
              Curso
            </Badge>
          </div>
          
          {/* Bottom Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-card via-card/80 to-transparent" />
        </div>
        
        <CardContent className="p-5 relative">
          {/* Energy Line Top */}
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          
          <h3 className="font-bold text-lg line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          
          {course.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {course.description}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Ver módulos
            </span>
            <div className="flex items-center gap-1 text-primary">
              <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Acessar
              </span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// ============================================
// 🎴 HOLOGRAPHIC MODULE CARD - Year 2300
// ============================================

const ModuleCard = memo(function ModuleCard({ 
  module, 
  onSelect,
  isSelected,
  lessonCount,
  index 
}: { 
  module: Module; 
  onSelect: () => void;
  isSelected: boolean;
  lessonCount?: number;
  index: number;
}) {
  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <Card 
        variant="2300-glass"
        className={cn(
          "group cursor-pointer overflow-hidden transition-all duration-300",
          "hover:scale-[1.01] hover:-translate-x-1",
          "border hover:border-primary/50",
          "hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]",
          isSelected && "border-primary bg-primary/10 shadow-[0_0_40px_hsl(var(--primary)/0.2)]"
        )}
        onClick={onSelect}
      >
        <div className="flex">
          {/* Module Image - 752x940 aspect ratio maintained */}
          <div 
            className="w-28 h-36 flex-shrink-0 relative overflow-hidden"
            style={{ aspectRatio: '752/940' }}
          >
            {/* Holographic Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-holo-cyan/20 via-holo-purple/10 to-primary/20" />
            
            {module.thumbnail_url ? (
              <img 
                src={module.thumbnail_url} 
                alt={module.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                <BookOpen className="w-10 h-10 text-muted-foreground/40" />
              </div>
            )}
            
            {/* Module Number Badge */}
            <div className="absolute top-2 left-2">
              <div className="w-7 h-7 rounded-lg bg-primary/90 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/20 shadow-lg">
                <span className="text-xs font-bold text-primary-foreground">{module.position}</span>
              </div>
            </div>
          </div>
          
          {/* Module Info */}
          <div className="flex-1 p-4 flex flex-col justify-center">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <Badge variant="outline" className="mb-2 text-[10px] border-primary/30 text-primary">
                  <Target className="w-2.5 h-2.5 mr-1" />
                  Módulo {module.position}
                </Badge>
                <h4 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {module.title}
                </h4>
              </div>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                isSelected 
                  ? "bg-primary text-primary-foreground rotate-90" 
                  : "bg-secondary/50 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
              )}>
                {isSelected ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </div>
            
            {module.description && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                {module.description}
              </p>
            )}
            
            {lessonCount !== undefined && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/30 px-2 py-1 rounded-md">
                  <Video className="w-3 h-3 text-primary" />
                  <span>{lessonCount} aula{lessonCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});

// ============================================
// ⚡ NEON LESSON ITEM - Year 2300
// ============================================

const LessonItem = memo(function LessonItem({ 
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
      className="animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div 
        className={cn(
          "group flex items-center gap-4 p-4 rounded-xl",
          "bg-card/60 backdrop-blur-sm",
          "border border-border/40 hover:border-primary/40",
          "hover:bg-primary/5",
          "shadow-sm hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)]",
          "transition-all duration-300 cursor-pointer"
        )}
        onClick={onPlay}
      >
        {/* Play Button - Neon Glow */}
        <div className={cn(
          "relative w-12 h-12 rounded-xl flex items-center justify-center",
          "bg-gradient-to-br from-primary/20 to-primary/10",
          "border border-primary/30",
          "group-hover:from-primary/30 group-hover:to-primary/20",
          "group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]",
          "transition-all duration-300"
        )}>
          <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          <Play className="relative w-5 h-5 text-primary fill-primary/50 group-hover:fill-primary transition-all" />
        </div>
        
        {/* Lesson Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-primary/60 bg-primary/10 px-1.5 py-0.5 rounded">
              #{String(index + 1).padStart(2, '0')}
            </span>
            <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
              {lesson.title}
            </p>
          </div>
          {lesson.description && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {lesson.description}
            </p>
          )}
        </div>
        
        {/* Duration Badge */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono">{formatDuration(lesson.duration_minutes)}</span>
        </div>
        
        {/* Hover Arrow */}
        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
});

// ============================================
// 💀 SKELETON LOADER - Year 2300
// ============================================

const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <Card key={i} variant="2300-glass" className="overflow-hidden">
          <Skeleton className="aspect-video w-full bg-secondary/30" />
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-6 w-3/4 bg-secondary/30" />
            <Skeleton className="h-4 w-full bg-secondary/20" />
            <Skeleton className="h-4 w-2/3 bg-secondary/20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

// ============================================
// 🏛️ MAIN COMPONENT - Year 2300 Experience
// ============================================

const AlunoCursos = memo(function AlunoCursos() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  
  const { data: courses, isLoading: loadingCourses } = usePublishedCourses();
  const { data: modules, isLoading: loadingModules } = usePublishedModules(selectedCourse?.id || null);
  const { data: lessons, isLoading: loadingLessons } = usePublishedLessons(selectedModule?.id || null);

  const handleSelectCourse = useCallback((course: Course) => {
    setSelectedCourse(course);
    setSelectedModule(null);
  }, []);

  const handleSelectModule = useCallback((module: Module) => {
    setSelectedModule(prev => prev?.id === module.id ? null : module);
  }, []);

  const handleBack = useCallback(() => {
    if (selectedModule) {
      setSelectedModule(null);
    } else if (selectedCourse) {
      setSelectedCourse(null);
    }
  }, [selectedCourse, selectedModule]);

  const handlePlayLesson = useCallback((lesson: Lesson) => {
    console.log('Play lesson:', lesson);
  }, []);

  // Stats for header
  const stats = useMemo(() => {
    if (selectedCourse) {
      return [
        { label: 'Módulos', value: modules?.length || 0, icon: Layers },
        { label: 'Aulas', value: lessons?.length || 0, icon: Video },
      ];
    }
    return [
      { label: 'Cursos', value: courses?.length || 0, icon: GraduationCap },
    ];
  }, [courses, modules, lessons, selectedCourse]);

  return (
    <div className="relative min-h-screen">
      {/* 🌌 Cinematic Background */}
      <CyberBackground variant="grid" intensity="medium" />
      
      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          
          {/* 🎬 Futuristic Header */}
          <FuturisticPageHeader
            title={selectedCourse ? selectedCourse.title : 'Meus Cursos'}
            subtitle={
              selectedModule 
                ? selectedModule.title
                : selectedCourse 
                  ? `${modules?.length || 0} módulos disponíveis`
                  : 'Sua biblioteca de cursos premium'
            }
            icon={GraduationCap}
            accentColor="primary"
            showBackButton={!!(selectedCourse || selectedModule)}
            backPath="#"
            stats={stats}
          >
            {/* Custom back button */}
            {(selectedCourse || selectedModule) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="border-primary/30 hover:bg-primary/10 hover:border-primary/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
          </FuturisticPageHeader>

          {/* 🧭 Breadcrumb */}
          {selectedCourse && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/30 animate-fade-in">
              <button 
                className="hover:text-primary cursor-pointer transition-colors flex items-center gap-1"
                onClick={() => { setSelectedCourse(null); setSelectedModule(null); }}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Cursos
              </button>
              <ChevronRight className="w-4 h-4 text-primary/50" />
              <button 
                className={cn(
                  selectedModule ? "hover:text-primary cursor-pointer transition-colors" : "text-foreground font-medium"
                )}
                onClick={() => selectedModule && setSelectedModule(null)}
              >
                {selectedCourse.title}
              </button>
              {selectedModule && (
                <>
                  <ChevronRight className="w-4 h-4 text-primary/50" />
                  <span className="text-foreground font-medium flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    {selectedModule.title}
                  </span>
                </>
              )}
            </div>
          )}

          {/* 📚 Content Area */}
          <div className="min-h-[400px]">
            
            {/* Course Grid */}
            {!selectedCourse && (
              <>
                {loadingCourses ? (
                  <LoadingSkeleton />
                ) : courses && courses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course, index) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        onSelect={() => handleSelectCourse(course)}
                        isSelected={false}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <Card variant="2300-glass" className="p-12 text-center">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                      <GraduationCap className="relative w-20 h-20 mx-auto text-muted-foreground/40" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Nenhum curso disponível</h3>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                      Os cursos aparecerão aqui quando forem publicados pela equipe.
                    </p>
                  </Card>
                )}
              </>
            )}

            {/* Module List */}
            {selectedCourse && !selectedModule && (
              <div className="space-y-4">
                {loadingModules ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Card key={i} variant="2300-glass" className="h-36">
                        <div className="flex h-full">
                          <Skeleton className="w-28 h-full bg-secondary/30" />
                          <div className="flex-1 p-4 space-y-3">
                            <Skeleton className="h-5 w-20 bg-secondary/30" />
                            <Skeleton className="h-6 w-3/4 bg-secondary/30" />
                            <Skeleton className="h-4 w-1/2 bg-secondary/20" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : modules && modules.length > 0 ? (
                  <div className="space-y-4">
                    {modules.map((module, index) => (
                      <ModuleCard
                        key={module.id}
                        module={module}
                        onSelect={() => handleSelectModule(module)}
                        isSelected={selectedModule?.id === module.id}
                        lessonCount={0}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <Card variant="2300-glass" className="p-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">Nenhum módulo disponível</h3>
                    <p className="text-muted-foreground mt-2">
                      Este curso ainda não possui módulos publicados.
                    </p>
                  </Card>
                )}
              </div>
            )}

            {/* Lesson List */}
            {selectedModule && (
              <div className="space-y-3">
                {loadingLessons ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card/60 border border-border/40">
                        <Skeleton className="w-12 h-12 rounded-xl bg-secondary/30" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4 bg-secondary/30" />
                          <Skeleton className="h-4 w-1/2 bg-secondary/20" />
                        </div>
                        <Skeleton className="w-20 h-8 rounded-lg bg-secondary/20" />
                      </div>
                    ))}
                  </div>
                ) : lessons && lessons.length > 0 ? (
                  <ScrollArea className="h-[calc(100vh-400px)] pr-4">
                    <div className="space-y-3">
                      {lessons.map((lesson, index) => (
                        <LessonItem
                          key={lesson.id}
                          lesson={lesson}
                          index={index}
                          onPlay={() => handlePlayLesson(lesson)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <Card variant="2300-glass" className="p-12 text-center">
                    <Video className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">Nenhuma aula disponível</h3>
                    <p className="text-muted-foreground mt-2">
                      Este módulo ainda não possui aulas publicadas.
                    </p>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default AlunoCursos;
