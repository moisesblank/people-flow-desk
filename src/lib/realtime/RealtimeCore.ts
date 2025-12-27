// ============================================
// ⚡ REALTIME CORE v1.0.0
// CONSTITUIÇÃO SYNAPSE Ω v10.x — PARTE 4
// ============================================
// REGRAS:
// - Um único channel por tela (não por linha)
// - Múltiplas assinaturas no mesmo channel
// - Cleanup obrigatório
// - /alunos: filtra por user_id
// - /gestaofc: invalidation, não stream completo
// ============================================

import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// ============================================
// TYPES
// ============================================

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export type RealtimeStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface RealtimeSubscription {
  /** Tabela a ser observada */
  table: string;
  /** Evento(s) a escutar */
  event: RealtimeEvent;
  /** Filtro opcional (ex: user_id=eq.uuid) */
  filter?: string;
  /** Callback quando receber evento */
  onEvent: (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => void;
}

export interface RealtimeChannelState {
  /** Status atual da conexão */
  status: RealtimeStatus;
  /** Timestamp do último evento recebido */
  lastEventAt: Date | null;
  /** Número de subscriptions ativas */
  subscriptionCount: number;
  /** Nome do channel */
  channelName: string;
}

export interface RealtimeCoreOptions {
  /** Nome único do channel (ex: 'alunos-dashboard', 'gestaofc-alunos') */
  channelName: string;
  /** Callback para mudanças de status */
  onStatusChange?: (status: RealtimeStatus) => void;
  /** Callback para qualquer evento (debug) */
  onAnyEvent?: (table: string, event: RealtimeEvent, payload: unknown) => void;
}

// ============================================
// REALTIME CORE CLASS
// ============================================

export class RealtimeCore {
  private channel: RealtimeChannel | null = null;
  private subscriptions: RealtimeSubscription[] = [];
  private status: RealtimeStatus = 'disconnected';
  private lastEventAt: Date | null = null;
  private options: RealtimeCoreOptions;
  private isDestroyed = false;

  constructor(options: RealtimeCoreOptions) {
    this.options = options;
  }

  /**
   * Adiciona uma subscription ao channel
   * IMPORTANTE: Chamar antes de connect()
   */
  addSubscription(subscription: RealtimeSubscription): this {
    if (this.isDestroyed) {
      console.warn('[RealtimeCore] Tentativa de adicionar subscription após destroy');
      return this;
    }
    this.subscriptions.push(subscription);
    return this;
  }

  /**
   * Conecta ao channel com todas as subscriptions configuradas
   * Usa padrão do projeto: .on() encadeado + .subscribe()
   */
  connect(): this {
    if (this.isDestroyed) {
      console.warn('[RealtimeCore] Tentativa de conectar após destroy');
      return this;
    }

    if (this.channel) {
      console.warn('[RealtimeCore] Channel já conectado:', this.options.channelName);
      return this;
    }

    this.setStatus('connecting');

    // Cria o channel base
    this.channel = supabase.channel(this.options.channelName);
    
    // Registra subscriptions usando o padrão do projeto
    this.subscriptions.forEach((sub) => {
      if (!this.channel) return;
      
      // Configuração base
      const config: { event: RealtimeEvent; schema: 'public'; table: string; filter?: string } = {
        event: sub.event,
        schema: 'public',
        table: sub.table,
      };
      
      // Adiciona filtro se existir
      if (sub.filter) {
        config.filter = sub.filter;
      }

      // Handler para este subscription
      const handler = (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        this.lastEventAt = new Date();
        sub.onEvent(payload);
        this.options.onAnyEvent?.(sub.table, payload.eventType as RealtimeEvent, payload);
      };

      // Registra no channel (cast para any para evitar problemas de tipagem)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.channel as any).on('postgres_changes', config, handler);
    });

    // Subscribe com handlers de status
    this.channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.setStatus('connected');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        this.setStatus('error');
      } else if (status === 'TIMED_OUT') {
        this.setStatus('disconnected');
      }
    });

    return this;
  }

  /**
   * Desconecta e limpa recursos (CLEANUP OBRIGATÓRIO)
   */
  destroy(): void {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    
    this.subscriptions = [];
    this.setStatus('disconnected');
    
    console.log('[RealtimeCore] Destroyed:', this.options.channelName);
  }

  /**
   * Retorna o estado atual do channel
   */
  getState(): RealtimeChannelState {
    return {
      status: this.status,
      lastEventAt: this.lastEventAt,
      subscriptionCount: this.subscriptions.length,
      channelName: this.options.channelName,
    };
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }

  private setStatus(status: RealtimeStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.options.onStatusChange?.(status);
    }
  }
}

// ============================================
// FACTORY FUNCTIONS (HELPERS)
// ============================================

/**
 * Cria filtro para user_id (uso em /alunos)
 * @param userId - UUID do usuário
 */
export function filterByUserId(userId: string): string {
  return `user_id=eq.${userId}`;
}

/**
 * Cria filtro para email
 * @param email - Email do usuário
 */
export function filterByEmail(email: string): string {
  return `email=eq.${email}`;
}

/**
 * Cria filtro genérico
 * @param column - Nome da coluna
 * @param operator - Operador (eq, neq, gt, lt, etc)
 * @param value - Valor a filtrar
 */
export function createFilter(column: string, operator: string, value: string): string {
  return `${column}=${operator}.${value}`;
}

// ============================================
// INVALIDATION HELPER (uso em /gestaofc)
// ============================================

export interface InvalidationConfig {
  /** QueryClient do React Query */
  queryClient: {
    invalidateQueries: (options: { queryKey: string[] }) => Promise<void>;
  };
  /** Mapeamento tabela → queryKey */
  tableToQueryKey: Record<string, string[]>;
}

/**
 * Cria handler de invalidation para /gestaofc
 * Em vez de fazer stream da tabela inteira, apenas invalida o cache
 */
export function createInvalidationHandler(config: InvalidationConfig) {
  return (table: string, _event: RealtimeEvent, _payload: unknown) => {
    const queryKey = config.tableToQueryKey[table];
    if (queryKey) {
      config.queryClient.invalidateQueries({ queryKey });
      console.log('[RealtimeCore] Invalidated:', queryKey);
    }
  };
}
