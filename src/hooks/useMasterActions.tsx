// ============================================
// MOISÉS MEDEIROS v15.0 - MASTER ACTIONS HOOK ULTIMATE
// Hook unificado para todas as ações do MASTER MODE
// Adicionar, Duplicar, Remover com confirmação
// TODOS os tipos mapeados e funcionais
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
  table?: string;
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

// MAPEAMENTO COMPLETO DE TIPOS PARA TABELAS
const TABLE_MAP: Record<string, string> = {
  // Cursos e LMS
  course: 'courses',
  courses: 'courses',
  cursos: 'courses',
  module: 'modules',
  lesson: 'lessons',
  quiz: 'quizzes',
  quiz_question: 'quiz_questions',
  
  // Funcionários
  employee: 'employees',
  employees: 'employees',
  funcionario: 'employees',
  funcionarios: 'employees',
  equipe: 'employees',
  dev_task: 'dev_tasks',
  
  // Tarefas
  task: 'tasks',
  tasks: 'tasks',
  tarefa: 'tasks',
  calendar_task: 'calendar_tasks',
  tarefas: 'tasks',
  calendario: 'calendar_tasks',
  
  // Financeiro
  transaction: 'transactions',
  transactions: 'transactions',
  financas: 'transactions',
  receita: 'entradas',
  despesa: 'company_extra_expenses',
  gasto_extra: 'company_extra_expenses',
  gasto_fixo: 'company_fixed_expenses',
  conta_pagar: 'company_extra_expenses',
  conta_receber: 'entradas',
  entrada: 'entradas',
  entradas: 'entradas',
  pagamento: 'pagamentos_funcionarios',
  pagamentos: 'pagamentos_funcionarios',
  
  // Alunos
  aluno: 'alunos',
  alunos: 'alunos',
  student: 'alunos',
  
  // Marketing
  campaign: 'marketing_campaigns',
  campanha: 'marketing_campaigns',
  marketing: 'marketing_campaigns',
  affiliate: 'affiliates',
  afiliado: 'affiliates',
  afiliados: 'affiliates',
  
  // Documentos
  document: 'general_documents',
  documento: 'general_documents',
  documentos: 'general_documents',
  arquivo: 'arquivos_universal',
  
  // Alertas
  alerta: 'alertas_sistema',
  alertas: 'alertas_sistema',
  notification: 'notifications',
  
  // Contabilidade
  contabilidade: 'contabilidade',
  
  // Relatórios
  relatorio: 'automated_reports',
  relatorios: 'automated_reports',
  
  // Genéricos - para elementos sem tipo específico
  card: 'generic_items',
  row: 'generic_items',
  item: 'generic_items',
};

// Campos obrigatórios por tabela
const TABLE_REQUIRED_FIELDS: Record<string, Record<string, unknown>> = {
  courses: { title: 'Novo Curso', is_published: false },
  employees: { nome: 'Novo Funcionário', status: 'ativo' },
  tasks: { title: 'Nova Tarefa', status: 'todo' },
  calendar_tasks: { title: 'Novo Evento', task_date: new Date().toISOString().split('T')[0], is_completed: false },
  alunos: { nome: 'Novo Aluno', email: `aluno_${Date.now()}@temp.com`, status: 'ativo' },
  affiliates: { nome: 'Novo Afiliado', status: 'ativo' },
  entradas: { descricao: 'Nova Entrada', valor: 0, data: new Date().toISOString().split('T')[0], fonte: 'manual' },
  company_extra_expenses: { nome: 'Nova Despesa', valor: 0, data: new Date().toISOString().split('T')[0] },
  company_fixed_expenses: { nome: 'Novo Gasto Fixo', valor: 0 },
  marketing_campaigns: { name: 'Nova Campanha', status: 'draft' },
  alertas_sistema: { titulo: 'Novo Alerta', tipo: 'info', mensagem: 'Mensagem', origem: 'manual', destinatarios: ['owner'] },
  general_documents: { nome: 'Novo Documento', categoria: 'geral' },
  modules: { title: 'Novo Módulo' },
  lessons: { title: 'Nova Aula' },
  quizzes: { title: 'Novo Quiz' },
  contabilidade: { descricao: 'Novo Lançamento', valor: 0, data: new Date().toISOString().split('T')[0], tipo: 'despesa' },
  automated_reports: { report_type: 'custom', schedule: 'weekly', is_active: true },
};

export function useMasterActions() {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, role } = useAuth();
  const { removeEntity, getRemovePreview, removeFromTable } = useMasterRemove();
  const { duplicateEntity } = useMasterDuplication();

  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL && role === 'owner';

  // Resolver tabela a partir do tipo
  const resolveTable = useCallback((entityType: string): string => {
    const normalized = entityType.toLowerCase().replace(/[^a-z_]/g, '');
    return TABLE_MAP[normalized] || entityType;
  }, []);

  // Preparar ação de ADICIONAR
  const prepareAdd = useCallback(async (
    entityType: string,
    data: Record<string, unknown>
  ): Promise<void> => {
    if (!isOwner) {
      toast.error('Acesso negado');
      return;
    }

    const table = resolveTable(entityType);
    const defaultFields = TABLE_REQUIRED_FIELDS[table] || {};
    const mergedData = { ...defaultFields, ...data };

    setPendingAction({
      type: 'add',
      entityType,
      table,
      data: mergedData,
      preview: {
        title: `Adicionar ${entityType}`,
        description: `Um novo item será criado na tabela "${table}".`,
        affectedItems: Object.entries(mergedData)
          .filter(([_, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${k}: ${String(v).slice(0, 50)}`)
      }
    });
  }, [isOwner, resolveTable]);

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

    const table = resolveTable(entityType);

    setPendingAction({
      type: 'duplicate',
      entityType,
      entityId,
      table,
      element,
      preview: {
        title: `Duplicar item`,
        description: `O item será copiado com todas as suas associações.`,
        affectedItems: ['Item original', 'Anexos (se houver)', 'Metadados']
      }
    });
  }, [isOwner, resolveTable]);

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

    const table = resolveTable(entityType);
    
    // Obter preview do que será removido
    let preview;
    try {
      preview = await getRemovePreview(entityType, entityId);
    } catch {
      preview = {
        entityName: 'Item',
        totalItems: 1,
        affectedItems: ['Item selecionado']
      };
    }

    setPendingAction({
      type: 'remove',
      entityType,
      entityId,
      table,
      element,
      preview: {
        title: `⚠️ EXCLUIR PERMANENTEMENTE "${preview.entityName}"`,
        description: `${preview.totalItems} item(ns) serão REMOVIDOS PARA SEMPRE de todo o sistema.`,
        affectedItems: preview.affectedItems
      }
    });
  }, [isOwner, getRemovePreview, resolveTable]);

  // Confirmar ação (SALVAR)
  const confirmAction = useCallback(async (): Promise<ActionResult> => {
    if (!pendingAction || !isOwner) {
      return { success: false, message: 'Nenhuma ação pendente ou sem permissão' };
    }

    setIsProcessing(true);

    try {
      let result: ActionResult;
      const table = pendingAction.table || resolveTable(pendingAction.entityType);

      switch (pendingAction.type) {
        case 'add': {
          // Adicionar novo item
          const dataToInsert = { ...pendingAction.data };

          // Adicionar user_id se necessário
          if (['tasks', 'calendar_tasks', 'transactions'].includes(table) && user) {
            dataToInsert.user_id = user.id;
          }

          console.log('[MasterActions] Inserindo em:', table, 'Dados:', dataToInsert);

          const { data, error } = await supabase
            .from(table as 'courses')
            .insert(dataToInsert as never)
            .select()
            .single();

          if (error) {
            console.error('[MasterActions] Erro ao inserir:', error);
            throw error;
          }

          // Emitir evento para atualizar UI
          window.dispatchEvent(new CustomEvent('master-item-added', {
            detail: { table, data, entityType: pendingAction.entityType }
          }));

          toast.success('✅ Item adicionado!', {
            description: `Criado com sucesso em ${table}`
          });

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

          // Tentar duplicação via hook especializado
          try {
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
          } catch {
            // Fallback: duplicação direta
            const { data: original } = await supabase
              .from(table as 'courses')
              .select('*')
              .eq('id', pendingAction.entityId)
              .single();

            if (!original) throw new Error('Item não encontrado');

            const newData = { ...original } as Record<string, unknown>;
            delete newData.id;
            delete newData.created_at;
            delete newData.updated_at;
            
            // Adicionar sufixo ao nome
            const nameField = Object.keys(newData).find(k => 
              ['title', 'name', 'nome', 'descricao', 'titulo'].includes(k)
            );
            if (nameField && typeof newData[nameField] === 'string') {
              newData[nameField] = `${newData[nameField]} (Cópia)`;
            }

            const { data, error } = await supabase
              .from(table as 'courses')
              .insert(newData as never)
              .select()
              .single();

            if (error) throw error;

            toast.success('📋 Item duplicado!');

            result = {
              success: true,
              message: 'Item duplicado com sucesso',
              data: data as Record<string, unknown>
            };
          }
          break;
        }

        case 'remove': {
          if (!pendingAction.entityId) {
            throw new Error('ID da entidade não fornecido');
          }

          // Tentar remoção via hook especializado
          let removeResult;
          try {
            removeResult = await removeEntity(
              pendingAction.entityType,
              pendingAction.entityId
            );
          } catch {
            // Fallback: remoção direta
            removeResult = await removeFromTable(table, pendingAction.entityId);
          }

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
      window.dispatchEvent(new CustomEvent('data-invalidate', {
        detail: { tables: [table] }
      }));

      setPendingAction(null);
      return result;

    } catch (error: any) {
      console.error('[MasterActions] Erro ao executar ação:', error);
      toast.error('Erro ao executar ação', { description: error.message });
      return { success: false, message: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, [pendingAction, isOwner, user, duplicateEntity, removeEntity, removeFromTable, resolveTable]);

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

    // Utilitários
    resolveTable,
    TABLE_MAP,

    // Constantes
    OWNER_EMAIL
  };
}
