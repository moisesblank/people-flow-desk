// ==============================================================================
// HOOK PARA DADOS DO WHATSAPP - INTEGRAÇÃO COM TODA A PLATAFORMA
// ==============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useSubspaceQuery, SUBSPACE_CACHE_PROFILES } from './useSubspaceCommunication';

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

// Hook para tarefas do WhatsApp
export function useWhatsAppTasks() {
  return useQuery({
    queryKey: ['whatsapp-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('command_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppTask[];
    }
  });
}

// Hook para finanças do WhatsApp
export function useWhatsAppFinance(period?: 'today' | 'week' | 'month' | 'all') {
  return useQuery({
    queryKey: ['whatsapp-finance', period],
    queryFn: async () => {
      let query = supabase.from('command_finance').select('*');
      
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
    }
  });
}

// Hook para conversas
export function useWhatsAppConversations() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppConversation[];
    }
  });
  
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

// Hook para mensagens de uma conversa
export function useWhatsAppMessages(conversationId: string | null) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['whatsapp-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });
      if (error) throw error;
      return data as WhatsAppMessage[];
    },
    enabled: !!conversationId
  });
  
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

// Hook para anexos de uma conversa
export function useWhatsAppAttachments(conversationId: string | null) {
  return useQuery({
    queryKey: ['whatsapp-attachments', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('whatsapp_attachments')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WhatsAppAttachment[];
    },
    enabled: !!conversationId
  });
}

// Hook para estatísticas gerais
export function useWhatsAppStats() {
  return useQuery({
    queryKey: ['whatsapp-stats'],
    queryFn: async () => {
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
    refetchInterval: 30000 // Atualiza a cada 30 segundos
  });
}

// Hook para diagnósticos
export function useWebhookDiagnostics() {
  return useQuery({
    queryKey: ['webhook-diagnostics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_diagnostics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000
  });
}

// Mutations
export function useUpdateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WhatsAppConversation> }) => {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    }
  });
}

export function useCreateWhatsAppTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { title: string; description?: string; priority?: string; conversationId?: string }) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-stats'] });
    }
  });
}

export function useCreateWhatsAppFinance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      amount: number; 
      type: string; 
      description: string; 
      counterparty?: string;
      conversationId?: string 
    }) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-finance'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-stats'] });
    }
  });
}

export function useUpdateWhatsAppTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WhatsAppTask> }) => {
      const { error } = await supabase
        .from('command_tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-stats'] });
    }
  });
}

export function useDeleteWhatsAppTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('command_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-stats'] });
    }
  });
}
