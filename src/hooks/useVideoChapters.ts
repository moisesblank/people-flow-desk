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

  // Verificar se é curso 2025 pelo título
  const checkIf2025Course = useCallback((title: string | null): boolean => {
    if (!title) return false;
    return title.toLowerCase().includes('2025');
  }, []);

  // Buscar capítulos do banco
  const fetchChapters = useCallback(async () => {
    if (!videoId) {
      setChapters([]);
      return;
    }

    // Verificar se é curso 2025
    const is2025 = checkIf2025Course(lessonTitle);
    setIs2025Course(is2025);

    // Se não for 2025, não buscar capítulos
    if (!is2025) {
      setChapters([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('video_chapters')
        .select('*')
        .eq('panda_video_id', videoId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      } else if (data) {
        const chaptersData = (data.chapters as unknown as Chapter[]) || [];
        setChapters(chaptersData);
      } else {
        // Não encontrado - normal para vídeos sem capítulos
        setChapters([]);
      }
    } catch (err: any) {
      console.error('Erro ao buscar capítulos:', err);
      setError(err.message);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  }, [videoId, lessonTitle, checkIf2025Course]);

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
