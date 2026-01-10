// ============================================
// 🗑️ ANIQUILAÇÃO DE LOTE DE IMPORTAÇÃO
// Hook para excluir permanentemente todas as questões de um lote
// ============================================

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AnnihilationResult {
  success: boolean;
  deleted_count: number;
  history_deleted: boolean;
  question_ids?: string[];
  file_names?: string[];
  error?: string;
  message?: string;
}

export function useImportBatchAnnihilation() {
  const [isAnnihilating, setIsAnnihilating] = useState(false);
  const [lastResult, setLastResult] = useState<AnnihilationResult | null>(null);
  const queryClient = useQueryClient();

  const annihilateBatch = useCallback(async (importHistoryId: string): Promise<AnnihilationResult> => {
    setIsAnnihilating(true);
    setLastResult(null);

    try {
      console.log('[ANNIHILATION] Iniciando aniquilação do lote:', importHistoryId);

      const { data, error } = await supabase.rpc('annihilate_import_batch', {
        p_import_history_id: importHistoryId
      });

      if (error) {
        console.error('[ANNIHILATION] Erro RPC:', error);
        const result: AnnihilationResult = {
          success: false,
          deleted_count: 0,
          history_deleted: false,
          error: error.message
        };
        setLastResult(result);
        toast.error('Erro ao aniquilar lote', { description: error.message });
        return result;
      }

      const result = data as unknown as AnnihilationResult;
      setLastResult(result);

      if (result.success) {
        console.log('[ANNIHILATION] Sucesso:', result);
        
        // Invalidar todas as queries relacionadas a questões
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['questions'] }),
          queryClient.invalidateQueries({ queryKey: ['quiz_questions'] }),
          queryClient.invalidateQueries({ queryKey: ['quizzes'] }),
          queryClient.invalidateQueries({ queryKey: ['import-history'] }),
          queryClient.invalidateQueries({ queryKey: ['gestao-questoes'] }),
          queryClient.invalidateQueries({ queryKey: ['question-stats'] }),
        ]);

        toast.success(`🗑️ ${result.deleted_count} questões aniquiladas`, {
          description: result.file_names?.join(', ') || 'Lote removido com sucesso',
          duration: 5000,
        });
      } else {
        toast.error('Falha na aniquilação', { description: result.error || result.message });
      }

      return result;
    } catch (err) {
      console.error('[ANNIHILATION] Exceção:', err);
      const result: AnnihilationResult = {
        success: false,
        deleted_count: 0,
        history_deleted: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      };
      setLastResult(result);
      toast.error('Erro inesperado', { description: result.error });
      return result;
    } finally {
      setIsAnnihilating(false);
    }
  }, [queryClient]);

  return {
    annihilateBatch,
    isAnnihilating,
    lastResult,
  };
}
