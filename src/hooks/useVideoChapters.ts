import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Chapter {
  time: string;
  seconds: number;
  title: string;
}

export const useVideoChapters = (videoId: string | null, lessonTitle: string | null) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [is2025Course, setIs2025Course] = useState(false);

  // Verificar se é curso 2025 pelo título (fallback)
  const checkIf2025CourseByTitle = useCallback((title: string | null): boolean => {
    if (!title) return false;
    return title.toLowerCase().includes('2025');
  }, []);

  // Buscar capítulos do banco - SEMPRE busca pelo video_id, ignora verificação de título
  const fetchChapters = useCallback(async () => {
    if (!videoId) {
      setChapters([]);
      setIs2025Course(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Busca diretamente pelo panda_video_id - sem filtrar por título
      const { data, error: fetchError } = await supabase
        .from('video_chapters')
        .select('*')
        .eq('panda_video_id', videoId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      } 
      
      if (data) {
        // Encontrou no banco - usar is_2025_course do registro OU verificar título
        const is2025FromDb = data.is_2025_course === true;
        const is2025FromTitle = checkIf2025CourseByTitle(lessonTitle);
        const shouldShow = is2025FromDb || is2025FromTitle;
        
        setIs2025Course(shouldShow);
        
        if (shouldShow) {
          const chaptersData = (data.chapters as unknown as Chapter[]) || [];
          setChapters(chaptersData);
          console.log(`[Chapters] ✅ ${chaptersData.length} capítulos carregados para ${videoId}`);
        } else {
          setChapters([]);
        }
      } else {
        // Não encontrado no banco - verificar pelo título como fallback
        const is2025 = checkIf2025CourseByTitle(lessonTitle);
        setIs2025Course(is2025);
        setChapters([]);
        
        if (is2025) {
          console.log(`[Chapters] ⚠️ Curso 2025 detectado pelo título, mas sem capítulos no banco: ${videoId}`);
        }
      }
    } catch (err: any) {
      console.error('[Chapters] ❌ Erro ao buscar capítulos:', err);
      setError(err.message);
      setChapters([]);
      setIs2025Course(false);
    } finally {
      setLoading(false);
    }
  }, [videoId, lessonTitle, checkIf2025CourseByTitle]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  return {
    chapters,
    loading,
    error,
    is2025Course,
    hasChapters: chapters.length > 0,
    refetch: fetchChapters
  };
};

export default useVideoChapters;
