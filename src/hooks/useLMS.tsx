import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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
// COURSES HOOKS
// ============================================

export function useCourses(options?: { published?: boolean }) {
  return useQuery({
    queryKey: ['courses', options],
    queryFn: async () => {
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
  });
}

export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
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
    enabled: !!courseId,
  });
}

// ============================================
// ENROLLMENTS HOOKS
// ============================================

export function useEnrollments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: async () => {
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
    enabled: !!user?.id,
  });
}

export function useEnrollment(courseId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enrollment', user?.id, courseId],
    queryFn: async () => {
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
    enabled: !!user?.id && !!courseId,
  });
}

export function useEnroll() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment'] });
      toast.success('Matrícula realizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao realizar matrícula', {
        description: error.message,
      });
    },
  });
}

// ============================================
// LESSON PROGRESS HOOKS
// ============================================

export function useLessonProgress(lessonId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lesson-progress', user?.id, lessonId],
    queryFn: async () => {
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
    enabled: !!user?.id && !!lessonId,
  });
}

export function useCourseProgress(courseId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['course-progress', user?.id, courseId],
    queryFn: async () => {
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
    enabled: !!user?.id && !!courseId,
  });
}

export function useUpdateLessonProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lessonId,
      completed,
      watchTimeSeconds,
      lastPositionSeconds,
    }: {
      lessonId: string;
      completed?: boolean;
      watchTimeSeconds?: number;
      lastPositionSeconds?: number;
    }) => {
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
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-progress'] });
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

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (course: Partial<Course>) => {
      const { data, error } = await supabase
        .from('courses')
        .insert(course as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso criado com sucesso!');
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...course }: Partial<Course> & { id: string }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(course)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course'] });
      toast.success('Curso atualizado!');
    },
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (module: Partial<Module>) => {
      const { data, error } = await supabase
        .from('modules')
        .insert(module as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course'] });
      toast.success('Módulo criado!');
    },
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lesson: Partial<Lesson>) => {
      const { data, error } = await supabase
        .from('lessons')
        .insert(lesson as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course'] });
      toast.success('Aula criada!');
    },
  });
}
