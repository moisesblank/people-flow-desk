// ============================================
// MOISÉS MEDEIROS v12.0 - INSTANT DUPLICATION SYSTEM
// Sistema de Duplicação Instantânea com Posicionamento
// Aparece na posição do mouse IMEDIATAMENTE
// Owner: moisesblank@gmail.com
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useReactiveStore } from '@/stores/reactiveStore';

const OWNER_EMAIL = 'moisesblank@gmail.com';

export type DuplicableEntity = 
  | 'course' | 'lesson' | 'module' | 'quiz' | 'task' | 'calendar_task'
  | 'transaction' | 'campaign' | 'automation' | 'employee' | 'affiliate'
  | 'student' | 'document' | 'category' | 'expense' | 'income'
  | 'conta_pagar' | 'conta_receber' | 'alerta' | 'contabilidade';

interface EntityConfig {
  table: string;
  nameField: string;
  orderField?: string;
  relations?: { table: string; foreignKey: string }[];
}

const ENTITY_CONFIGS: Record<DuplicableEntity, EntityConfig> = {
  course: { table: 'courses', nameField: 'title', relations: [{ table: 'modules', foreignKey: 'course_id' }] },
  lesson: { table: 'lessons', nameField: 'title', orderField: 'order_index' },
  module: { table: 'modules', nameField: 'title', orderField: 'order_index' },
  quiz: { table: 'quizzes', nameField: 'title' },
  task: { table: 'tasks', nameField: 'title', orderField: 'position' },
  calendar_task: { table: 'calendar_tasks', nameField: 'title' },
  transaction: { table: 'transactions', nameField: 'description' },
  campaign: { table: 'marketing_campaigns', nameField: 'name' },
  automation: { table: 'owner_automations', nameField: 'nome' },
  employee: { table: 'employees', nameField: 'nome' },
  affiliate: { table: 'affiliates', nameField: 'nome' },
  student: { table: 'alunos', nameField: 'nome' },
  document: { table: 'general_documents', nameField: 'nome' },
  category: { table: 'financial_categories', nameField: 'name' },
  expense: { table: 'company_extra_expenses', nameField: 'nome' },
  income: { table: 'entradas', nameField: 'descricao' },
  conta_pagar: { table: 'contas_pagar', nameField: 'descricao' },
  conta_receber: { table: 'contas_receber', nameField: 'descricao' },
  alerta: { table: 'alertas_sistema', nameField: 'titulo' },
  contabilidade: { table: 'contabilidade', nameField: 'descricao' },
};

interface ClipboardItem {
  entityType: DuplicableEntity;
  entityId: string;
  data: Record<string, any>;
  copiedAt: number;
  originalName: string;
}

interface DuplicationResult {
  success: boolean;
  newId?: string;
  newData?: Record<string, any>;
  message: string;
}

interface MousePosition {
  x: number;
  y: number;
}

export function useInstantDuplication() {
  const { user, role } = useAuth();
  const recalculateAll = useReactiveStore(state => state.recalculateAll);
  
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [showPasteIndicator, setShowPasteIndicator] = useState(false);
  
  const mousePositionRef = useRef<MousePosition>({ x: 0, y: 0 });

  // Verificação estrita de owner
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL && role === 'owner';

  // Rastrear posição do mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
      setLastMousePosition({ x: e.clientX, y: e.clientY });
    };

    if (isOwner) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isOwner]);

  // Atalho Ctrl+V para colar
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!isOwner || !clipboard) return;

      // Ctrl+V ou Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // Verificar se não está em um input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }

        e.preventDefault();
        await pasteFromClipboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOwner, clipboard]);

  // Copiar item para clipboard
  const copyToClipboard = useCallback(async (
    entityType: DuplicableEntity,
    entityId: string
  ): Promise<boolean> => {
    if (!isOwner) {
      toast.error('Acesso negado');
      return false;
    }

    const config = ENTITY_CONFIGS[entityType];
    if (!config) {
      toast.error('Tipo de entidade não suportado');
      return false;
    }

    try {
      // Buscar dados do item
      const { data, error } = await supabase
        .from(config.table as 'courses')
        .select('*')
        .eq('id', entityId)
        .single();

      if (error || !data) {
        throw new Error('Item não encontrado');
      }

      const originalName = (data as any)[config.nameField] || 'Item';

      setClipboard({
        entityType,
        entityId,
        data: data as Record<string, any>,
        copiedAt: Date.now(),
        originalName
      });

      setShowPasteIndicator(true);

      toast.success('📋 Copiado!', {
        description: `"${originalName}" na área de transferência. Pressione Ctrl+V para colar.`,
        duration: 4000,
      });

      return true;
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Erro ao copiar item');
      return false;
    }
  }, [isOwner]);

  // Colar do clipboard - INSTANTÂNEO
  const pasteFromClipboard = useCallback(async (): Promise<DuplicationResult> => {
    if (!isOwner || !clipboard) {
      return { success: false, message: 'Nada para colar' };
    }

    setIsDuplicating(true);
    const config = ENTITY_CONFIGS[clipboard.entityType];

    try {
      // Preparar dados para duplicação
      const newData: Record<string, any> = { ...clipboard.data };
      delete newData.id;
      delete newData.created_at;
      delete newData.updated_at;

      // Adicionar sufixo ao nome
      newData[config.nameField] = `${clipboard.originalName} (Cópia)`;

      // Se tem campo de ordem, colocar no final
      if (config.orderField) {
        // Buscar maior ordem atual
        const { data: maxOrderData } = await supabase
          .from(config.table as 'courses')
          .select(config.orderField)
          .order(config.orderField, { ascending: false })
          .limit(1)
          .single();

        const maxOrder = maxOrderData ? (maxOrderData as any)[config.orderField] || 0 : 0;
        newData[config.orderField] = maxOrder + 1;
      }

      // INSERIR IMEDIATAMENTE
      const { data: inserted, error } = await supabase
        .from(config.table as 'courses')
        .insert(newData as never)
        .select()
        .single();

      if (error || !inserted) {
        throw new Error(error?.message || 'Erro ao duplicar');
      }

      // Forçar recálculo do store reativo
      recalculateAll();

      // Disparar evento para atualizar listas
      window.dispatchEvent(new CustomEvent('item-duplicated', {
        detail: {
          entityType: clipboard.entityType,
          originalId: clipboard.entityId,
          newId: (inserted as any).id,
          newData: inserted,
          mousePosition: mousePositionRef.current
        }
      }));

      // Log de auditoria
      await supabase.from('activity_log').insert({
        action: 'INSTANT_DUPLICATE',
        table_name: config.table,
        record_id: String((inserted as any).id),
        user_id: user?.id,
        user_email: user?.email,
        old_value: { original_id: clipboard.entityId } as never,
        new_value: { new_id: (inserted as any).id, mouse_position: mousePositionRef.current } as never
      });

      toast.success('✨ Duplicado!', {
        description: `"${newData[config.nameField]}" criado com sucesso`,
        duration: 3000,
      });

      // Manter no clipboard para múltiplas cópias
      return {
        success: true,
        newId: String((inserted as any).id),
        newData: inserted as Record<string, any>,
        message: 'Duplicação concluída'
      };

    } catch (error) {
      const err = error as Error;
      console.error('Erro na duplicação:', err);
      toast.error('Erro ao duplicar', { description: err.message });
      return { success: false, message: err.message };
    } finally {
      setIsDuplicating(false);
    }
  }, [isOwner, clipboard, user, recalculateAll]);

  // Limpar clipboard
  const clearClipboard = useCallback(() => {
    setClipboard(null);
    setShowPasteIndicator(false);
  }, []);

  // Duplicar diretamente (sem clipboard)
  const duplicateInstant = useCallback(async (
    entityType: DuplicableEntity,
    entityId: string,
    options?: { newName?: string }
  ): Promise<DuplicationResult> => {
    if (!isOwner) {
      return { success: false, message: 'Acesso negado' };
    }

    // Copiar e colar em uma única operação
    const copied = await copyToClipboard(entityType, entityId);
    if (!copied) {
      return { success: false, message: 'Erro ao copiar' };
    }

    // Pequeno delay para garantir que o clipboard foi atualizado
    await new Promise(resolve => setTimeout(resolve, 50));

    return pasteFromClipboard();
  }, [isOwner, copyToClipboard, pasteFromClipboard]);

  return {
    // Estado
    clipboard,
    isDuplicating,
    isOwner,
    canDuplicate: isOwner,
    showPasteIndicator,
    lastMousePosition,
    
    // Ações
    copyToClipboard,
    pasteFromClipboard,
    clearClipboard,
    duplicateInstant,
    
    // Utilitários
    ENTITY_CONFIGS,
    OWNER_EMAIL
  };
}

// Hook para ouvir eventos de duplicação
export function useDuplicationListener(
  callback: (event: { 
    entityType: DuplicableEntity; 
    originalId: string; 
    newId: string; 
    newData: any;
    mousePosition: MousePosition;
  }) => void
) {
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      callback(customEvent.detail);
    };

    window.addEventListener('item-duplicated', handler);
    return () => window.removeEventListener('item-duplicated', handler);
  }, [callback]);
}
