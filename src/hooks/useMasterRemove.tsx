// ============================================
// MOISÉS MEDEIROS v13.0 - MASTER REMOVE HOOK
// Sistema de remoção total com cascata
// Remove de todas as equivalências e associações
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const OWNER_EMAIL = 'moisesblank@gmail.com';

// Mapeamento de entidades e suas relações para remoção em cascata
const ENTITY_RELATIONS: Record<string, {
  table: string;
  nameField: string;
  relations?: { table: string; foreignKey: string }[];
  attachmentType?: string;
}> = {
  course: {
    table: 'courses',
    nameField: 'title',
    relations: [
      { table: 'modules', foreignKey: 'course_id' },
      { table: 'lessons', foreignKey: 'course_id' },
      { table: 'quizzes', foreignKey: 'course_id' },
      { table: 'course_enrollments', foreignKey: 'course_id' },
      { table: 'lesson_progress', foreignKey: 'course_id' },
    ],
    attachmentType: 'course'
  },
  module: {
    table: 'modules',
    nameField: 'title',
    relations: [
      { table: 'lessons', foreignKey: 'module_id' },
    ],
    attachmentType: 'module'
  },
  lesson: {
    table: 'lessons',
    nameField: 'title',
    relations: [
      { table: 'lesson_progress', foreignKey: 'lesson_id' },
      { table: 'lesson_comments', foreignKey: 'lesson_id' },
    ],
    attachmentType: 'lesson'
  },
  quiz: {
    table: 'quizzes',
    nameField: 'title',
    relations: [
      { table: 'quiz_questions', foreignKey: 'quiz_id' },
      { table: 'quiz_attempts', foreignKey: 'quiz_id' },
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
  employee: {
    table: 'employees',
    nameField: 'nome',
    relations: [
      { table: 'employee_documents', foreignKey: 'employee_id' },
      { table: 'employee_compensation', foreignKey: 'employee_id' },
    ],
    attachmentType: 'employee'
  },
  affiliate: {
    table: 'affiliates',
    nameField: 'nome',
    relations: [
      { table: 'comissoes', foreignKey: 'afiliado_id' },
    ],
  },
  aluno: {
    table: 'alunos',
    nameField: 'nome',
    relations: [
      { table: 'lesson_progress', foreignKey: 'user_id' },
      { table: 'quiz_attempts', foreignKey: 'user_id' },
    ],
    attachmentType: 'student'
  },
  campaign: {
    table: 'marketing_campaigns',
    nameField: 'name',
    attachmentType: 'campaign'
  },
  document: {
    table: 'general_documents',
    nameField: 'nome',
    attachmentType: 'document'
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
  dev_task: {
    table: 'dev_tasks',
    nameField: 'title',
  },
};

interface RemoveResult {
  success: boolean;
  message: string;
  removedItems: number;
  affectedTables: string[];
}

interface RemovePreview {
  entityName: string;
  affectedItems: string[];
  totalItems: number;
  canRemove: boolean;
  warning?: string;
}

export function useMasterRemove() {
  const [isRemoving, setIsRemoving] = useState(false);
  const { user, role } = useAuth();

  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL && role === 'owner';
  const canRemove = isOwner;

  // Verificar ownership
  const verifyOwnership = useCallback((): boolean => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return false;
    }
    if (user.email?.toLowerCase() !== OWNER_EMAIL) {
      toast.error('Acesso negado', {
        description: 'Apenas o owner pode usar esta funcionalidade'
      });
      return false;
    }
    return true;
  }, [user]);

  // Preview do que será removido
  const getRemovePreview = useCallback(async (
    entityType: string,
    entityId: string
  ): Promise<RemovePreview> => {
    const config = ENTITY_RELATIONS[entityType];
    
    if (!config) {
      return {
        entityName: 'Item',
        affectedItems: [],
        totalItems: 1,
        canRemove: true
      };
    }

    try {
      // Buscar item original
      const { data: original } = await supabase
        .from(config.table as any)
        .select('*')
        .eq('id', entityId)
        .single();

      const entityName = original?.[config.nameField] as string || 'Item';
      const affectedItems: string[] = [`${entityType}: ${entityName}`];
      let totalItems = 1;

      // Buscar itens relacionados
      if (config.relations) {
        for (const relation of config.relations) {
          try {
            const { count } = await supabase
              .from(relation.table as any)
              .select('*', { count: 'exact', head: true })
              .eq(relation.foreignKey, entityId);
            
            if (count && count > 0) {
              affectedItems.push(`${relation.table}: ${count} itens`);
              totalItems += count;
            }
          } catch {
            // Tabela pode não existir
          }
        }
      }

      // Verificar anexos
      if (config.attachmentType) {
        const { count } = await supabase
          .from('universal_attachments')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', config.attachmentType)
          .eq('entity_id', entityId);
        
        if (count && count > 0) {
          affectedItems.push(`Anexos: ${count} arquivos`);
          totalItems += count;
        }
      }

      return {
        entityName,
        affectedItems,
        totalItems,
        canRemove: true
      };
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      return {
        entityName: 'Item',
        affectedItems: [],
        totalItems: 1,
        canRemove: true
      };
    }
  }, []);

  // Remover entidade com todas as relações
  const removeEntity = useCallback(async (
    entityType: string,
    entityId: string
  ): Promise<RemoveResult> => {
    if (!verifyOwnership()) {
      return {
        success: false,
        message: 'Acesso negado - apenas owner',
        removedItems: 0,
        affectedTables: []
      };
    }

    setIsRemoving(true);
    const config = ENTITY_RELATIONS[entityType];
    const affectedTables: string[] = [];
    let removedItems = 0;

    if (!config) {
      setIsRemoving(false);
      return {
        success: false,
        message: `Tipo "${entityType}" não suportado para remoção`,
        removedItems: 0,
        affectedTables: []
      };
    }

    try {
      // 1. Buscar item original para log
      const { data: original } = await supabase
        .from(config.table as any)
        .select('*')
        .eq('id', entityId)
        .single();

      // 2. Remover itens relacionados primeiro (cascade)
      if (config.relations) {
        for (const relation of config.relations) {
          try {
            // Primeiro contar quantos itens serão removidos
            const { count: itemCount } = await supabase
              .from(relation.table as any)
              .select('*', { count: 'exact', head: true })
              .eq(relation.foreignKey, entityId);
            
            // Depois remover
            const { error } = await supabase
              .from(relation.table as any)
              .delete()
              .eq(relation.foreignKey, entityId);
            
            if (!error) {
              affectedTables.push(relation.table);
              removedItems += itemCount || 0;
            }
          } catch {
            // Tabela pode não existir ou não ter dados
          }
        }
      }

      // 3. Remover anexos
      if (config.attachmentType) {
        try {
          // Contar antes de remover
          const { count: attachCount } = await supabase
            .from('universal_attachments')
            .select('*', { count: 'exact', head: true })
            .eq('entity_type', config.attachmentType)
            .eq('entity_id', entityId);
          
          const { error } = await supabase
            .from('universal_attachments')
            .delete()
            .eq('entity_type', config.attachmentType)
            .eq('entity_id', entityId);
          
          if (!error) {
            affectedTables.push('universal_attachments');
            removedItems += attachCount || 0;
          }
        } catch {
          // Sem anexos
        }
      }

      // 4. Remover item principal
      const { error: deleteError } = await supabase
        .from(config.table as any)
        .delete()
        .eq('id', entityId);

      if (deleteError) {
        throw deleteError;
      }

      affectedTables.push(config.table);
      removedItems += 1;

      // 5. Log da ação
      await supabase.from('activity_log').insert({
        action: 'MASTER_REMOVE',
        table_name: config.table,
        record_id: entityId,
        user_id: user?.id,
        user_email: user?.email,
        old_value: original as never,
        new_value: { 
          removed_items: removedItems,
          affected_tables: affectedTables 
        } as never
      });

      // 6. Emitir evento para atualizar UI
      window.dispatchEvent(new CustomEvent('master-item-removed', {
        detail: { 
          entityType, 
          entityId, 
          table: config.table,
          affectedTables,
          removedItems
        }
      }));

      // 7. Forçar recálculo global
      window.dispatchEvent(new CustomEvent('global-sync'));

      toast.success('🗑️ Item removido!', {
        description: `${removedItems} itens removidos de ${affectedTables.length} tabelas`
      });

      return {
        success: true,
        message: 'Remoção concluída com sucesso',
        removedItems,
        affectedTables
      };

    } catch (error: any) {
      console.error('Erro na remoção:', error);
      toast.error('Erro ao remover', { description: error.message });
      
      return {
        success: false,
        message: error.message,
        removedItems,
        affectedTables
      };
    } finally {
      setIsRemoving(false);
    }
  }, [user, verifyOwnership]);

  // Remover múltiplos itens
  const removeMultiple = useCallback(async (
    items: { entityType: string; entityId: string }[]
  ): Promise<RemoveResult[]> => {
    if (!verifyOwnership()) {
      return [{ success: false, message: 'Acesso negado', removedItems: 0, affectedTables: [] }];
    }

    const results: RemoveResult[] = [];
    
    for (const item of items) {
      const result = await removeEntity(item.entityType, item.entityId);
      results.push(result);
    }

    const totalRemoved = results.reduce((sum, r) => sum + r.removedItems, 0);
    toast.success(`${totalRemoved} itens removidos no total`);

    return results;
  }, [removeEntity, verifyOwnership]);

  return {
    removeEntity,
    removeMultiple,
    getRemovePreview,
    isRemoving,
    canRemove,
    isOwner,
    OWNER_EMAIL
  };
}
