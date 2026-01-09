// ============================================
// 📊 MODULE PROGRESS HOOK — SYNAPSE Ω v10.x
// Calcula progresso do módulo baseado no tempo REAL de vídeo assistido
// Fórmula: sum(watch_time_seconds) / sum(video_duration) por módulo
// PERSISTENTE: Dados ficam para sempre no lesson_progress
// ============================================

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ModuleProgressData {
  moduleId: string;
  totalWatchTime: number;      // Tempo total assistido (segundos)
  totalDuration: number;       // Duração total dos vídeos (segundos)
  progressPercent: number;     // 0-100
  lessonsCompleted: number;    // Quantas aulas foram marcadas como completas
  totalLessons: number;        // Total de aulas no módulo
}

interface LessonProgressRow {
  lesson_id: string;
  watch_time_seconds: number | null;
  completed: boolean | null;
}

interface LessonRow {
  id: string;
  module_id: string | null;
  video_duration: number | null;
}

/**
 * Hook para buscar progresso de múltiplos módulos de uma vez
 * Otimizado para performance - uma única query por todos os módulos
 */
export function useModulesProgress(moduleIds: string[]) {
  const { user } = useAuth();
  
  const queryKey = ['modules-progress', user?.id, moduleIds.sort().join(',')];
  
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async (): Promise<Map<string, ModuleProgressData>> => {
      if (!user?.id || moduleIds.length === 0) {
        return new Map();
      }

      // 1. Buscar todas as lessons dos módulos com sua duração
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, module_id, video_duration')
        .in('module_id', moduleIds)
        .eq('is_published', true);

      if (lessonsError) throw lessonsError;

      // 2. Buscar progresso do usuário para essas lessons
      const lessonIds = (lessons || []).map(l => l.id);
      
      let progressData: LessonProgressRow[] = [];
      if (lessonIds.length > 0) {
        const { data: progress, error: progressError } = await supabase
          .from('lesson_progress')
          .select('lesson_id, watch_time_seconds, completed')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);

        if (progressError) throw progressError;
        progressData = progress || [];
      }

      // 3. Criar mapa de progresso por lesson_id
      const progressMap = new Map<string, LessonProgressRow>();
      progressData.forEach(p => {
        progressMap.set(p.lesson_id, p);
      });

      // 4. Agregar por módulo
      const moduleDataMap = new Map<string, {
        totalWatchTime: number;
        totalDuration: number;
        lessonsCompleted: number;
        totalLessons: number;
      }>();

      // Inicializar todos os módulos
      moduleIds.forEach(moduleId => {
        moduleDataMap.set(moduleId, {
          totalWatchTime: 0,
          totalDuration: 0,
          lessonsCompleted: 0,
          totalLessons: 0,
        });
      });

      // Processar lessons
      (lessons || []).forEach((lesson: LessonRow) => {
        const moduleId = lesson.module_id;
        if (!moduleId) return;

        const moduleData = moduleDataMap.get(moduleId);
        if (!moduleData) return;

        const progress = progressMap.get(lesson.id);
        const watchTime = progress?.watch_time_seconds || 0;
        const duration = lesson.video_duration || 0;
        const isCompleted = progress?.completed || false;

        moduleData.totalLessons += 1;
        moduleData.totalDuration += duration;
        moduleData.totalWatchTime += watchTime;
        if (isCompleted) {
          moduleData.lessonsCompleted += 1;
        }
      });

      // 5. Calcular percentual e retornar
      const result = new Map<string, ModuleProgressData>();
      
      moduleDataMap.forEach((data, moduleId) => {
        const progressPercent = data.totalDuration > 0
          ? Math.min(100, Math.round((data.totalWatchTime / data.totalDuration) * 100))
          : 0;

        result.set(moduleId, {
          moduleId,
          totalWatchTime: data.totalWatchTime,
          totalDuration: data.totalDuration,
          progressPercent,
          lessonsCompleted: data.lessonsCompleted,
          totalLessons: data.totalLessons,
        });
      });

      return result;
    },
    enabled: !!user?.id && moduleIds.length > 0,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    progressMap: data || new Map<string, ModuleProgressData>(),
    isLoading,
    error,
  };
}

/**
 * Hook para buscar progresso de um único módulo
 * Usa o hook de múltiplos internamente
 */
export function useModuleProgress(moduleId: string | null) {
  const moduleIds = useMemo(() => moduleId ? [moduleId] : [], [moduleId]);
  const { progressMap, isLoading, error } = useModulesProgress(moduleIds);

  const progress = moduleId ? progressMap.get(moduleId) : undefined;

  return {
    progress: progress || null,
    isLoading,
    error,
  };
}

/**
 * Formata tempo em formato legível
 */
export function formatWatchTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
}
