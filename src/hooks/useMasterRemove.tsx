// ============================================
// MOISÉS MEDEIROS v16.0 - MASTER REMOVE HOOK ULTIMATE
// Sistema de remoção total com cascata COMPLETA
// Remove de TODAS as equivalências, cruzamentos e ligações
// Exclusão permanente de QUALQUER lugar do banco
// Owner exclusivo: moisesblank@gmail.com
// ============================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { formatError } from '@/lib/utils/formatError';

const OWNER_EMAIL = 'moisesblank@gmail.com';

// Mapeamento COMPLETO de entidades e suas relações para remoção em cascata
const ENTITY_RELATIONS: Record<string, {
  table: string;
  nameField: string;
  relations?: { table: string; foreignKey: string; cascadeDelete?: boolean }[];
  attachmentType?: string;
  crossReferences?: { table: string; column: string }[];
}> = {
  // ========== CURSOS E LMS ==========
  course: {
    table: 'courses',
    nameField: 'title',
    relations: [
      { table: 'modules', foreignKey: 'course_id', cascadeDelete: true },
      { table: 'lessons', foreignKey: 'course_id', cascadeDelete: true },
      { table: 'quizzes', foreignKey: 'course_id', cascadeDelete: true },
      { table: 'course_enrollments', foreignKey: 'course_id', cascadeDelete: true },
      { table: 'lesson_progress', foreignKey: 'course_id', cascadeDelete: true },
      { table: 'certificates', foreignKey: 'course_id', cascadeDelete: true },
    ],
    attachmentType: 'course',
    crossReferences: [
      { table: 'alunos', column: 'curso_id' },
    ]
  },
  module: {
    table: 'modules',
    nameField: 'title',
    relations: [
      { table: 'lessons', foreignKey: 'module_id', cascadeDelete: true },
    ],
    attachmentType: 'module'
  },
  lesson: {
    table: 'lessons',
    nameField: 'title',
    relations: [
      { table: 'lesson_progress', foreignKey: 'lesson_id', cascadeDelete: true },
      { table: 'lesson_comments', foreignKey: 'lesson_id', cascadeDelete: true },
    ],
    attachmentType: 'lesson'
  },
  quiz: {
    table: 'quizzes',
    nameField: 'title',
    relations: [
      { table: 'quiz_questions', foreignKey: 'quiz_id', cascadeDelete: true },
      { table: 'quiz_attempts', foreignKey: 'quiz_id', cascadeDelete: true },
    ],
  },
  
  // ========== TAREFAS ==========
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
  dev_task: {
    table: 'dev_tasks',
    nameField: 'title',
  },
  
  // ========== FINANCEIRO ==========
  transaction: {
    table: 'transactions',
    nameField: 'description',
    attachmentType: 'transaction'
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
  entrada: {
    table: 'entradas',
    nameField: 'descricao',
    attachmentType: 'transaction'
  },
  contabilidade: {
    table: 'contabilidade',
    nameField: 'descricao',
    attachmentType: 'document'
  },
  
  // ========== FUNCIONÁRIOS ==========
  employee: {
    table: 'employees',
    nameField: 'nome',
    relations: [
      { table: 'employee_documents', foreignKey: 'employee_id', cascadeDelete: true },
      { table: 'employee_compensation', foreignKey: 'employee_id', cascadeDelete: true },
      { table: 'time_clock_entries', foreignKey: 'employee_id', cascadeDelete: true },
    ],
    attachmentType: 'employee',
    crossReferences: [
      { table: 'arquivos_universal', column: 'funcionario_id' },
    ]
  },
  
  // ========== AFILIADOS ==========
  affiliate: {
    table: 'affiliates',
    nameField: 'nome',
    relations: [
      { table: 'comissoes', foreignKey: 'afiliado_id', cascadeDelete: true },
    ],
    crossReferences: [
      { table: 'arquivos_universal', column: 'afiliado_id' },
    ]
  },
  
  // ========== ALUNOS ==========
  aluno: {
    table: 'alunos',
    nameField: 'nome',
    relations: [
      { table: 'lesson_progress', foreignKey: 'user_id', cascadeDelete: true },
      { table: 'quiz_attempts', foreignKey: 'user_id', cascadeDelete: true },
      { table: 'course_enrollments', foreignKey: 'user_id', cascadeDelete: true },
      { table: 'certificates', foreignKey: 'user_id', cascadeDelete: true },
      { table: 'comissoes', foreignKey: 'aluno_id', cascadeDelete: true },
    ],
    attachmentType: 'student',
    crossReferences: [
      { table: 'arquivos_universal', column: 'aluno_id' },
      { table: 'transacoes_hotmart_completo', column: 'buyer_email' }, // via email
    ]
  },
  
  // ========== MARKETING ==========
  campaign: {
    table: 'marketing_campaigns',
    nameField: 'name',
    attachmentType: 'campaign'
  },
  lead: {
    table: 'marketing_leads',
    nameField: 'nome',
  },
  whatsapp_lead: {
    table: 'whatsapp_leads',
    nameField: 'nome',
    relations: [
      { table: 'whatsapp_conversation_history', foreignKey: 'lead_id', cascadeDelete: true },
    ],
  },
  
  // ========== DOCUMENTOS ==========
  document: {
    table: 'general_documents',
    nameField: 'nome',
    attachmentType: 'document'
  },
  arquivo: {
    table: 'arquivos',
    nameField: 'nome',
  },
  arquivo_universal: {
    table: 'arquivos_universal',
    nameField: 'nome',
  },
  
  // ========== SISTEMA ==========
  alerta: {
    table: 'alertas_sistema',
    nameField: 'titulo',
  },
  notification: {
    table: 'notifications',
    nameField: 'title',
  },
  webhook: {
    table: 'webhooks_queue',
    nameField: 'event',
  },
  transacao_hotmart: {
    table: 'transacoes_hotmart_completo',
    nameField: 'buyer_name',
  },
  
  // ========== GENÉRICOS ==========
  card: {
    table: 'generic_items',
    nameField: 'name',
  },
  row: {
    table: 'generic_items',
    nameField: 'name',
  },
  item: {
    table: 'generic_items',
    nameField: 'name',
  },
};

interface RemoveResult {
  success: boolean;
  message: string;
  removedItems: number;
  affectedTables: string[];
  entityType: string;
  entityId: string;
}

interface RemovePreview {
  entityName: string;
  affectedItems: string[];
  totalItems: number;
  canRemove: boolean;
  warning?: string;
  crossReferences?: { table: string; count: number }[];
}

export function useMasterRemove() {
  const [isRemoving, setIsRemoving] = useState(false);
  const { user, role } = useAuth();

  // P1-2 FIX: Role como fonte da verdade
  const isOwner = role === 'owner';
  const canRemove = isOwner;

  // Verificar ownership via role
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

  // Preview COMPLETO do que será removido
  const getRemovePreview = useCallback(async (
    entityType: string,
    entityId: string
  ): Promise<RemovePreview> => {
    const config = ENTITY_RELATIONS[entityType];
    
    if (!config) {
      return {
        entityName: 'Item',
        affectedItems: [`⚠️ Tipo "${entityType}" - remoção direta`],
        totalItems: 1,
        canRemove: true,
        warning: 'Tipo não mapeado - será removido diretamente'
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
      const affectedItems: string[] = [`✓ ${entityType}: ${entityName}`];
      let totalItems = 1;
      const crossRefs: { table: string; count: number }[] = [];

      // Buscar itens relacionados (CASCADE)
      if (config.relations) {
        for (const relation of config.relations) {
          try {
            const { count } = await supabase
              .from(relation.table as any)
              .select('*', { count: 'exact', head: true })
              .eq(relation.foreignKey, entityId);
            
            if (count && count > 0) {
              affectedItems.push(`→ ${relation.table}: ${count} item(ns)`);
              totalItems += count;
            }
          } catch {
            // Tabela pode não existir
          }
        }
      }

      // Verificar referências cruzadas
      if (config.crossReferences) {
        for (const ref of config.crossReferences) {
          try {
            const { count } = await supabase
              .from(ref.table as any)
              .select('*', { count: 'exact', head: true })
              .eq(ref.column, entityId);
            
            if (count && count > 0) {
              crossRefs.push({ table: ref.table, count });
              affectedItems.push(`⚡ ${ref.table}: ${count} referência(s)`);
              totalItems += count;
            }
          } catch {
            // Tabela pode não existir
          }
        }
      }

      // Verificar anexos universais
      if (config.attachmentType) {
        const { count } = await supabase
          .from('universal_attachments')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', config.attachmentType)
          .eq('entity_id', entityId);
        
        if (count && count > 0) {
          affectedItems.push(`📎 Anexos: ${count} arquivo(s)`);
          totalItems += count;
        }
      }

      // Verificar arquivos universais
      try {
        const columnMap: Record<string, string> = {
          aluno: 'aluno_id',
          employee: 'funcionario_id',
          affiliate: 'afiliado_id',
          course: 'curso_id',
          lesson: 'aula_id',
        };
        
        const column = columnMap[entityType];
        if (column) {
          const { count } = await supabase
            .from('arquivos_universal')
            .select('*', { count: 'exact', head: true })
            .eq(column as 'aluno_id', entityId);
          
          if (count && count > 0) {
            affectedItems.push(`📁 Arquivos: ${count} arquivo(s)`);
            totalItems += count;
          }
        }
      } catch {
        // Sem arquivos
      }

      return {
        entityName,
        affectedItems,
        totalItems,
        canRemove: true,
        crossReferences: crossRefs.length > 0 ? crossRefs : undefined
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

  // Remover entidade com TODAS as relações - CASCATA COMPLETA
  const removeEntity = useCallback(async (
    entityType: string,
    entityId: string
  ): Promise<RemoveResult> => {
    if (!verifyOwnership()) {
      return {
        success: false,
        message: 'Acesso negado - apenas owner',
        removedItems: 0,
        affectedTables: [],
        entityType,
        entityId
      };
    }

    setIsRemoving(true);
    const config = ENTITY_RELATIONS[entityType];
    const affectedTables: string[] = [];
    let removedItems = 0;

    try {
      // Se não tem config, tentar remover diretamente
      if (!config) {
        console.warn(`[MasterRemove] Tipo "${entityType}" não mapeado, tentando remoção direta`);
        
        // Tentar algumas tabelas comuns
        const possibleTables = [entityType, `${entityType}s`, entityType.replace('_', '')];
        
        for (const table of possibleTables) {
          try {
            const { error } = await supabase
              .from(table as any)
              .delete()
              .eq('id', entityId);
            
            if (!error) {
              affectedTables.push(table);
              removedItems++;
              break;
            }
          } catch {
            continue;
          }
        }

        if (removedItems === 0) {
          throw new Error(`Não foi possível remover item do tipo "${entityType}"`);
        }

        toast.success('🗑️ Item removido!');
        return {
          success: true,
          message: 'Remoção direta concluída',
          removedItems,
          affectedTables,
          entityType,
          entityId
        };
      }

      // 1. Buscar item original para log
      const { data: original } = await supabase
        .from(config.table as any)
        .select('*')
        .eq('id', entityId)
        .single();

      // 2. Remover referências cruzadas primeiro
      if (config.crossReferences) {
        for (const ref of config.crossReferences) {
          try {
            // Atualizar para NULL ao invés de deletar (para manter integridade)
            const { error } = await supabase
              .from(ref.table as any)
              .update({ [ref.column]: null } as any)
              .eq(ref.column, entityId);
            
            if (!error) {
              affectedTables.push(`${ref.table} (refs)`);
            }
          } catch {
            // Continuar mesmo com erro
          }
        }
      }

      // 3. Remover itens relacionados (CASCADE)
      if (config.relations) {
        for (const relation of config.relations) {
          try {
            const { count: itemCount } = await supabase
              .from(relation.table as any)
              .select('*', { count: 'exact', head: true })
              .eq(relation.foreignKey, entityId);
            
            const { error } = await supabase
              .from(relation.table as any)
              .delete()
              .eq(relation.foreignKey, entityId);
            
            if (!error) {
              affectedTables.push(relation.table);
              removedItems += itemCount || 0;
            }
          } catch {
            // Continuar mesmo com erro
          }
        }
      }

      // 4. Remover anexos universais
      if (config.attachmentType) {
        try {
          const { count: attachCount } = await supabase
            .from('universal_attachments')
            .select('*', { count: 'exact', head: true })
            .eq('entity_type', config.attachmentType)
            .eq('entity_id', entityId);
          
          await supabase
            .from('universal_attachments')
            .delete()
            .eq('entity_type', config.attachmentType)
            .eq('entity_id', entityId);
          
          affectedTables.push('universal_attachments');
          removedItems += attachCount || 0;
        } catch {
          // Continuar
        }
      }

      // 5. Remover arquivos universais
      try {
        const columnMap: Record<string, string> = {
          aluno: 'aluno_id',
          employee: 'funcionario_id',
          affiliate: 'afiliado_id',
          course: 'curso_id',
          lesson: 'aula_id',
        };
        
        const column = columnMap[entityType];
        if (column) {
          const { count } = await supabase
            .from('arquivos_universal')
            .select('*', { count: 'exact', head: true })
            .eq(column as 'aluno_id', entityId);

          if (count && count > 0) {
            await supabase
              .from('arquivos_universal')
              .delete()
              .eq(column as 'aluno_id', entityId);

            affectedTables.push('arquivos_universal');
            removedItems += count;
          }
        }
      } catch {
        // Continuar
      }

      // 6. Remover item principal
      const { error: deleteError } = await supabase
        .from(config.table as any)
        .delete()
        .eq('id', entityId);

      if (deleteError) {
        throw deleteError;
      }

      affectedTables.push(config.table);
      removedItems += 1;

      // 7. Log da ação
      await supabase.from('activity_log').insert({
        action: 'MASTER_REMOVE_CASCADE',
        table_name: config.table,
        record_id: entityId,
        user_id: user?.id,
        user_email: user?.email,
        old_value: original as never,
        new_value: { 
          removed_items: removedItems,
          affected_tables: affectedTables,
          cascade_complete: true
        } as never
      });

      // 8. Emitir eventos para atualizar UI
      window.dispatchEvent(new CustomEvent('master-item-removed', {
        detail: { 
          entityType, 
          entityId, 
          table: config.table,
          affectedTables,
          removedItems
        }
      }));

      window.dispatchEvent(new CustomEvent('global-sync'));
      window.dispatchEvent(new CustomEvent('data-invalidate', {
        detail: { tables: affectedTables }
      }));

      toast.success('🗑️ Exclusão permanente concluída!', {
        description: `${removedItems} item(ns) de ${affectedTables.length} tabela(s)`
      });

      return {
        success: true,
        message: 'Remoção em cascata concluída com sucesso',
        removedItems,
        affectedTables,
        entityType,
        entityId
      };

    } catch (error: any) {
      console.error('Erro na remoção:', error);
      const msg = formatError(error);
      toast.error('Erro ao remover', { description: msg });
      
      return {
        success: false,
        message: msg,
        removedItems,
        affectedTables,
        entityType,
        entityId
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
      return [{ 
        success: false, 
        message: 'Acesso negado', 
        removedItems: 0, 
        affectedTables: [],
        entityType: '',
        entityId: ''
      }];
    }

    const results: RemoveResult[] = [];
    
    for (const item of items) {
      const result = await removeEntity(item.entityType, item.entityId);
      results.push(result);
    }

    const totalRemoved = results.reduce((sum, r) => sum + r.removedItems, 0);
    const successCount = results.filter(r => r.success).length;
    
    toast.success(`🗑️ ${successCount}/${items.length} itens removidos`, {
      description: `Total: ${totalRemoved} registros excluídos permanentemente`
    });

    return results;
  }, [removeEntity, verifyOwnership]);

  // Remover por tabela e ID diretamente
  const removeFromTable = useCallback(async (
    tableName: string,
    recordId: string
  ): Promise<RemoveResult> => {
    if (!verifyOwnership()) {
      return {
        success: false,
        message: 'Acesso negado',
        removedItems: 0,
        affectedTables: [],
        entityType: tableName,
        entityId: recordId
      };
    }

    setIsRemoving(true);

    try {
      // Buscar item para log
      const { data: original } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('id', recordId)
        .single();

      // Remover diretamente
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      // Log
      await supabase.from('activity_log').insert({
        action: 'MASTER_DIRECT_REMOVE',
        table_name: tableName,
        record_id: recordId,
        user_id: user?.id,
        user_email: user?.email,
        old_value: original as never,
      });

      toast.success('🗑️ Removido!');

      return {
        success: true,
        message: 'Item removido',
        removedItems: 1,
        affectedTables: [tableName],
        entityType: tableName,
        entityId: recordId
      };

    } catch (error: any) {
      const msg = formatError(error);
      toast.error('Erro ao remover', { description: msg });
      return {
        success: false,
        message: msg,
        removedItems: 0,
        affectedTables: [],
        entityType: tableName,
        entityId: recordId
      };
    } finally {
      setIsRemoving(false);
    }
  }, [user, verifyOwnership]);

  return {
    removeEntity,
    removeMultiple,
    removeFromTable,
    getRemovePreview,
    isRemoving,
    canRemove,
    isOwner,
    OWNER_EMAIL,
    ENTITY_RELATIONS // Exportar para uso em outros lugares
  };
}
