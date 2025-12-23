// ============================================
// 🌌 LMS v5.0 - FASE 3: useOptimisticMutation
// Cursos instantâneos na segunda visita + 0ms feedback
// ============================================

import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useSubspaceQuery, useOptimisticMutation, SUBSPACE_CACHE_PROFILES } from './useSubspaceCommunication';

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  instructor_id: string | null;
  price: number;
  is_published: boolean;
  category: string;
  difficulty_level: string;
  estimated_hours: number;
  total_xp: number;
  created_at: string;
  modules?: Module[];
  instructor?: {
    nome: string;
    avatar_url: string | null;
  };
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
  xp_reward: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  content: string | null;
  duration_minutes: number;
  position: number;
  xp_reward: number;
  is_free: boolean;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
  progress_percentage: number;
  status: string;
  certificate_url: string | null;
  course?: Course;
}

interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  watch_time_seconds: number;
  last_position_seconds: number;
}

// ============================================
// COURSES HOOKS - Com Cache localStorage
// ============================================

export function useCourses(options?: { published?: boolean }) {
  return useSubspaceQuery<Course[]>(
    ['courses', options?.published?.toString() || 'all'],
    async () => {
      let query = supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(nome, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (options?.published !== undefined) {
        query = query.eq('is_published', options.published);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Course[];
    },
    {
      profile: 'semiStatic', // 30 min staleTime, persiste 24h no localStorage
      persistKey: `courses_${options?.published ?? 'all'}`,
    }
  );
}

export function useCourse(courseId: string | undefined) {
  return useSubspaceQuery<Course | null>(
    ['course', courseId || ''],
    async () => {
      if (!courseId) return null;

      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(nome, avatar_url),
          modules(
            *,
            lessons(*)
          )
        `)
        .eq('id', courseId)
        .maybeSingle();

      if (error) throw error;
      
      // Sort modules and lessons by position
      if (data?.modules) {
        data.modules.sort((a: Module, b: Module) => a.position - b.position);
        data.modules.forEach((module: Module) => {
          if (module.lessons) {
            module.lessons.sort((a: Lesson, b: Lesson) => a.position - b.position);
          }
        });
      }

      return data as Course | null;
    },
    {
      profile: 'immutable', // Cursos raramente mudam, cache 7 dias
      persistKey: `course_detail_${courseId}`,
      enabled: !!courseId,
    }
  );
}

// ============================================
// ENROLLMENTS HOOKS - Com Cache localStorage
// ============================================

export function useEnrollments() {
  const { user } = useAuth();

  return useSubspaceQuery<Enrollment[]>(
    ['enrollments', user?.id || ''],
    async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(
            *,
            instructor:profiles!courses_instructor_id_fkey(nome, avatar_url)
          )
        `)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data as Enrollment[];
    },
    {
      profile: 'user', // 5 min staleTime, persiste 1h
      persistKey: `enrollments_${user?.id}`,
      enabled: !!user?.id,
    }
  );
}

export function useEnrollment(courseId: string | undefined) {
  const { user } = useAuth();

  return useSubspaceQuery<Enrollment | null>(
    ['enrollment', user?.id || '', courseId || ''],
    async () => {
      if (!user?.id || !courseId) return null;

      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) throw error;
      return data as Enrollment | null;
    },
    {
      profile: 'user',
      persistKey: `enrollment_${user?.id}_${courseId}`,
      enabled: !!user?.id && !!courseId,
    }
  );
}

// Hook para matrícula - MIGRADO PARA useOptimisticMutation
export function useEnroll() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useOptimisticMutation<Enrollment[], string, Enrollment>({
    queryKey: ['enrollments', user?.id || ''],
    mutationFn: async (courseId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Enrollment;
    },
    optimisticUpdate: (old, courseId) => {
      const newEnrollment: Enrollment = {
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        completed_at: null,
        progress_percentage: 0,
        status: 'active',
        certificate_url: null,
      };
      return [...(old || []), newEnrollment];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment'] });
    },
    successMessage: 'Matrícula realizada com sucesso!',
    errorMessage: 'Erro ao realizar matrícula',
  });
}

// ============================================
// LESSON PROGRESS HOOKS - Com Cache localStorage
// ============================================

export function useLessonProgress(lessonId: string | undefined) {
  const { user } = useAuth();

  return useSubspaceQuery<LessonProgress | null>(
    ['lesson-progress', user?.id || '', lessonId || ''],
    async () => {
      if (!user?.id || !lessonId) return null;

      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) throw error;
      return data as LessonProgress | null;
    },
    {
      profile: 'user',
      persistKey: `lesson_progress_${user?.id}_${lessonId}`,
      enabled: !!user?.id && !!lessonId,
    }
  );
}

export function useCourseProgress(courseId: string | undefined) {
  const { user } = useAuth();

  return useSubspaceQuery<{ completed: number; total: number; percentage: number }>(
    ['course-progress', user?.id || '', courseId || ''],
    async () => {
      if (!user?.id || !courseId) return { completed: 0, total: 0, percentage: 0 };

      // Get all lessons for this course
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

      if (modulesError) throw modulesError;

      const moduleIds = modules?.map(m => m.id) || [];
      if (moduleIds.length === 0) return { completed: 0, total: 0, percentage: 0 };

      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds);

      if (lessonsError) throw lessonsError;

      const lessonIds = lessons?.map(l => l.id) || [];
      if (lessonIds.length === 0) return { completed: 0, total: 0, percentage: 0 };

      // Get completed lessons
      const { data: progress, error: progressError } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds)
        .eq('completed', true);

      if (progressError) throw progressError;

      const completed = progress?.length || 0;
      const total = lessonIds.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { completed, total, percentage };
    },
    {
      profile: 'user',
      persistKey: `course_progress_${user?.id}_${courseId}`,
      enabled: !!user?.id && !!courseId,
    }
  );
}

// Hook para atualizar progresso - MIGRADO PARA useOptimisticMutation
export function useUpdateLessonProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useOptimisticMutation<LessonProgress | null, { lessonId: string; completed?: boolean; watchTimeSeconds?: number; lastPositionSeconds?: number }, LessonProgress>({
    queryKey: ['lesson-progress', user?.id || '', ''],
    mutationFn: async ({ lessonId, completed, watchTimeSeconds, lastPositionSeconds }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: Partial<LessonProgress> = {};
      if (completed !== undefined) {
        updateData.completed = completed;
        if (completed) {
          updateData.completed_at = new Date().toISOString();
        }
      }
      if (watchTimeSeconds !== undefined) {
        updateData.watch_time_seconds = watchTimeSeconds;
      }
      if (lastPositionSeconds !== undefined) {
        updateData.last_position_seconds = lastPositionSeconds;
      }

      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert(
          {
            user_id: user.id,
            lesson_id: lessonId,
            ...updateData,
          },
          { onConflict: 'user_id,lesson_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as LessonProgress;
    },
    optimisticUpdate: (old, variables) => {
      if (!old) {
        return {
          id: `temp-${Date.now()}`,
          user_id: user?.id || '',
          lesson_id: variables.lessonId,
          completed: variables.completed || false,
          completed_at: variables.completed ? new Date().toISOString() : null,
          watch_time_seconds: variables.watchTimeSeconds || 0,
          last_position_seconds: variables.lastPositionSeconds || 0,
        };
      }
      return {
        ...old,
        completed: variables.completed ?? old.completed,
        completed_at: variables.completed ? new Date().toISOString() : old.completed_at,
        watch_time_seconds: variables.watchTimeSeconds ?? old.watch_time_seconds,
        last_position_seconds: variables.lastPositionSeconds ?? old.last_position_seconds,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-progress'] });
      if (variables.completed) {
        toast.success('Aula concluída!');
      }
    },
  });
}

// ============================================
// ADMIN MUTATIONS
// ============================================

// Hook para criar curso - MIGRADO PARA useOptimisticMutation
export function useCreateCourse() {
  return useOptimisticMutation<Course[], Partial<Course>, Course>({
    queryKey: ['courses', 'all'],
    mutationFn: async (course) => {
      const { data, error } = await supabase
        .from('courses')
        .insert(course as any)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },
    optimisticUpdate: (old, newCourse) => {
      const tempCourse: Course = {
        id: `temp-${Date.now()}`,
        title: newCourse.title || '',
        description: newCourse.description || null,
        thumbnail_url: newCourse.thumbnail_url || null,
        instructor_id: newCourse.instructor_id || null,
        price: newCourse.price || 0,
        is_published: newCourse.is_published || false,
        category: newCourse.category || '',
        difficulty_level: newCourse.difficulty_level || 'beginner',
        estimated_hours: newCourse.estimated_hours || 0,
        total_xp: newCourse.total_xp || 0,
        created_at: new Date().toISOString(),
      };
      return [tempCourse, ...(old || [])];
    },
    successMessage: 'Curso criado com sucesso!',
    errorMessage: 'Erro ao criar curso',
  });
}

// Hook para atualizar curso - MIGRADO PARA useOptimisticMutation
export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useOptimisticMutation<Course[], Partial<Course> & { id: string }, Course>({
    queryKey: ['courses', 'all'],
    mutationFn: async ({ id, ...course }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(course)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },
    optimisticUpdate: (old, { id, ...updates }) => {
      return (old || []).map(c => c.id === id ? { ...c, ...updates } : c);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course'] });
    },
    successMessage: 'Curso atualizado!',
    errorMessage: 'Erro ao atualizar curso',
  });
}

// Hook para criar módulo - MIGRADO PARA useOptimisticMutation
export function useCreateModule() {
  const queryClient = useQueryClient();

  return useOptimisticMutation<Module[], Partial<Module>, Module>({
    queryKey: ['modules'],
    mutationFn: async (module) => {
      const { data, error } = await supabase
        .from('modules')
        .insert(module as any)
        .select()
        .single();

      if (error) throw error;
      return data as Module;
    },
    optimisticUpdate: (old, newModule) => {
      const tempModule: Module = {
        id: `temp-${Date.now()}`,
        course_id: newModule.course_id || '',
        title: newModule.title || '',
        description: newModule.description || null,
        position: newModule.position || 0,
        xp_reward: newModule.xp_reward || 0,
      };
      return [...(old || []), tempModule];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course'] });
    },
    successMessage: 'Módulo criado!',
    errorMessage: 'Erro ao criar módulo',
  });
}

// Hook para criar aula - MIGRADO PARA useOptimisticMutation
export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useOptimisticMutation<Lesson[], Partial<Lesson>, Lesson>({
    queryKey: ['lessons'],
    mutationFn: async (lesson) => {
      const { data, error } = await supabase
        .from('lessons')
        .insert(lesson as any)
        .select()
        .single();

      if (error) throw error;
      return data as Lesson;
    },
    optimisticUpdate: (old, newLesson) => {
      const tempLesson: Lesson = {
        id: `temp-${Date.now()}`,
        module_id: newLesson.module_id || '',
        title: newLesson.title || '',
        description: newLesson.description || null,
        video_url: newLesson.video_url || null,
        content: newLesson.content || null,
        duration_minutes: newLesson.duration_minutes || 0,
        position: newLesson.position || 0,
        xp_reward: newLesson.xp_reward || 0,
        is_free: newLesson.is_free || false,
      };
      return [...(old || []), tempLesson];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course'] });
    },
    successMessage: 'Aula criada!',
    errorMessage: 'Erro ao criar aula',
  });
}
