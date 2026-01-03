// ============================================
// 📚 CURSOS DO ALUNO - Espelho Read-Only
// CONSTITUTIONAL: Student Courses Canonical Mirror v1.0
// ============================================

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
    staleTime: 5 * 60 * 1000 // 5 min
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
// COMPONENTS
// ============================================

const CourseCard = memo(function CourseCard({ 
  course, 
  onSelect, 
  isSelected 
}: { 
  course: Course; 
  onSelect: () => void;
  isSelected: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={cn(
          "cursor-pointer overflow-hidden transition-all duration-300",
          "border-2 hover:border-primary/50",
          isSelected && "border-primary ring-2 ring-primary/30"
        )}
        onClick={onSelect}
      >
        <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5">
          {course.thumbnail_url ? (
            <img 
              src={course.thumbnail_url} 
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-16 h-16 text-primary/40" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge className="bg-primary/90">
              <Sparkles className="w-3 h-3 mr-1" />
              Curso
            </Badge>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg line-clamp-2 text-foreground">
            {course.title}
          </h3>
          {course.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {course.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground">
              Clique para ver módulos
            </span>
            <ChevronRight className="w-4 h-4 text-primary" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

const ModuleCard = memo(function ModuleCard({ 
  module, 
  onSelect,
  isSelected,
  lessonCount 
}: { 
  module: Module; 
  onSelect: () => void;
  isSelected: boolean;
  lessonCount?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card 
        className={cn(
          "cursor-pointer overflow-hidden transition-all duration-300",
          "border hover:border-primary/50",
          isSelected && "border-primary bg-primary/5"
        )}
        onClick={onSelect}
      >
        <div className="flex">
          {/* Module Image - 752x940 aspect ratio maintained */}
          <div 
            className="w-24 h-32 flex-shrink-0 bg-gradient-to-br from-secondary/30 to-secondary/10 overflow-hidden"
            style={{ aspectRatio: '752/940' }}
          >
            {module.thumbnail_url ? (
              <img 
                src={module.thumbnail_url} 
                alt={module.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground/40" />
              </div>
            )}
          </div>
          
          {/* Module Info */}
          <div className="flex-1 p-4 flex flex-col justify-center">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="outline" className="mb-2 text-xs">
                  Módulo {module.position}
                </Badge>
                <h4 className="font-semibold text-foreground line-clamp-2">
                  {module.title}
                </h4>
              </div>
              {isSelected ? (
                <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            {module.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {module.description}
              </p>
            )}
            {lessonCount !== undefined && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Video className="w-3 h-3" />
                <span>{lessonCount} aula{lessonCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div 
        className={cn(
          "group flex items-center gap-4 p-4 rounded-lg",
          "bg-card/50 hover:bg-card border border-border/50 hover:border-primary/30",
          "transition-all duration-200 cursor-pointer"
        )}
        onClick={onPlay}
      >
        {/* Play Button */}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Play className="w-4 h-4 text-primary fill-primary" />
        </div>
        
        {/* Lesson Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
            {lesson.title}
          </p>
          {lesson.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {lesson.description}
            </p>
          )}
        </div>
        
        {/* Duration */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{formatDuration(lesson.duration_minutes)}</span>
        </div>
      </div>
    </motion.div>
  );
});

const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-video w-full" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

// ============================================
// MAIN COMPONENT
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
    // Navigate to video player or open modal
    // TODO: Integrate with existing video player
    console.log('Play lesson:', lesson);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            {(selectedCourse || selectedModule) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent flex items-center gap-2">
                  {selectedCourse ? selectedCourse.title : 'Meus Cursos'}
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                </h1>
                <p className="text-muted-foreground text-sm">
                  {selectedModule 
                    ? selectedModule.title
                    : selectedCourse 
                      ? `${modules?.length || 0} módulos disponíveis`
                      : 'Sua biblioteca de cursos'
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Breadcrumb */}
          {selectedCourse && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 mt-4 text-sm text-muted-foreground"
            >
              <span 
                className="hover:text-primary cursor-pointer transition-colors"
                onClick={() => { setSelectedCourse(null); setSelectedModule(null); }}
              >
                Cursos
              </span>
              <ChevronRight className="w-4 h-4" />
              <span 
                className={cn(
                  selectedModule ? "hover:text-primary cursor-pointer transition-colors" : "text-foreground font-medium"
                )}
                onClick={() => selectedModule && setSelectedModule(null)}
              >
                {selectedCourse.title}
              </span>
              {selectedModule && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-foreground font-medium">
                    {selectedModule.title}
                  </span>
                </>
              )}
            </motion.div>
          )}
        </header>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* Course List */}
          {!selectedCourse && (
            <motion.div
              key="courses"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {loadingCourses ? (
                <LoadingSkeleton />
              ) : courses && courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map(course => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onSelect={() => handleSelectCourse(course)}
                      isSelected={false}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">Nenhum curso disponível</h3>
                  <p className="text-muted-foreground mt-2">
                    Os cursos aparecerão aqui quando forem publicados.
                  </p>
                </Card>
              )}
            </motion.div>
          )}

          {/* Module List */}
          {selectedCourse && !selectedModule && (
            <motion.div
              key="modules"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {loadingModules ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="p-4">
                      <div className="flex gap-4">
                        <Skeleton className="w-24 h-32" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : modules && modules.length > 0 ? (
                <div className="space-y-4">
                  {modules.map(module => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      onSelect={() => handleSelectModule(module)}
                      isSelected={selectedModule?.id === module.id}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">Nenhum módulo disponível</h3>
                  <p className="text-muted-foreground mt-2">
                    Os módulos deste curso ainda não foram publicados.
                  </p>
                </Card>
              )}
            </motion.div>
          )}

          {/* Lesson List */}
          {selectedModule && (
            <motion.div
              key="lessons"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Module Header with Image */}
              <Card className="mb-6 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {selectedModule.thumbnail_url && (
                    <div 
                      className="w-full md:w-48 h-60 flex-shrink-0 bg-gradient-to-br from-secondary/30 to-secondary/10"
                      style={{ aspectRatio: '752/940' }}
                    >
                      <img 
                        src={selectedModule.thumbnail_url} 
                        alt={selectedModule.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 flex-1">
                    <Badge className="mb-3">Módulo {selectedModule.position}</Badge>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      {selectedModule.title}
                    </h2>
                    {selectedModule.description && (
                      <p className="text-muted-foreground">
                        {selectedModule.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        <span>{lessons?.length || 0} aulas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Lessons */}
              {loadingLessons ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="p-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : lessons && lessons.length > 0 ? (
                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="space-y-3 pr-4">
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
                <Card className="p-12 text-center">
                  <Video className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">Nenhuma aula disponível</h3>
                  <p className="text-muted-foreground mt-2">
                    As aulas deste módulo ainda não foram publicadas.
                  </p>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

AlunoCursos.displayName = 'AlunoCursos';

export default AlunoCursos;
