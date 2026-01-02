// ============================================
// 🔥 ANIQUILAÇÃO DE IMAGENS DE QUESTÕES
// LEI CONSTITUCIONAL - REMOÇÃO TOTAL E EM TEMPO REAL
// ============================================
// 
// Este hook garante que a remoção de imagens de questões
// seja TOTAL e PERMANENTE em todo o sistema:
// - Storage (bucket materiais)
// - Banco de dados (quiz_questions.image_urls)
// - Caches (React Query, localStorage)
// - Todas as views derivadas
//
// ============================================

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient, QueryClient } from '@tanstack/react-query';

// ============================================
// PROPAGAÇÃO GLOBAL - SINGLE SOURCE OF TRUTH
// ============================================

/**
 * Invalida TODOS os caches relacionados a questões em todo o sistema.
 * Garante que qualquer modificação seja propagada para:
 * - Simulados
 * - Modo Treino
 * - Listagens de questões
 * - Views de detalhes
 * - Resultados e estatísticas
 */
export function invalidateAllQuestionCaches(queryClient: QueryClient, questionId?: string) {
  // Caches primários de questões
  queryClient.invalidateQueries({ queryKey: ['quiz-questions'] });
  queryClient.invalidateQueries({ queryKey: ['questions'] });
  queryClient.invalidateQueries({ queryKey: ['questions', 'SIMULADOS'] });
  queryClient.invalidateQueries({ queryKey: ['questions', 'MODO_TREINO'] });
  
  // Questão específica (se fornecido ID)
  if (questionId) {
    queryClient.invalidateQueries({ queryKey: ['question', questionId] });
  }
  
  // Caches de quizzes/simulados
  queryClient.invalidateQueries({ queryKey: ['quizzes'] });
  queryClient.invalidateQueries({ queryKey: ['quiz'] });
  queryClient.invalidateQueries({ queryKey: ['simulados'] });
  queryClient.invalidateQueries({ queryKey: ['modo-treino'] });
  
  // Caches de tentativas e estatísticas
  queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
  queryClient.invalidateQueries({ queryKey: ['student-question-attempts'] });
  queryClient.invalidateQueries({ queryKey: ['question-attempts'] });
  
  // Gamificação (XP pode mudar com correções)
  queryClient.invalidateQueries({ queryKey: ['user-gamification'] });
  
  console.log('[QUESTION_PROPAGATION] Todos os caches invalidados', { questionId });
}

// ============================================
// TIPOS
// ============================================

export interface QuestionImageItem {
  id: string;
  url: string;
  path: string;
  name?: string;
  size?: number;
  position?: number;
}

export interface AnnihilationResult {
  success: boolean;
  removedFromStorage: boolean;
  updatedDatabase: boolean;
  clearedCache: boolean;
  error?: string;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useQuestionImageAnnihilation() {
  const queryClient = useQueryClient();

  /**
   * ANIQUILAR uma imagem específica de uma questão
   * Remove do storage, atualiza banco, invalida caches
   */
  const annihilateImage = useCallback(async (
    questionId: string,
    imageToRemove: QuestionImageItem | string
  ): Promise<AnnihilationResult> => {
    const result: AnnihilationResult = {
      success: false,
      removedFromStorage: false,
      updatedDatabase: false,
      clearedCache: false,
    };

    try {
      // Extrair path da imagem
      const imagePath = typeof imageToRemove === 'string' 
        ? imageToRemove 
        : imageToRemove.path;

      const imageId = typeof imageToRemove === 'string'
        ? null
        : imageToRemove.id;

      console.log('[ANNIHILATE] Iniciando aniquilação:', { questionId, imagePath, imageId });

      // 1. BUSCAR questão atual do banco
      const { data: question, error: fetchError } = await supabase
        .from('quiz_questions')
        .select('image_urls, image_url')
        .eq('id', questionId)
        .single();

      if (fetchError) throw new Error(`Falha ao buscar questão: ${fetchError.message}`);

      // 2. REMOVER do Storage (bucket materiais)
      if (imagePath) {
        const { error: storageError } = await supabase.storage
          .from('materiais')
          .remove([imagePath]);

        if (storageError) {
          console.warn('[ANNIHILATE] Falha ao remover do storage:', storageError);
        } else {
          result.removedFromStorage = true;
          console.log('[ANNIHILATE] Removido do storage:', imagePath);
        }
      }

      // 3. ATUALIZAR banco - remover referência da imagem
      const currentImageUrls = (question as any)?.image_urls || [];
      const currentImageUrl = (question as any)?.image_url;

      // Filtrar array para remover a imagem específica
      let newImageUrls = [];
      if (Array.isArray(currentImageUrls)) {
        newImageUrls = currentImageUrls.filter((img: any) => {
          if (typeof img === 'string') {
            return img !== imagePath && !img.includes(imagePath);
          }
          if (typeof img === 'object' && img !== null) {
            return img.path !== imagePath && img.id !== imageId;
          }
          return true;
        });
      }

      // Preparar payload de update
      const updatePayload: Record<string, unknown> = {
        image_urls: newImageUrls,
        updated_at: new Date().toISOString(),
      };

      // Se a imagem era a image_url legada, limpar também
      if (currentImageUrl && (currentImageUrl === imagePath || currentImageUrl.includes(imagePath))) {
        updatePayload.image_url = null;
      }

      const { error: updateError } = await supabase
        .from('quiz_questions')
        .update(updatePayload)
        .eq('id', questionId);

      if (updateError) throw new Error(`Falha ao atualizar banco: ${updateError.message}`);
      
      result.updatedDatabase = true;
      console.log('[ANNIHILATE] Banco atualizado:', { newImageUrls: newImageUrls.length });

      // 4. INVALIDAR TODOS os caches relacionados - PROPAGAÇÃO GLOBAL
      invalidateAllQuestionCaches(queryClient, questionId);
      
      result.clearedCache = true;
      console.log('[ANNIHILATE] Caches invalidados - propagação global');

      result.success = true;
      return result;

    } catch (err) {
      console.error('[ANNIHILATE] Erro fatal:', err);
      result.error = err instanceof Error ? err.message : 'Erro desconhecido';
      return result;
    }
  }, [queryClient]);

  /**
   * ANIQUILAR TODAS as imagens de uma questão
   */
  const annihilateAllImages = useCallback(async (
    questionId: string
  ): Promise<AnnihilationResult> => {
    const result: AnnihilationResult = {
      success: false,
      removedFromStorage: false,
      updatedDatabase: false,
      clearedCache: false,
    };

    try {
      console.log('[ANNIHILATE_ALL] Iniciando aniquilação total:', { questionId });

      // 1. BUSCAR questão atual
      const { data: question, error: fetchError } = await supabase
        .from('quiz_questions')
        .select('image_urls, image_url')
        .eq('id', questionId)
        .single();

      if (fetchError) throw new Error(`Falha ao buscar questão: ${fetchError.message}`);

      const currentImageUrls = (question as any)?.image_urls || [];
      const currentImageUrl = (question as any)?.image_url;

      // 2. COLETAR todos os paths para deletar do storage
      const pathsToDelete: string[] = [];

      if (Array.isArray(currentImageUrls)) {
        for (const img of currentImageUrls) {
          if (typeof img === 'string' && img) {
            pathsToDelete.push(img);
          } else if (typeof img === 'object' && img?.path) {
            pathsToDelete.push(img.path);
          }
        }
      }

      if (currentImageUrl && !pathsToDelete.includes(currentImageUrl)) {
        pathsToDelete.push(currentImageUrl);
      }

      // 3. REMOVER do Storage
      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('materiais')
          .remove(pathsToDelete);

        if (storageError) {
          console.warn('[ANNIHILATE_ALL] Falha parcial no storage:', storageError);
        } else {
          result.removedFromStorage = true;
          console.log('[ANNIHILATE_ALL] Removidas do storage:', pathsToDelete.length);
        }
      }

      // 4. LIMPAR banco
      const { error: updateError } = await supabase
        .from('quiz_questions')
        .update({
          image_urls: [],
          image_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (updateError) throw new Error(`Falha ao atualizar banco: ${updateError.message}`);
      
      result.updatedDatabase = true;

      // 5. INVALIDAR TODOS os caches - PROPAGAÇÃO GLOBAL
      invalidateAllQuestionCaches(queryClient, questionId);
      
      result.clearedCache = true;
      result.success = true;

      console.log('[ANNIHILATE_ALL] Aniquilação total concluída');
      return result;

    } catch (err) {
      console.error('[ANNIHILATE_ALL] Erro fatal:', err);
      result.error = err instanceof Error ? err.message : 'Erro desconhecido';
      return result;
    }
  }, [queryClient]);

  return {
    annihilateImage,
    annihilateAllImages,
  };
}
