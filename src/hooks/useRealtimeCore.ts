// ============================================
// ⚡ USE REALTIME CORE HOOK v1.0.0
// CONSTITUIÇÃO SYNAPSE Ω v10.x — PARTE 4
// ============================================
// Hook React para usar o RealtimeCore com cleanup automático
// ============================================

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import {
  RealtimeCore,
  RealtimeStatus,
  RealtimeChannelState,
  filterByUserId,
  createInvalidationHandler,
  type RealtimeEvent,
} from "@/lib/realtime/RealtimeCore";

// ============================================
// TYPES
// ============================================

export interface UseRealtimeCoreOptions {
  /** Nome único do channel */
  channelName: string;
  /** Se deve conectar automaticamente */
  autoConnect?: boolean;
  /** Se deve usar filtro por user_id (para /alunos) */
  filterByCurrentUser?: boolean;
  /** Subscriptions a registrar */
  subscriptions?: Array<{
    table: string;
    event?: RealtimeEvent;
    filter?: string;
    onEvent?: (payload: unknown) => void;
  }>;
  /** Modo invalidation (para /gestaofc) */
  invalidationMode?: {
    enabled: boolean;
    tableToQueryKey: Record<string, string[]>;
  };
}

export interface UseRealtimeCoreReturn {
  /** Estado atual do channel */
  state: RealtimeChannelState;
  /** Se está conectado */
  isConnected: boolean;
  /** Conectar manualmente */
  connect: () => void;
  /** Desconectar manualmente */
  disconnect: () => void;
}

// ============================================
// HOOK
// ============================================

export function useRealtimeCore(options: UseRealtimeCoreOptions): UseRealtimeCoreReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const coreRef = useRef<RealtimeCore | null>(null);
  
  const [state, setState] = useState<RealtimeChannelState>({
    status: 'disconnected',
    lastEventAt: null,
    subscriptionCount: 0,
    channelName: options.channelName,
  });

  // Handler de status
  const handleStatusChange = useCallback((status: RealtimeStatus) => {
    setState(prev => ({ ...prev, status }));
  }, []);

  // Handler de eventos (atualiza lastEventAt)
  const handleAnyEvent = useCallback((table: string, event: RealtimeEvent, payload: unknown) => {
    setState(prev => ({ ...prev, lastEventAt: new Date() }));
    
    // Se modo invalidation está ativo
    if (options.invalidationMode?.enabled) {
      const handler = createInvalidationHandler({
        queryClient,
        tableToQueryKey: options.invalidationMode.tableToQueryKey,
      });
      handler(table, event, payload);
    }
  }, [queryClient, options.invalidationMode]);

  // Conectar
  const connect = useCallback(() => {
    if (coreRef.current?.isConnected()) return;
    coreRef.current?.connect();
  }, []);

  // Desconectar
  const disconnect = useCallback(() => {
    coreRef.current?.destroy();
    coreRef.current = null;
    setState(prev => ({ ...prev, status: 'disconnected' }));
  }, []);

  // Setup e cleanup
  useEffect(() => {
    // Criar instância
    const core = new RealtimeCore({
      channelName: options.channelName,
      onStatusChange: handleStatusChange,
      onAnyEvent: handleAnyEvent,
    });

    // Registrar subscriptions
    if (options.subscriptions) {
      for (const sub of options.subscriptions) {
        let filter = sub.filter;
        
        // Aplicar filtro por user_id se configurado
        if (options.filterByCurrentUser && user?.id && !filter) {
          filter = filterByUserId(user.id);
        }

        core.addSubscription({
          table: sub.table,
          event: sub.event || '*',
          filter,
          onEvent: sub.onEvent || (() => {}),
        });
      }
    }

    coreRef.current = core;
    
    // Atualizar contagem
    setState(prev => ({
      ...prev,
      subscriptionCount: options.subscriptions?.length || 0,
    }));

    // Auto-connect se configurado
    if (options.autoConnect !== false) {
      core.connect();
    }

    // CLEANUP OBRIGATÓRIO
    return () => {
      core.destroy();
      coreRef.current = null;
    };
  }, [
    options.channelName,
    options.autoConnect,
    options.filterByCurrentUser,
    user?.id,
    handleStatusChange,
    handleAnyEvent,
    // Não incluir options.subscriptions para evitar re-render infinito
  ]);

  return {
    state,
    isConnected: state.status === 'connected',
    connect,
    disconnect,
  };
}

// ============================================
// HOOKS PRÉ-CONFIGURADOS
// ============================================

/**
 * Hook para área /alunos
 * Filtra automaticamente por user_id do usuário logado
 */
export function useRealtimeAlunos(
  subscriptions: Array<{
    table: string;
    event?: RealtimeEvent;
    onEvent?: (payload: unknown) => void;
  }>
): UseRealtimeCoreReturn {
  return useRealtimeCore({
    channelName: 'alunos-portal',
    filterByCurrentUser: true,
    subscriptions,
  });
}

/**
 * Hook para área /gestaofc
 * Usa modo invalidation (re-fetch ao invés de stream)
 */
export function useRealtimeGestao(
  tableToQueryKey: Record<string, string[]>
): UseRealtimeCoreReturn {
  const tables = Object.keys(tableToQueryKey);
  
  return useRealtimeCore({
    channelName: 'gestaofc-admin',
    invalidationMode: {
      enabled: true,
      tableToQueryKey,
    },
    subscriptions: tables.map(table => ({
      table,
      event: '*' as RealtimeEvent,
    })),
  });
}
