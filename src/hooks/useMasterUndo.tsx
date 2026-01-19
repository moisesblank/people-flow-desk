// ============================================
// MOISÉS MEDEIROS v15.0 - MASTER UNDO SYSTEM
// Sistema de desfazer ações do Owner
// Ctrl+Z personalizado com histórico
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGodMode } from '@/stores/godModeStore';
import { formatError } from '@/lib/utils/formatError';

interface UndoAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  entityType: string;
  entityId: string;
  previousData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  timestamp: number;
  description: string;
}

const MAX_UNDO_HISTORY = 50;

export function useMasterUndo() {
  const { isOwner, isActive } = useGodMode();
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoAction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Carregar histórico do localStorage
  useEffect(() => {
    if (isOwner) {
      const saved = localStorage.getItem('mm_undo_history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Limpar ações antigas (mais de 24h)
          const validActions = parsed.filter((a: UndoAction) => 
            Date.now() - a.timestamp < 24 * 60 * 60 * 1000
          );
          setUndoStack(validActions);
        } catch {
          // Ignorar erro
        }
      }
    }
  }, [isOwner]);

  // Salvar histórico no localStorage
  useEffect(() => {
    if (isOwner && undoStack.length > 0) {
      localStorage.setItem('mm_undo_history', JSON.stringify(undoStack.slice(-MAX_UNDO_HISTORY)));
    }
  }, [undoStack, isOwner]);

  // Registrar ação para undo
  const registerAction = useCallback((action: Omit<UndoAction, 'id' | 'timestamp'>) => {
    if (!isOwner) return;

    const newAction: UndoAction = {
      ...action,
      id: `undo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setUndoStack(prev => [...prev.slice(-MAX_UNDO_HISTORY + 1), newAction]);
    setRedoStack([]); // Limpar redo ao fazer nova ação
    
    console.log('🔄 Ação registrada para undo:', newAction.description);
  }, [isOwner]);

  // Executar undo
  const undo = useCallback(async (): Promise<boolean> => {
    if (!isOwner || undoStack.length === 0 || isProcessing) {
      if (undoStack.length === 0) {
        toast.info('Nada para desfazer', { description: 'Histórico vazio' });
      }
      return false;
    }

    setIsProcessing(true);
    const action = undoStack[undoStack.length - 1];

    try {
      switch (action.type) {
        case 'create':
          // Desfazer criação = deletar
          const { error: deleteError } = await supabase
            .from(action.table as any)
            .delete()
            .eq('id', action.entityId);
          
          if (deleteError) throw deleteError;
          break;

        case 'delete':
          // Desfazer exclusão = recriar
          if (action.previousData) {
            const { error: insertError } = await supabase
              .from(action.table as any)
              .insert(action.previousData as never);
            
            if (insertError) throw insertError;
          }
          break;

        case 'update':
          // Desfazer update = restaurar dados anteriores
          if (action.previousData) {
            const { error: updateError } = await supabase
              .from(action.table as any)
              .update(action.previousData as never)
              .eq('id', action.entityId);
            
            if (updateError) throw updateError;
          }
          break;
      }

      // Mover para redo stack
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, action]);

      toast.success('↩️ Ação desfeita!', {
        description: action.description
      });

      // Emitir evento para atualizar UI
      window.dispatchEvent(new CustomEvent('master-undo', { detail: action }));
      window.dispatchEvent(new CustomEvent('global-sync'));

      return true;
    } catch (error: any) {
      console.error('Erro ao desfazer:', error);
      toast.error('Erro ao desfazer', { description: error.message });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [isOwner, undoStack, isProcessing]);

  // Executar redo
  const redo = useCallback(async (): Promise<boolean> => {
    if (!isOwner || redoStack.length === 0 || isProcessing) {
      if (redoStack.length === 0) {
        toast.info('Nada para refazer', { description: 'Histórico vazio' });
      }
      return false;
    }

    setIsProcessing(true);
    const action = redoStack[redoStack.length - 1];

    try {
      switch (action.type) {
        case 'create':
          // Refazer criação = inserir novamente
          if (action.newData) {
            const { error: insertError } = await supabase
              .from(action.table as any)
              .insert(action.newData as never);
            
            if (insertError) throw insertError;
          }
          break;

        case 'delete':
          // Refazer exclusão = deletar
          const { error: deleteError } = await supabase
            .from(action.table as any)
            .delete()
            .eq('id', action.entityId);
          
          if (deleteError) throw deleteError;
          break;

        case 'update':
          // Refazer update = aplicar nova data
          if (action.newData) {
            const { error: updateError } = await supabase
              .from(action.table as any)
              .update(action.newData as never)
              .eq('id', action.entityId);
            
            if (updateError) throw updateError;
          }
          break;
      }

      // Mover para undo stack
      setRedoStack(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, action]);

      toast.success('↪️ Ação refeita!', {
        description: action.description
      });

      window.dispatchEvent(new CustomEvent('master-redo', { detail: action }));
      window.dispatchEvent(new CustomEvent('global-sync'));

      return true;
    } catch (error: any) {
      console.error('Erro ao refazer:', error);
      toast.error('Erro ao refazer', { description: error.message });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [isOwner, redoStack, isProcessing]);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
    localStorage.removeItem('mm_undo_history');
    toast.success('Histórico limpo');
  }, []);

  // Listener para atalhos de teclado
  useEffect(() => {
    if (!isOwner || !isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z = Undo
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      
      // Ctrl+Shift+Z ou Ctrl+Y = Redo
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z') || 
          (e.ctrlKey && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOwner, isActive, undo, redo]);

  // Listener para registrar ações automaticamente
  useEffect(() => {
    if (!isOwner) return;

    const handleItemAdded = (e: CustomEvent) => {
      const { table, data, entityType } = e.detail;
      registerAction({
        type: 'create',
        table,
        entityType,
        entityId: data?.id,
        previousData: null,
        newData: data,
        description: `Criado: ${data?.title || data?.nome || data?.name || 'Item'}`
      });
    };

    const handleItemRemoved = (e: CustomEvent) => {
      const { table, entityType, entityId, originalData } = e.detail;
      registerAction({
        type: 'delete',
        table,
        entityType,
        entityId,
        previousData: originalData,
        newData: null,
        description: `Removido: ${originalData?.title || originalData?.nome || originalData?.name || 'Item'}`
      });
    };

    const handleItemUpdated = (e: CustomEvent) => {
      const { table, entityType, entityId, previousData, newData } = e.detail;
      registerAction({
        type: 'update',
        table,
        entityType,
        entityId,
        previousData,
        newData,
        description: `Atualizado: ${newData?.title || newData?.nome || newData?.name || 'Item'}`
      });
    };

    window.addEventListener('master-item-added', handleItemAdded as EventListener);
    window.addEventListener('master-item-removed', handleItemRemoved as EventListener);
    window.addEventListener('master-item-updated', handleItemUpdated as EventListener);

    return () => {
      window.removeEventListener('master-item-added', handleItemAdded as EventListener);
      window.removeEventListener('master-item-removed', handleItemRemoved as EventListener);
      window.removeEventListener('master-item-updated', handleItemUpdated as EventListener);
    };
  }, [isOwner, registerAction]);

  return {
    undo,
    redo,
    registerAction,
    clearHistory,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoCount: undoStack.length,
    redoCount: redoStack.length,
    lastAction: undoStack[undoStack.length - 1] || null,
    isProcessing
  };
}
