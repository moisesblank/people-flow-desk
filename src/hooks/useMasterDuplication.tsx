// ============================================
// MOISÉS MEDEIROS v10.0 - MASTER DUPLICATION HOOK
// Sistema Universal de Duplicação para Owner
// ============================================

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdminCheck } from '@/hooks/useAdminCheck';

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
  | 'income';

interface DuplicationOptions {
  includeAttachments?: boolean;
  includeRelatedItems?: boolean;
  newName?: string;
  deepCopy?: boolean;
}

interface DuplicationResult {
  success: boolean;
  newId?: string;
  message: string;
  duplicatedItems?: number;
}

// Mapeamento de entidades para suas tabelas e relações
const ENTITY_CONFIG: Record<DuplicableEntityType, {
  table: string;
  nameField: string;
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
    attachmentType: 'lesson'
  },
  module: {
    table: 'modules',
    nameField: 'title',
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
    table: 'contas_pagar',
    nameField: 'descricao',
    attachmentType: 'transaction'
  },
  income: {
    table: 'contas_receber',
    nameField: 'descricao',
    attachmentType: 'transaction'
  },
};

export function useMasterDuplication() {
  const [isDuplicating, setIsDuplicating] = useState(false);
  const { isGodMode, isOwner } = useAdminCheck();

  const canDuplicate = isGodMode || isOwner;

  // Função auxiliar para executar queries dinâmicas via RPC
  const executeQuery = async (table: string, operation: 'select' | 'insert', params: Record<string, unknown>) => {
    // Usar supabase.rpc ou queries diretas com type assertion
    const client = supabase as unknown as {
      from: (t: string) => {
        select: (s: string) => { eq: (k: string, v: unknown) => { single: () => Promise<{ data: unknown; error: unknown }> } };
        insert: (d: unknown) => { select: () => { single: () => Promise<{ data: unknown; error: unknown }> } };
      }
    };

    if (operation === 'select') {
      return client.from(table).select('*').eq('id', params.id).single();
    }
    return client.from(table).insert(params.data).select().single();
  };

  const duplicateEntity = async (
    entityType: DuplicableEntityType,
    entityId: string,
    options: DuplicationOptions = {}
  ): Promise<DuplicationResult> => {
    if (!canDuplicate) {
      return {
        success: false,
        message: 'Apenas o owner pode duplicar itens'
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
      // 1. Buscar item original
      const { data: originalData, error: fetchError } = await executeQuery(config.table, 'select', { id: entityId });

      if (fetchError || !originalData) {
        throw new Error(`Item não encontrado: ${(fetchError as Error)?.message || 'Não encontrado'}`);
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

      // 3. Inserir item duplicado
      const { data: insertedData, error: insertError } = await executeQuery(config.table, 'insert', { data: newData });

      if (insertError || !insertedData) {
        throw new Error(`Erro ao duplicar: ${(insertError as Error)?.message || 'Erro desconhecido'}`);
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

      // 5. Log da ação
      await supabase.from('activity_log').insert({
        action: 'MASTER_DUPLICATE',
        table_name: config.table,
        record_id: String(newItem.id),
        old_value: { original_id: entityId } as never,
        new_value: { 
          new_id: newItem.id, 
          duplicated_items: duplicatedCount,
          options 
        } as never
      });

      toast.success(`${originalName} duplicado com sucesso!`, {
        description: `${duplicatedCount} item(s) duplicado(s)`
      });

      return {
        success: true,
        newId: String(newItem.id),
        message: 'Duplicação concluída com sucesso',
        duplicatedItems: duplicatedCount
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
  };

  // Duplicação em lote
  const duplicateMultiple = async (
    items: { entityType: DuplicableEntityType; entityId: string }[],
    options: DuplicationOptions = {}
  ): Promise<DuplicationResult[]> => {
    const results: DuplicationResult[] = [];
    
    for (const item of items) {
      const result = await duplicateEntity(item.entityType, item.entityId, options);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    toast.success(`${successCount}/${items.length} itens duplicados`);

    return results;
  };

  return {
    duplicateEntity,
    duplicateMultiple,
    isDuplicating,
    canDuplicate,
    supportedTypes: Object.keys(ENTITY_CONFIG) as DuplicableEntityType[]
  };
}
