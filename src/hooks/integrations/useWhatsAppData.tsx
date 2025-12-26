// ==============================================================================
// HOOK PARA DADOS DO WHATSAPP - INTEGRAÇÃO COM TODA A PLATAFORMA
// ==============================================================================

import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useSubspaceQuery, useOptimisticMutation, SUBSPACE_CACHE_PROFILES } from '@/hooks/useSubspaceCommunication';

// Tipos
export interface WhatsAppTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  owner: string | null;
  source: string;
  related_conversation_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppFinance {
  id: string;
  type: string;
  amount: number;
  currency: string;
  date: string | null;
  counterparty: string | null;
  description: string | null;
  status: string;
  tags: any;
  source: string;
  related_conversation_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConversation {
  id: string;
  phone: string;
  display_name: string | null;
  owner_detected: boolean;
  owner_name: string | null;
  session_mode: string;
  last_message_at: string | null;
  unread_count: number;
  crm_stage: string;
  status: string;
  notes: string | null;
  tags: string[] | null;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  direction: string;
  message_id: string;
  message_type: string;
  message_text: string | null;
  from_phone: string;
  to_phone: string;
  timestamp: string;
  handled_by: string;
}

export interface WhatsAppAttachment {
  id: string;
  message_id: string;
  conversation_id: string;
  attachment_type: string;
  mime_type: string | null;
  storage_path: string | null;
  public_url: string | null;
  file_size: number | null;
  filename: string | null;
  caption: string | null;
  download_status: string;
}

// Hook para tarefas do WhatsApp - MIGRADO PARA useSubspaceQuery
export function useWhatsAppTasks() {
  return useSubspaceQuery(
    ['whatsapp-tasks'],
    async () => {
      // ⚡ DOGMA V.5K: Limite para evitar sobrecarga
      const { data, error } = await supabase
        .from('command_tasks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as WhatsAppTask[];
    },
    { profile: 'dashboard', persistKey: 'whatsapp_tasks_v1' }
  );
}

// Hook para finanças do WhatsApp - MIGRADO PARA useSubspaceQuery
export function useWhatsAppFinance(period?: 'today' | 'week' | 'month' | 'all') {
  return useSubspaceQuery(
    ['whatsapp-finance', period || 'all'],
    async () => {
      // ⚡ DOGMA V.5K: Query com limite
      let query = supabase.from('command_finance').select('*').limit(200);
      
      if (period === 'today') {
        query = query.gte('date', new Date().toISOString().split('T')[0]);
      } else if (period === 'week') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte('date', weekAgo.toISOString().split('T')[0]);
      } else if (period === 'month') {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        query = query.gte('date', monthStart.toISOString().split('T')[0]);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppFinance[];
    },
    {
      profile: 'dashboard',
      persistKey: `whatsapp_finance_${period || 'all'}`,
    }
  );
}

// Hook para conversas - MIGRADO PARA useSubspaceQuery
export function useWhatsAppConversations() {
  const queryClient = useQueryClient();
  
  const query = useSubspaceQuery(
    ['whatsapp-conversations'],
    async () => {
      // ⚡ DOGMA V.5K: Limite para evitar sobrecarga
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as WhatsAppConversation[];
    },
    {
      profile: 'dashboard',
      persistKey: 'whatsapp_conversations_v1',
    }
  );
  
  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp-conversations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
  
  return query;
}

// Hook para mensagens de uma conversa - MIGRADO PARA useSubspaceQuery
export function useWhatsAppMessages(conversationId: string | null) {
  const queryClient = useQueryClient();
  
  const query = useSubspaceQuery(
    ['whatsapp-messages', conversationId || 'none'],
    async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });
      if (error) throw error;
      return data as WhatsAppMessage[];
    },
    {
      profile: 'realtime',
      persistKey: `whatsapp_messages_${conversationId}`,
      enabled: !!conversationId,
    }
  );
  
  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    
    const channel = supabase
      .channel(`whatsapp-messages-${conversationId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'whatsapp_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', conversationId] });
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);
  
  return query;
}

// Hook para anexos de uma conversa - MIGRADO PARA useSubspaceQuery
export function useWhatsAppAttachments(conversationId: string | null) {
  return useSubspaceQuery(
    ['whatsapp-attachments', conversationId || 'none'],
    async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('whatsapp_attachments')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppAttachment[];
    },
    {
      profile: 'semiStatic',
      persistKey: `whatsapp_attachments_${conversationId}`,
      enabled: !!conversationId,
    }
  );
}

// Hook para estatísticas gerais - MIGRADO PARA useSubspaceQuery
export function useWhatsAppStats() {
  return useSubspaceQuery(
    ['whatsapp-stats'],
    async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const [
        { data: todayMessages },
        { data: pendingTasks },
        { data: openFinance },
        { data: todayExpenses },
        { data: todayIncome },
        { count: totalConversations },
        { count: vipConversations }
      ] = await Promise.all([
        supabase.from('whatsapp_messages').select('id').gte('created_at', today),
        supabase.from('command_tasks').select('id').eq('status', 'todo'),
        supabase.from('command_finance').select('amount, type').eq('status', 'open'),
        supabase.from('command_finance').select('amount').eq('type', 'expense').gte('date', today),
        supabase.from('command_finance').select('amount').eq('type', 'income').gte('date', today),
        supabase.from('whatsapp_conversations').select('id', { count: 'exact', head: true }),
        supabase.from('whatsapp_conversations').select('id', { count: 'exact', head: true }).eq('crm_stage', 'vip')
      ]);
      
      const totalPayable = openFinance?.filter(f => f.type === 'payable').reduce((s, f) => s + (f.amount || 0), 0) || 0;
      const totalReceivable = openFinance?.filter(f => f.type === 'receivable').reduce((s, f) => s + (f.amount || 0), 0) || 0;
      const totalExpensesToday = todayExpenses?.reduce((s, e) => s + (e.amount || 0), 0) || 0;
      const totalIncomeToday = todayIncome?.reduce((s, e) => s + (e.amount || 0), 0) || 0;
      
      return {
        messagesHoje: todayMessages?.length || 0,
        tarefasPendentes: pendingTasks?.length || 0,
        aPagar: totalPayable,
        aReceber: totalReceivable,
        gastosHoje: totalExpensesToday,
        receitasHoje: totalIncomeToday,
        totalConversas: totalConversations || 0,
        vipConversas: vipConversations || 0
      };
    },
    {
      profile: 'dashboard',
      persistKey: 'whatsapp_stats_v1',
      refetchInterval: 60000, // ⚡ DOGMA V.5K: 60s (de 30s)
    }
  );
}

// Hook para diagnósticos - MIGRADO PARA useSubspaceQuery
export function useWebhookDiagnostics() {
  return useSubspaceQuery(
    ['webhook-diagnostics'],
    async () => {
      const { data, error } = await supabase
        .from('webhook_diagnostics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    {
      profile: 'realtime',
      persistKey: 'webhook_diagnostics_v1',
      refetchInterval: 30000, // ⚡ DOGMA V.5K: 30s (de 5s) - admin only
    }
  );
}

// Mutations - MIGRADO PARA useOptimisticMutation
export function useUpdateConversation() {
  return useOptimisticMutation<WhatsAppConversation[], { id: string; updates: Partial<WhatsAppConversation> }, void>({
    queryKey: ['whatsapp-conversations'],
    mutationFn: async ({ id, updates }) => {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    optimisticUpdate: (old, { id, updates }) => {
      return (old || []).map(c => c.id === id ? { ...c, ...updates } : c);
    },
    errorMessage: 'Erro ao atualizar conversa',
  });
}

// ============================================
// FASE 3 COMPLETA - useOptimisticMutation (0ms)
// ============================================

export function useCreateWhatsAppTask() {
  return useOptimisticMutation<WhatsAppTask[], { title: string; description?: string; priority?: string; conversationId?: string }, void>({
    queryKey: ['whatsapp-tasks'],
    mutationFn: async (data) => {
      const { error } = await supabase.from('command_tasks').insert({
        title: data.title,
        description: data.description,
        priority: data.priority || 'med',
        status: 'todo',
        source: 'ui',
        related_conversation_id: data.conversationId
      });
      if (error) throw error;
    },
    optimisticUpdate: (old, data) => [
      ...(old || []),
      {
        id: `temp-${Date.now()}`,
        title: data.title,
        description: data.description || null,
        status: 'todo',
        priority: data.priority || 'med',
        due_date: null,
        owner: null,
        source: 'ui',
        related_conversation_id: data.conversationId || null,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    successMessage: 'Tarefa criada!',
    errorMessage: 'Erro ao criar tarefa',
  });
}

export function useCreateWhatsAppFinance() {
  return useOptimisticMutation<WhatsAppFinance[], { amount: number; type: string; description: string; counterparty?: string; conversationId?: string }, void>({
    queryKey: ['whatsapp-finance'],
    mutationFn: async (data) => {
      const { error } = await supabase.from('command_finance').insert({
        amount: data.amount,
        type: data.type,
        description: data.description,
        counterparty: data.counterparty,
        status: data.type === 'expense' ? 'paid' : 'open',
        source: 'ui',
        date: new Date().toISOString().split('T')[0],
        related_conversation_id: data.conversationId
      });
      if (error) throw error;
    },
    optimisticUpdate: (old, data) => [
      ...(old || []),
      {
        id: `temp-${Date.now()}`,
        type: data.type,
        amount: data.amount,
        currency: 'BRL',
        date: new Date().toISOString().split('T')[0],
        counterparty: data.counterparty || null,
        description: data.description,
        status: data.type === 'expense' ? 'paid' : 'open',
        tags: null,
        source: 'ui',
        related_conversation_id: data.conversationId || null,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    successMessage: 'Lançamento criado!',
    errorMessage: 'Erro ao criar lançamento',
  });
}

export function useUpdateWhatsAppTask() {
  return useOptimisticMutation<WhatsAppTask[], { id: string; updates: Partial<WhatsAppTask> }, void>({
    queryKey: ['whatsapp-tasks'],
    mutationFn: async ({ id, updates }) => {
      const { error } = await supabase
        .from('command_tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    optimisticUpdate: (old, { id, updates }) => {
      return (old || []).map(t => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t);
    },
    successMessage: 'Tarefa atualizada!',
    errorMessage: 'Erro ao atualizar tarefa',
  });
}

export function useDeleteWhatsAppTask() {
  return useOptimisticMutation<WhatsAppTask[], string, void>({
    queryKey: ['whatsapp-tasks'],
    mutationFn: async (id) => {
      const { error } = await supabase.from('command_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    optimisticUpdate: (old, id) => (old || []).filter(t => t.id !== id),
    successMessage: 'Tarefa excluída!',
    errorMessage: 'Erro ao excluir tarefa',
  });
}
