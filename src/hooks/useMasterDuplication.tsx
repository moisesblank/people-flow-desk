// ============================================
// MOISÉS MEDEIROS v11.0 - MASTER DUPLICATION HOOK
// Sistema Universal de Duplicação EXCLUSIVO para Owner
// Owner: moisesblank@gmail.com
// ============================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const OWNER_EMAIL = 'moisesblank@gmail.com';

export type DuplicableEntityType = 
  | 'course'
  | 'lesson'
  | 'module'
  | 'quiz'
  | 'task'
  | 'calendar_task'
  | 'transaction'
  | 'campaign'
  | 'automation'
  | 'employee'
  | 'affiliate'
  | 'student'
  | 'document'
  | 'category'
  | 'expense'
  | 'income'
  | 'conta_pagar'
  | 'conta_receber'
  | 'alerta'
  | 'contabilidade';

interface DuplicationOptions {
  includeAttachments?: boolean;
  includeRelatedItems?: boolean;
  newName?: string;
  deepCopy?: boolean;
  insertAfterOriginal?: boolean;
}

interface DuplicationResult {
  success: boolean;
  newId?: string;
  message: string;
  duplicatedItems?: number;
  newData?: Record<string, unknown>;
  originalName?: string;
}

// Mapeamento de entidades para suas tabelas e relações
const ENTITY_CONFIG: Record<DuplicableEntityType, {
  table: string;
  nameField: string;
  orderField?: string;
  relations?: { table: string; foreignKey: string; cascade?: boolean }[];
  attachmentType?: string;
}> = {
  course: {
    table: 'courses',
    nameField: 'title',
    relations: [
      { table: 'modules', foreignKey: 'course_id', cascade: true },
      { table: 'lessons', foreignKey: 'course_id', cascade: true },
      { table: 'quizzes', foreignKey: 'course_id', cascade: true },
    ],
    attachmentType: 'course'
  },
  lesson: {
    table: 'lessons',
    nameField: 'title',
    orderField: 'order_index',
    attachmentType: 'lesson'
  },
  module: {
    table: 'modules',
    nameField: 'title',
    orderField: 'order_index',
    relations: [
      { table: 'lessons', foreignKey: 'module_id', cascade: true },
    ],
    attachmentType: 'module'
  },
  quiz: {
    table: 'quizzes',
    nameField: 'title',
    relations: [
      { table: 'quiz_questions', foreignKey: 'quiz_id', cascade: true },
    ],
  },
  task: {
    table: 'tasks',
    nameField: 'title',
    orderField: 'position',
    attachmentType: 'task'
  },
  calendar_task: {
    table: 'calendar_tasks',
    nameField: 'title',
    attachmentType: 'task'
  },
  transaction: {
    table: 'transactions',
    nameField: 'description',
    attachmentType: 'transaction'
  },
  campaign: {
    table: 'marketing_campaigns',
    nameField: 'name',
    attachmentType: 'campaign'
  },
  automation: {
    table: 'owner_automations',
    nameField: 'nome',
  },
  employee: {
    table: 'employees',
    nameField: 'nome',
    attachmentType: 'employee'
  },
  affiliate: {
    table: 'affiliates',
    nameField: 'nome',
  },
  student: {
    table: 'alunos',
    nameField: 'nome',
    attachmentType: 'student'
  },
  document: {
    table: 'general_documents',
    nameField: 'nome',
    attachmentType: 'document'
  },
  category: {
    table: 'financial_categories',
    nameField: 'name',
  },
  expense: {
    table: 'company_extra_expenses',
    nameField: 'nome',
  },
  income: {
    table: 'entradas',
    nameField: 'descricao',
  },
  conta_pagar: {
    table: 'contas_pagar',
    nameField: 'descricao',
    attachmentType: 'transaction'
  },
  conta_receber: {
    table: 'contas_receber',
    nameField: 'descricao',
    attachmentType: 'transaction'
  },
  alerta: {
    table: 'alertas_sistema',
    nameField: 'titulo',
  },
  contabilidade: {
    table: 'contabilidade',
    nameField: 'descricao',
  },
};

export function useMasterDuplication() {
  const [isDuplicating, setIsDuplicating] = useState(false);
  const { user, role } = useAuth();

  // P1-2 FIX: Role como fonte da verdade
  const isOwner = role === 'owner';
  const canDuplicate = isOwner;

  // Função para verificar se é owner antes de qualquer ação
  const verifyOwnership = useCallback((): boolean => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return false;
    }
    // P1-2 FIX: Verificar apenas role, não email
    if (role !== 'owner') {
      toast.error('Acesso negado', {
        description: 'Apenas o owner pode usar esta funcionalidade'
      });
      return false;
    }
    return true;
  }, [user, role]);

  const duplicateEntity = useCallback(async (
    entityType: DuplicableEntityType,
    entityId: string,
    options: DuplicationOptions = {}
  ): Promise<DuplicationResult> => {
    // Verificação de owner
    if (!verifyOwnership()) {
      return {
        success: false,
        message: 'Acesso negado - apenas owner'
      };
    }

    setIsDuplicating(true);
    const config = ENTITY_CONFIG[entityType];
    
    if (!config) {
      setIsDuplicating(false);
      return {
        success: false,
        message: `Tipo de entidade "${entityType}" não suportado`
      };
    }

    try {
      // 1. Buscar item original usando query dinâmica
      const { data: originalData, error: fetchError } = await supabase
        .from(config.table as 'courses')
        .select('*')
        .eq('id', entityId)
        .single();

      if (fetchError || !originalData) {
        throw new Error(`Item não encontrado: ${fetchError?.message || 'Não encontrado'}`);
      }

      const original = originalData as Record<string, unknown>;

      // 2. Preparar dados para duplicação
      const newData: Record<string, unknown> = { ...original };
      delete newData.id;
      delete newData.created_at;
      delete newData.updated_at;
      
      // Adicionar sufixo ao nome
      const originalName = (newData[config.nameField] as string) || 'Item';
      newData[config.nameField] = options.newName || `${originalName} (Cópia)`;

      // Se tem campo de ordem, incrementar para aparecer logo abaixo
      if (config.orderField && options.insertAfterOriginal !== false) {
        const originalOrder = (original[config.orderField] as number) || 0;
        newData[config.orderField] = originalOrder + 1;
      }

      // 3. Inserir item duplicado
      const { data: insertedData, error: insertError } = await supabase
        .from(config.table as 'courses')
        .insert(newData as never)
        .select()
        .single();

      if (insertError || !insertedData) {
        throw new Error(`Erro ao duplicar: ${insertError?.message || 'Erro desconhecido'}`);
      }

      const newItem = insertedData as Record<string, unknown>;
      let duplicatedCount = 1;

      // 4. Duplicar anexos se habilitado
      if (options.includeAttachments && config.attachmentType) {
        const { data: attachmentsData } = await supabase
          .from('universal_attachments')
          .select('*')
          .eq('entity_type', config.attachmentType)
          .eq('entity_id', entityId);

        if (attachmentsData && attachmentsData.length > 0) {
          for (const attachment of attachmentsData) {
            const newAttachment = { ...attachment } as Record<string, unknown>;
            delete newAttachment.id;
            delete newAttachment.created_at;
            newAttachment.entity_id = String(newItem.id);

            await supabase.from('universal_attachments').insert(newAttachment as never);
            duplicatedCount++;
          }
        }
      }

      // 5. Duplicar itens relacionados se habilitado (simplificado)
      if (options.includeRelatedItems && config.relations) {
        // Log para auditoria
        console.log('Duplicação com itens relacionados solicitada para:', entityType);
      }

      // 6. Log da ação
      await supabase.from('activity_log').insert({
        action: 'MASTER_DUPLICATE',
        table_name: config.table,
        record_id: String(newItem.id),
        user_id: user?.id,
        user_email: user?.email,
        old_value: { original_id: entityId, entity_type: entityType } as never,
        new_value: { 
          new_id: newItem.id, 
          duplicated_items: duplicatedCount,
          options 
        } as never
      });

      toast.success('📋 Item copiado!', {
        description: `"${originalName}" copiado para área de transferência`,
        duration: 5000,
      });

      return {
        success: true,
        newId: String(newItem.id),
        message: 'Duplicação concluída com sucesso',
        duplicatedItems: duplicatedCount,
        newData: newItem,
        originalName
      };

    } catch (error: unknown) {
      const err = error as Error;
      console.error('Erro na duplicação:', err);
      toast.error('Erro ao duplicar', {
        description: err.message
      });
      
      return {
        success: false,
        message: err.message
      };
    } finally {
      setIsDuplicating(false);
    }
  }, [user, verifyOwnership]);

  // Duplicação em lote
  const duplicateMultiple = useCallback(async (
    items: { entityType: DuplicableEntityType; entityId: string }[],
    options: DuplicationOptions = {}
  ): Promise<DuplicationResult[]> => {
    if (!verifyOwnership()) {
      return [{ success: false, message: 'Acesso negado' }];
    }

    const results: DuplicationResult[] = [];
    
    for (const item of items) {
      const result = await duplicateEntity(item.entityType, item.entityId, options);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    toast.success(`${successCount}/${items.length} itens duplicados`);

    return results;
  }, [duplicateEntity, verifyOwnership]);

  // Reordenar itens (para drag-and-drop)
  const reorderItems = useCallback(async (
    entityType: DuplicableEntityType,
    items: { id: string; newOrder: number }[]
  ): Promise<boolean> => {
    if (!verifyOwnership()) return false;

    const config = ENTITY_CONFIG[entityType];
    if (!config || !config.orderField) {
      toast.error('Este tipo não suporta reordenação');
      return false;
    }

    try {
      for (const item of items) {
        await supabase
          .from(config.table as 'courses')
          .update({ [config.orderField]: item.newOrder } as never)
          .eq('id', item.id);
      }

      toast.success('Ordem atualizada!');
      return true;
    } catch (error) {
      console.error('Erro ao reordenar:', error);
      toast.error('Erro ao reordenar');
      return false;
    }
  }, [verifyOwnership]);

  return {
    duplicateEntity,
    duplicateMultiple,
    reorderItems,
    isDuplicating,
    canDuplicate,
    isOwner,
    supportedTypes: Object.keys(ENTITY_CONFIG) as DuplicableEntityType[],
    OWNER_EMAIL
  };
}
