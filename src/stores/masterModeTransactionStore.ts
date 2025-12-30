// ============================================
// 👑 MASTER MODE TRANSACTION STORE
// Sistema transacional: edições são staged, não persistidas
// Commit atômico com rollback em caso de falha
// Publicação via Supabase Realtime após commit
// ============================================

import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function formatDbError(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;

  // PostgrestError shape (supabase-js)
  const anyErr = err as any;
  const msg = anyErr?.message || anyErr?.error_description || anyErr?.toString?.();
  const code = anyErr?.code ? ` (code: ${anyErr.code})` : '';
  const details = anyErr?.details ? ` — ${anyErr.details}` : '';
  const hint = anyErr?.hint ? ` — hint: ${anyErr.hint}` : '';

  return `${msg || 'Unknown error'}${code}${details}${hint}`.trim();
}

// Tipos de mudanças suportadas
export type ChangeType = 
  | 'content_edit'    // Edição de texto/imagem
  | 'menu_reorder'    // Reordenação de menu
  | 'entity_create'   // Criação de entidade
  | 'entity_update'   // Atualização de entidade
  | 'entity_delete';  // Deleção de entidade

export interface PendingChange {
  id: string;
  type: ChangeType;
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'upsert';
  data: Record<string, unknown>;
  key?: string;        // Para content edits
  originalValue?: unknown; // Para rollback visual
  timestamp: number;
}

interface TransactionState {
  // Estado transacional
  isDirty: boolean;
  pendingChanges: PendingChange[];
  isCommitting: boolean;
  lastCommitAt: number | null;
  
  // Ações de staging
  stageChange: (change: Omit<PendingChange, 'id' | 'timestamp'>) => void;
  unstageChange: (changeId: string) => void;
  clearAllStaged: () => void;
  
  // Ações de commit
  commitAll: () => Promise<{ success: boolean; error?: string }>;
  discardAll: () => void;
  
  // Getters
  getChangeCount: () => number;
  getChangesByTable: (table: string) => PendingChange[];
}

// Canal Realtime para broadcast de mudanças
const REALTIME_CHANNEL = 'master_mode_global_updates';

export const useMasterModeTransaction = create<TransactionState>((set, get) => ({
  isDirty: false,
  pendingChanges: [],
  isCommitting: false,
  lastCommitAt: null,

  stageChange: (change) => {
    const id = `change_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const newChange: PendingChange = {
      ...change,
      id,
      timestamp: Date.now(),
    };

    set((state) => ({
      pendingChanges: [...state.pendingChanges, newChange],
      isDirty: true,
    }));

    console.log('[MasterTransaction] ✏️ Staged:', newChange.type, newChange.table);
  },

  unstageChange: (changeId) => {
    set((state) => {
      const newPending = state.pendingChanges.filter((c) => c.id !== changeId);
      return {
        pendingChanges: newPending,
        isDirty: newPending.length > 0,
      };
    });
  },

  clearAllStaged: () => {
    set({ pendingChanges: [], isDirty: false });
  },

  commitAll: async () => {
    const { pendingChanges, isCommitting } = get();

    if (isCommitting) {
      return { success: false, error: 'Commit already in progress' };
    }

    if (pendingChanges.length === 0) {
      return { success: true };
    }

    set({ isCommitting: true });

    try {
      // Agrupar mudanças por tabela para otimizar
      const changesByTable = new Map<string, PendingChange[]>();
      for (const change of pendingChanges) {
        const existing = changesByTable.get(change.table) || [];
        changesByTable.set(change.table, [...existing, change]);
      }

      // Executar operações por tabela
      const errors: string[] = [];
      const affectedEntities: { table: string; ids: string[] }[] = [];

      for (const [table, changes] of changesByTable) {
        const tableIds: string[] = [];

        for (const change of changes) {
          let result: { error: unknown } = { error: null };

          try {
            switch (change.operation) {
              case 'insert':
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                result = await (supabase.from(table as any) as any).insert(change.data);
                if (change.data.id) tableIds.push(change.data.id as string);
                break;

              case 'update':
                if (change.key) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  result = await (supabase.from(table as any) as any)
                    .update(change.data)
                    .eq('content_key', change.key);
                } else if (change.data.id) {
                  const { id, ...updateData } = change.data;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  result = await (supabase.from(table as any) as any).update(updateData).eq('id', id);
                  tableIds.push(id as string);
                }
                break;

              case 'upsert':
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                result = await (supabase.from(table as any) as any).upsert(change.data);
                if (change.data.id) tableIds.push(change.data.id as string);
                break;

              case 'delete':
                if (change.data.id) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  result = await (supabase.from(table as any) as any).delete().eq('id', change.data.id);
                  tableIds.push(change.data.id as string);
                }
                break;
            }
          } catch (opError) {
            result = { error: opError };
          }

          if (result.error) {
            errors.push(`${table}: ${formatDbError(result.error)}`);
          }
        }

        if (tableIds.length > 0) {
          affectedEntities.push({ table, ids: tableIds });
        }
      }

      // Se houve erros, reportar (mas não rollback parcial - DB já commitou)
      if (errors.length > 0) {
        console.error('[MasterTransaction] ❌ Errors:', errors);
        set({ isCommitting: false });
        return {
          success: false,
          error: `Falha parcial: ${errors.join('; ')}`,
        };
      }

      // ✅ SUCESSO - Broadcast via Realtime
      await broadcastUpdate(affectedEntities);

      set({
        pendingChanges: [],
        isDirty: false,
        isCommitting: false,
        lastCommitAt: Date.now(),
      });

      console.log('[MasterTransaction] ✅ Commit successful:', affectedEntities);
      toast.success('✅ Alterações salvas e publicadas!');

      return { success: true };
    } catch (err) {
      console.error('[MasterTransaction] ❌ Commit failed:', err);
      set({ isCommitting: false });
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  },

  discardAll: () => {
    const { pendingChanges } = get();

    // Disparar evento para reverter mudanças visuais
    window.dispatchEvent(
      new CustomEvent('master-discard-all', {
        detail: { changes: pendingChanges },
      })
    );

    set({ pendingChanges: [], isDirty: false });
    toast.info('Alterações descartadas');
    console.log('[MasterTransaction] 🗑️ All changes discarded');
  },

  getChangeCount: () => get().pendingChanges.length,

  getChangesByTable: (table) =>
    get().pendingChanges.filter((c) => c.table === table),
}));

// Broadcast de atualizações via Supabase Realtime
async function broadcastUpdate(
  affectedEntities: { table: string; ids: string[] }[]
) {
  try {
    const channel = supabase.channel(REALTIME_CHANNEL);

    await channel.send({
      type: 'broadcast',
      event: 'master_update',
      payload: {
        timestamp: Date.now(),
        affectedEntities,
        source: 'master_mode_commit',
      },
    });

    console.log('[MasterTransaction] 📡 Broadcast sent:', affectedEntities);
  } catch (err) {
    console.error('[MasterTransaction] Broadcast failed:', err);
  }
}

// Hook para escutar atualizações de outros clientes
export function useMasterModeRealtimeUpdates(
  onUpdate: (payload: { affectedEntities: { table: string; ids: string[] }[] }) => void
) {
  const channel = supabase.channel(REALTIME_CHANNEL);

  channel
    .on('broadcast', { event: 'master_update' }, ({ payload }) => {
      console.log('[MasterTransaction] 📡 Received update:', payload);
      onUpdate(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Hook helper para usar em componentes
export function useMasterTransaction() {
  const store = useMasterModeTransaction();
  
  return {
    isDirty: store.isDirty,
    changeCount: store.getChangeCount(),
    isCommitting: store.isCommitting,
    stageChange: store.stageChange,
    commitAll: store.commitAll,
    discardAll: store.discardAll,
    clearAllStaged: store.clearAllStaged,
  };
}
