// ============================================
// HOOK: useLessonAI - Conteúdo gerado por IA
// Cache e gerenciamento de conteúdo IA da aula
// Lei I: Cache agressivo | Lei IV: Poder do Arquiteto
// ============================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

type AIContentType = 'summary' | 'flashcards' | 'quiz' | 'mindmap';

interface AIContent {
  id: string;
  lessonId: string;
  contentType: AIContentType;
  content: any;
  modelUsed?: string;
  tokensUsed?: number;
  createdAt: Date;
}

interface UseLessonAIReturn {
  isLoading: boolean;
  error: string | null;
  generateContent: (lessonId: string, type: AIContentType, context?: string) => Promise<any>;
  getCachedContent: (lessonId: string, type: AIContentType) => Promise<AIContent | null>;
}

export function useLessonAI(): UseLessonAIReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCachedContent = useCallback(async (lessonId: string, type: AIContentType): Promise<AIContent | null> => {
    try {
      const { data, error } = await supabase
        .from('ai_generated_content')
        .select('id, lesson_id, content_type, content, model_used, tokens_used, created_at')
        .eq('lesson_id', lessonId)
        .eq('content_type', type)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          id: data.id,
          lessonId: data.lesson_id,
          contentType: data.content_type as AIContentType,
          content: data.content,
          modelUsed: data.model_used || undefined,
          tokensUsed: data.tokens_used || undefined,
          createdAt: new Date(data.created_at)
        };
      }
      
      return null;
    } catch (err) {
      console.error('Erro ao buscar conteúdo IA:', err);
      return null;
    }
  }, []);

  const generateContent = useCallback(async (
    lessonId: string, 
    type: AIContentType, 
    context?: string
  ): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar cache primeiro
      const cached = await getCachedContent(lessonId, type);
      if (cached) {
        return cached.content;
      }

      // Gerar novo conteúdo via Edge Function
      const { data, error } = await supabase.functions.invoke('ai-tutor', {
        body: {
          messages: [{ role: 'user', content: `Gere ${type} para esta aula.` }],
          lessonContext: context,
          mode: type === 'summary' ? 'tutor' : type
        }
      });

      if (error) throw error;

      // Salvar no cache (se a tabela existir)
      try {
        await supabase.from('ai_generated_content').insert([{
          lesson_id: lessonId,
          content_type: type as 'summary' | 'flashcards' | 'quiz' | 'mindmap',
          content: data,
          model_used: 'gemini-2.5-flash'
        }]);
      } catch (cacheError) {
        console.warn('Cache de IA não disponível:', cacheError);
      }

      return data;
    } catch (err: any) {
      const message = err.message || 'Erro ao gerar conteúdo IA';
      setError(message);
      toast({ 
        title: 'Erro', 
        description: message, 
        variant: 'destructive' 
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getCachedContent]);

  return {
    isLoading,
    error,
    generateContent,
    getCachedContent
  };
}

export default useLessonAI;
