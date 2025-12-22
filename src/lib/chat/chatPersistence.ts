// ============================================
// 💾 PERSISTÊNCIA DE CHAT - MATRIZ 2300
// Batch Insert + Retenção 24h + Cleanup
// ============================================

import { supabase } from '@/integrations/supabase/client';
import { LIVE_5K_CONFIG } from '@/config/performance-5k';
import type { LiveMessage } from '@/config/performance-5k';

// ============================================
// BUFFER DE MENSAGENS PARA BATCH INSERT
// ============================================

interface MessageBuffer {
  liveId: string;
  messages: LiveMessage[];
  lastFlush: number;
}

const messageBuffers = new Map<string, MessageBuffer>();

// ============================================
// FUNÇÕES DE PERSISTÊNCIA
// ============================================

/**
 * Adiciona mensagem ao buffer para persistência batch
 */
export function addMessageToBuffer(liveId: string, message: LiveMessage): void {
  let buffer = messageBuffers.get(liveId);
  
  if (!buffer) {
    buffer = {
      liveId,
      messages: [],
      lastFlush: Date.now()
    };
    messageBuffers.set(liveId, buffer);
  }
  
  buffer.messages.push(message);
  
  // Flush se atingir tamanho do batch
  if (buffer.messages.length >= LIVE_5K_CONFIG.CHAT.BATCH_PERSIST_SIZE) {
    flushBuffer(liveId);
  }
}

/**
 * Flush do buffer - persiste mensagens no banco
 */
export async function flushBuffer(liveId: string): Promise<void> {
  const buffer = messageBuffers.get(liveId);
  
  if (!buffer || buffer.messages.length === 0) {
    return;
  }
  
  const messagesToPersist = [...buffer.messages];
  buffer.messages = [];
  buffer.lastFlush = Date.now();
  
  try {
    // Usar upsert para evitar duplicatas - tipagem genérica para tabela dinâmica
    const { error } = await supabase
      .from('live_chat_messages' as any)
      .upsert(
        messagesToPersist.map(msg => ({
          id: msg.id,
          live_id: liveId,
          user_id: msg.user_id,
          user_name: msg.user_name,
          avatar_url: msg.avatar_url,
          message: msg.message,
          is_highlighted: msg.is_highlighted || false,
          is_moderator: msg.is_moderator || false,
          created_at: msg.created_at
        })),
        { onConflict: 'id' }
      );
    
    if (error) {
      console.error('[PERSISTÊNCIA] Erro ao salvar mensagens:', error);
      // Re-adicionar ao buffer em caso de erro
      buffer.messages = [...messagesToPersist, ...buffer.messages];
    } else {
      console.log(`[PERSISTÊNCIA] ${messagesToPersist.length} mensagens salvas para live ${liveId}`);
    }
  } catch (err) {
    console.error('[PERSISTÊNCIA] Erro crítico:', err);
    buffer.messages = [...messagesToPersist, ...buffer.messages];
  }
}

/**
 * Flush de todos os buffers
 */
export async function flushAllBuffers(): Promise<void> {
  const promises: Promise<void>[] = [];
  
  for (const liveId of messageBuffers.keys()) {
    promises.push(flushBuffer(liveId));
  }
  
  await Promise.all(promises);
}

/**
 * Carrega histórico recente de mensagens
 */
export async function loadRecentMessages(
  liveId: string,
  limit: number = LIVE_5K_CONFIG.CHAT.MAX_VISIBLE_MESSAGES
): Promise<LiveMessage[]> {
  try {
    const { data, error } = await supabase
      .from('live_chat_messages' as any)
      .select('*')
      .eq('live_id', liveId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('[PERSISTÊNCIA] Erro ao carregar histórico:', error);
      return [];
    }
    
    return ((data || []) as any[]).reverse().map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.user_name,
      avatar_url: row.avatar_url,
      message: row.message,
      created_at: row.created_at,
      is_highlighted: row.is_highlighted,
      is_moderator: row.is_moderator
    }));
  } catch (err) {
    console.error('[PERSISTÊNCIA] Erro crítico ao carregar:', err);
    return [];
  }
}

/**
 * Limpa mensagens antigas (retenção 24h)
 */
export async function cleanupOldMessages(liveId?: string): Promise<number> {
  const cutoffTime = new Date(Date.now() - LIVE_5K_CONFIG.CHAT.MESSAGE_RETENTION_MS).toISOString();
  
  try {
    let query = supabase
      .from('live_chat_messages' as any)
      .delete()
      .lt('created_at', cutoffTime);
    
    if (liveId) {
      query = query.eq('live_id', liveId);
    }
    
    const { error, count } = await query;
    
    if (error) {
      console.error('[PERSISTÊNCIA] Erro ao limpar mensagens antigas:', error);
      return 0;
    }
    
    console.log(`[PERSISTÊNCIA] ${count || 0} mensagens antigas removidas`);
    return count || 0;
  } catch (err) {
    console.error('[PERSISTÊNCIA] Erro crítico na limpeza:', err);
    return 0;
  }
}

/**
 * Obtém estatísticas do buffer
 */
export function getBufferStats(): { liveId: string; pending: number; lastFlush: number }[] {
  const stats: { liveId: string; pending: number; lastFlush: number }[] = [];
  
  for (const [liveId, buffer] of messageBuffers) {
    stats.push({
      liveId,
      pending: buffer.messages.length,
      lastFlush: buffer.lastFlush
    });
  }
  
  return stats;
}

/**
 * Limpa buffer específico
 */
export function clearBuffer(liveId: string): void {
  messageBuffers.delete(liveId);
}

// ============================================
// TIMERS AUTOMÁTICOS
// ============================================

// Flush automático a cada intervalo configurado
setInterval(() => {
  const now = Date.now();
  
  for (const [liveId, buffer] of messageBuffers) {
    // Flush se passou tempo suficiente desde último flush
    if (now - buffer.lastFlush >= LIVE_5K_CONFIG.CHAT.BATCH_PERSIST_INTERVAL) {
      flushBuffer(liveId);
    }
  }
}, LIVE_5K_CONFIG.CHAT.BATCH_PERSIST_INTERVAL);

// Cleanup de mensagens antigas a cada hora
setInterval(() => {
  cleanupOldMessages();
}, 3600000);

// Flush ao fechar página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushAllBuffers();
  });
}

console.log('[PERSISTÊNCIA 2300] 💾 Sistema de persistência batch carregado');
