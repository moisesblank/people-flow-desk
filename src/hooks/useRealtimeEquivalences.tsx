// ============================================
// MOISÉS MEDEIROS v12.0 - REALTIME EQUIVALENCES SYSTEM
// Sistema de Equivalências em Tempo Real
// Propaga alterações para TODOS os locais equivalentes
// Owner: moisesblank@gmail.com
// ============================================

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useReactiveStore } from '@/stores/reactiveStore';

const OWNER_EMAIL = 'moisesblank@gmail.com';

// Mapeamento de equivalências - onde cada tipo de dado aparece
interface EquivalenceMapping {
  table: string;
  field: string;
  targets: {
    location: string; // Ex: 'dashboard.widget.revenue', 'sidebar.stats.total'
    selector?: string; // Seletor CSS para atualização direta
    transformer?: (value: any) => any; // Transformação do valor
  }[];
}

const EQUIVALENCE_MAP: Record<string, EquivalenceMapping> = {
  // Finanças
  'transactions.amount': {
    table: 'transactions',
    field: 'amount',
    targets: [
      { location: 'dashboard.revenue', selector: '[data-reactive="receita"]' },
      { location: 'finance.overview', selector: '[data-reactive="total-transacoes"]' },
      { location: 'reports.financial', selector: '[data-reactive="faturamento"]' },
    ]
  },
  'contas_pagar.valor': {
    table: 'contas_pagar',
    field: 'valor',
    targets: [
      { location: 'dashboard.expenses', selector: '[data-reactive="despesas"]' },
      { location: 'finance.payables', selector: '[data-reactive="contas-pagar"]' },
    ]
  },
  'contas_receber.valor': {
    table: 'contas_receber',
    field: 'valor',
    targets: [
      { location: 'dashboard.receivables', selector: '[data-reactive="receber"]' },
      { location: 'finance.receivables', selector: '[data-reactive="contas-receber"]' },
    ]
  },
  // Alunos
  'alunos.status': {
    table: 'alunos',
    field: 'status',
    targets: [
      { location: 'dashboard.students', selector: '[data-reactive="total-alunos"]' },
      { location: 'students.list', selector: '[data-reactive="alunos-ativos"]' },
    ]
  },
  // Funcionários
  'employees.status': {
    table: 'employees',
    field: 'status',
    targets: [
      { location: 'dashboard.team', selector: '[data-reactive="funcionarios"]' },
      { location: 'hr.overview', selector: '[data-reactive="equipe-ativa"]' },
    ]
  },
  // Tarefas
  'tasks.status': {
    table: 'tasks',
    field: 'status',
    targets: [
      { location: 'dashboard.tasks', selector: '[data-reactive="tarefas-pendentes"]' },
      { location: 'calendar.tasks', selector: '[data-reactive="tasks-count"]' },
    ]
  },
  // Cursos
  'courses.total_students': {
    table: 'courses',
    field: 'total_students',
    targets: [
      { location: 'lms.overview', selector: '[data-reactive="matriculas"]' },
      { location: 'dashboard.lms', selector: '[data-reactive="total-matriculas"]' },
    ]
  },
};

// Cache de subscriptions ativas
const activeSubscriptions = new Map<string, any>();

// Interface do hook
interface UseRealtimeEquivalencesReturn {
  propagateChange: (table: string, field: string, oldValue: any, newValue: any, recordId: string) => Promise<void>;
  updateEquivalentElements: (key: string, value: any) => void;
  subscribeToTable: (table: string) => void;
  unsubscribeFromTable: (table: string) => void;
  forceGlobalSync: () => Promise<void>;
}

export function useRealtimeEquivalences(): UseRealtimeEquivalencesReturn {
  const lastUpdateRef = useRef<number>(Date.now());
  const recalculateAll = useReactiveStore(state => state.recalculateAll);

  // Propagar alteração para todos os elementos equivalentes
  const propagateChange = useCallback(async (
    table: string,
    field: string,
    oldValue: any,
    newValue: any,
    recordId: string
  ) => {
    const key = `${table}.${field}`;
    const mapping = EQUIVALENCE_MAP[key];
    
    console.log('🔄 Propagando alteração:', { table, field, oldValue, newValue, recordId });

    if (!mapping) {
      // Mesmo sem mapeamento específico, forçar recálculo global
      recalculateAll();
      return;
    }

    // Atualizar todos os targets
    mapping.targets.forEach(target => {
      if (target.selector) {
        const elements = document.querySelectorAll(target.selector);
        elements.forEach(el => {
          const transformedValue = target.transformer ? target.transformer(newValue) : newValue;
          
          // Atualizar com animação
          el.classList.add('reactive-updating');
          
          if (el instanceof HTMLElement) {
            // Para inputs
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
              (el as HTMLInputElement).value = String(transformedValue);
            } else {
              // Para elementos de texto
              el.textContent = String(transformedValue);
            }
          }
          
          // Remover classe após animação
          setTimeout(() => {
            el.classList.remove('reactive-updating');
            el.classList.add('reactive-updated');
            setTimeout(() => el.classList.remove('reactive-updated'), 1000);
          }, 300);
        });
      }
    });

    // Forçar recálculo do store reativo
    recalculateAll();

    // Disparar evento customizado para outros componentes
    window.dispatchEvent(new CustomEvent('equivalence-update', {
      detail: { table, field, oldValue, newValue, recordId, timestamp: Date.now() }
    }));

    lastUpdateRef.current = Date.now();
  }, [recalculateAll]);

  // Atualizar elementos equivalentes por key
  const updateEquivalentElements = useCallback((key: string, value: any) => {
    const mapping = EQUIVALENCE_MAP[key];
    if (!mapping) return;

    mapping.targets.forEach(target => {
      if (target.selector) {
        const elements = document.querySelectorAll(target.selector);
        elements.forEach(el => {
          const transformedValue = target.transformer ? target.transformer(value) : value;
          if (el instanceof HTMLElement) {
            el.textContent = String(transformedValue);
          }
        });
      }
    });
  }, []);

  // Subscrever a mudanças em uma tabela
  const subscribeToTable = useCallback((table: string) => {
    if (activeSubscriptions.has(table)) return;

    const channel = supabase
      .channel(`equivalences-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log('📡 Mudança detectada em', table, payload);
          
          const { eventType, old: oldRecord, new: newRecord } = payload;
          
          // Identificar campos alterados
          if (eventType === 'UPDATE' && oldRecord && newRecord) {
            Object.keys(newRecord).forEach(field => {
              if (oldRecord[field] !== newRecord[field]) {
                propagateChange(
                  table,
                  field,
                  oldRecord[field],
                  newRecord[field],
                  String(newRecord.id)
                );
              }
            });
          } else if (eventType === 'INSERT' || eventType === 'DELETE') {
            // Para INSERT/DELETE, forçar recálculo completo
            recalculateAll();
          }
        }
      )
      .subscribe();

    activeSubscriptions.set(table, channel);
  }, [propagateChange, recalculateAll]);

  // Cancelar subscription
  const unsubscribeFromTable = useCallback((table: string) => {
    const channel = activeSubscriptions.get(table);
    if (channel) {
      supabase.removeChannel(channel);
      activeSubscriptions.delete(table);
    }
  }, []);

  // Forçar sincronização global
  const forceGlobalSync = useCallback(async () => {
    console.log('🔄 Forçando sincronização global...');
    
    // Recalcular store reativo
    recalculateAll();
    
    // Disparar evento de sync
    window.dispatchEvent(new CustomEvent('global-sync', {
      detail: { timestamp: Date.now() }
    }));

    toast.success('🔄 Sincronização concluída', {
      description: 'Todos os dados foram atualizados'
    });
  }, [recalculateAll]);

  // Auto-subscribe nas tabelas principais
  useEffect(() => {
    const mainTables = [
      'transactions',
      'contas_pagar',
      'contas_receber',
      'alunos',
      'employees',
      'tasks',
      'courses'
    ];

    mainTables.forEach(subscribeToTable);

    // Adicionar estilos de animação
    const styleId = 'reactive-animation-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .reactive-updating {
          transition: all 0.3s ease;
          background: linear-gradient(90deg, transparent, hsl(280 80% 50% / 0.2), transparent);
          background-size: 200% 100%;
          animation: shimmer 0.5s ease-out;
        }
        
        .reactive-updated {
          animation: pulse-success 0.5s ease-out;
        }
        
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }
        
        @keyframes pulse-success {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); color: hsl(142 76% 36%); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      mainTables.forEach(unsubscribeFromTable);
    };
  }, [subscribeToTable, unsubscribeFromTable]);

  return {
    propagateChange,
    updateEquivalentElements,
    subscribeToTable,
    unsubscribeFromTable,
    forceGlobalSync
  };
}

// Hook simplificado para componentes que só precisam ouvir mudanças
export function useEquivalenceListener(callback: (event: CustomEvent) => void) {
  useEffect(() => {
    const handler = (e: Event) => callback(e as CustomEvent);
    window.addEventListener('equivalence-update', handler);
    window.addEventListener('global-sync', handler);
    
    return () => {
      window.removeEventListener('equivalence-update', handler);
      window.removeEventListener('global-sync', handler);
    };
  }, [callback]);
}

// Export do mapeamento para uso externo
export { EQUIVALENCE_MAP };
export type { EquivalenceMapping };
