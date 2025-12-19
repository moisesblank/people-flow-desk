// ============================================
// MOISÉS MEDEIROS v13.0 - MASTER ACTIONS HOOK
// Hook unificado para todas as ações do MASTER MODE
// Adicionar, Duplicar, Remover com confirmação
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useMasterRemove } from './useMasterRemove';
import { useMasterDuplication } from './useMasterDuplication';

const OWNER_EMAIL = 'moisesblank@gmail.com';

export type MasterActionType = 'add' | 'duplicate' | 'remove';

interface PendingAction {
  type: MasterActionType;
  entityType: string;
  entityId?: string;
  data?: Record<string, unknown>;
  element?: HTMLElement;
  preview?: {
    title: string;
    description: string;
    affectedItems?: string[];
  };
}

interface ActionResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export function useMasterActions() {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, role } = useAuth();
  const { removeEntity, getRemovePreview } = useMasterRemove();
  const { duplicateEntity } = useMasterDuplication();

  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL && role === 'owner';

  // Preparar ação de ADICIONAR
  const prepareAdd = useCallback(async (
    entityType: string,
    data: Record<string, unknown>
  ): Promise<void> => {
    if (!isOwner) {
      toast.error('Acesso negado');
      return;
    }

    setPendingAction({
      type: 'add',
      entityType,
      data,
      preview: {
        title: `Adicionar ${entityType}`,
        description: `Um novo item será criado no sistema.`,
        affectedItems: Object.entries(data)
          .filter(([_, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${k}: ${String(v).slice(0, 50)}`)
      }
    });
  }, [isOwner]);

  // Preparar ação de DUPLICAR
  const prepareDuplicate = useCallback(async (
    entityType: string,
    entityId: string,
    element?: HTMLElement
  ): Promise<void> => {
    if (!isOwner) {
      toast.error('Acesso negado');
      return;
    }

    setPendingAction({
      type: 'duplicate',
      entityType,
      entityId,
      element,
      preview: {
        title: `Duplicar ${entityType}`,
        description: 'O item será copiado com todas as suas associações.',
        affectedItems: ['Item original', 'Anexos (se houver)', 'Metadados']
      }
    });
  }, [isOwner]);

  // Preparar ação de REMOVER
  const prepareRemove = useCallback(async (
    entityType: string,
    entityId: string,
    element?: HTMLElement
  ): Promise<void> => {
    if (!isOwner) {
      toast.error('Acesso negado');
      return;
    }

    // Obter preview do que será removido
    const preview = await getRemovePreview(entityType, entityId);

    setPendingAction({
      type: 'remove',
      entityType,
      entityId,
      element,
      preview: {
        title: `Remover "${preview.entityName}"`,
        description: `${preview.totalItems} itens serão removidos permanentemente.`,
        affectedItems: preview.affectedItems
      }
    });
  }, [isOwner, getRemovePreview]);

  // Confirmar ação (SALVAR)
  const confirmAction = useCallback(async (): Promise<ActionResult> => {
    if (!pendingAction || !isOwner) {
      return { success: false, message: 'Nenhuma ação pendente ou sem permissão' };
    }

    setIsProcessing(true);

    try {
      let result: ActionResult;

      switch (pendingAction.type) {
        case 'add': {
          // Adicionar novo item
          const tableMap: Record<string, string> = {
            course: 'courses',
            employee: 'employees',
            task: 'tasks',
            transaction: 'transactions',
            aluno: 'alunos',
            campaign: 'marketing_campaigns',
            affiliate: 'affiliates',
            document: 'general_documents',
            calendar_task: 'calendar_tasks',
            conta_pagar: 'contas_pagar',
            conta_receber: 'contas_receber',
            alerta: 'alertas_sistema',
            dev_task: 'dev_tasks',
          };

          const table = tableMap[pendingAction.entityType] || pendingAction.entityType;
          const dataToInsert = { ...pendingAction.data };

          // Adicionar user_id se necessário
          if (['tasks', 'calendar_tasks', 'transactions'].includes(table) && user) {
            dataToInsert.user_id = user.id;
          }

          const { data, error } = await supabase
            .from(table as 'courses')
            .insert(dataToInsert as never)
            .select()
            .single();

          if (error) throw error;

          // Emitir evento
          window.dispatchEvent(new CustomEvent('master-item-added', {
            detail: { table, data, entityType: pendingAction.entityType }
          }));

          result = {
            success: true,
            message: 'Item adicionado com sucesso',
            data: data as Record<string, unknown>
          };
          break;
        }

        case 'duplicate': {
          if (!pendingAction.entityId) {
            throw new Error('ID da entidade não fornecido');
          }

          const dupResult = await duplicateEntity(
            pendingAction.entityType as any,
            pendingAction.entityId,
            { includeAttachments: true }
          );

          result = {
            success: dupResult.success,
            message: dupResult.message,
            data: dupResult.newData
          };
          break;
        }

        case 'remove': {
          if (!pendingAction.entityId) {
            throw new Error('ID da entidade não fornecido');
          }

          const removeResult = await removeEntity(
            pendingAction.entityType,
            pendingAction.entityId
          );

          // Animar remoção visual
          if (pendingAction.element && removeResult.success) {
            pendingAction.element.style.transition = 'all 0.3s ease';
            pendingAction.element.style.opacity = '0';
            pendingAction.element.style.transform = 'scale(0.8)';
            setTimeout(() => pendingAction.element?.remove(), 300);
          }

          result = {
            success: removeResult.success,
            message: removeResult.message
          };
          break;
        }

        default:
          result = { success: false, message: 'Ação desconhecida' };
      }

      // Forçar sincronização global
      window.dispatchEvent(new CustomEvent('global-sync'));

      setPendingAction(null);
      return result;

    } catch (error: any) {
      console.error('Erro ao executar ação:', error);
      toast.error('Erro ao executar ação', { description: error.message });
      return { success: false, message: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, [pendingAction, isOwner, user, duplicateEntity, removeEntity]);

  // Cancelar ação (NÃO SALVAR)
  const cancelAction = useCallback((): void => {
    if (pendingAction?.element) {
      // Restaurar estado visual se houver
      pendingAction.element.style.opacity = '1';
      pendingAction.element.style.transform = 'none';
    }
    setPendingAction(null);
    toast.info('Ação cancelada');
  }, [pendingAction]);

  // Limpar ação pendente
  const clearPending = useCallback((): void => {
    setPendingAction(null);
  }, []);

  return {
    // Estado
    pendingAction,
    isProcessing,
    isOwner,
    hasPendingAction: !!pendingAction,

    // Preparar ações
    prepareAdd,
    prepareDuplicate,
    prepareRemove,

    // Confirmar/Cancelar
    confirmAction,
    cancelAction,
    clearPending,

    // Constantes
    OWNER_EMAIL
  };
}
