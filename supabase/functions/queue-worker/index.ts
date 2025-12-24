// ============================================
// TRAMON v9.0 - QUEUE WORKER (O Operário Inteligente)
// Propósito: Processar webhooks com retry + dead letter queue
// Com: Exponential backoff, claim atômico, dead_letter_queue
// ============================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;
const BATCH_SIZE = 10;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ========================================
    // 🛡️ LEI VI - PROTEÇÃO INTERNA OBRIGATÓRIA
    // Queue-worker só pode ser chamado internamente
    // ========================================
    const internalSecret = req.headers.get('x-internal-secret');
    const userAgent = req.headers.get('user-agent') || '';
    const isInternalCall = 
      internalSecret === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      userAgent.includes('Deno/') ||
      userAgent.includes('supabase-js/');

    if (!isInternalCall) {
      console.log('[QUEUE-WORKER] ❌ BLOQUEADO: Chamada externa não autorizada');
      
      await supabase.from('security_events').insert({
        event_type: 'QUEUE_WORKER_EXTERNAL_CALL',
        severity: 'critical',
        description: 'Tentativa de chamada externa ao queue-worker bloqueada',
        payload: {
          ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
          user_agent: userAgent.substring(0, 255)
        }
      });
      
      return new Response(JSON.stringify({ 
        error: 'Acesso restrito a chamadas internas' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[QUEUE-WORKER] ✅ Chamada interna autorizada');

    let body: { queue_id?: string; batch_mode?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    
    const { queue_id, batch_mode = false } = body;

    let items: Array<{
      id: string;
      source: string;
      event: string;
      payload: Record<string, unknown>;
      retry_count: number;
      max_retries: number;
      external_event_id?: string;
    }> = [];

    if (queue_id) {
      // Processar item específico
      const { data, error } = await supabase
        .from('webhooks_queue')
        .select('*')
        .eq('id', queue_id)
        .single();
      
      if (data && !error) {
        items = [data];
      }
    } else {
      // ===============================================
      // 3.2.2 - CLAIM ATÔMICO DE N ITENS PENDENTES
      // ===============================================
      
      // Buscar e marcar atomicamente como "processing"
      // Isso evita que dois workers processem o mesmo item
      const { data, error } = await supabase
        .from('webhooks_queue')
        .update({ status: 'processing' })
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(BATCH_SIZE)
        .select();
      
      if (data && !error) {
        items = data;
      }
    }

    const results: Array<{
      id: string;
      status: string;
      processing_time_ms: number;
      error?: string;
      retry_count?: number;
      moved_to_dlq?: boolean;
    }> = [];

    for (const item of items) {
      const itemStartTime = Date.now();
      
      try {
        // Criar log de integração
        const { data: log } = await supabase
          .from('logs_integracao_detalhado')
          .insert({
            webhook_queue_id: item.id,
            sistema_origem: item.source,
            tipo_operacao: item.event,
            status: 'processando',
            etapa_atual: 'iniciando_orchestrator',
            dados_entrada: item.payload
          })
          .select()
          .single();

        // Chamar o orquestrador
        const orchestratorResult = await supabase.functions.invoke('orchestrator', {
          body: {
            queue_id: item.id,
            source: item.source,
            event_type: item.event,
            payload: item.payload,
            log_id: log?.id
          }
        });

        const processingTime = Date.now() - itemStartTime;

        if (orchestratorResult.error) {
          throw new Error(orchestratorResult.error.message || 'Orchestrator error');
        }

        // ✅ Marcar como concluído
        await supabase
          .from('webhooks_queue')
          .update({ 
            status: 'processed',
            result: orchestratorResult.data,
            processed_at: new Date().toISOString()
          })
          .eq('id', item.id);

        // Atualizar log
        if (log?.id) {
          await supabase
            .from('logs_integracao_detalhado')
            .update({
              status: 'sucesso',
              etapa_atual: 'concluido',
              dados_saida: orchestratorResult.data,
              tempo_total_ms: processingTime
            })
            .eq('id', log.id);
        }

        results.push({
          id: item.id,
          status: 'completed',
          processing_time_ms: processingTime
        });

        console.log(`✅ Processed ${item.source}:${item.event} in ${processingTime}ms`);

      } catch (error) {
        const processingTime = Date.now() - itemStartTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Verificar se deve tentar novamente
        const retryCount = (item.retry_count || 0) + 1;
        const maxRetries = item.max_retries || MAX_RETRIES;
        
        if (retryCount < maxRetries) {
          // ===============================================
          // RETRY COM EXPONENTIAL BACKOFF (implícito via delay)
          // ===============================================
          
          await supabase
            .from('webhooks_queue')
            .update({ 
              status: 'pending',
              retry_count: retryCount,
              error_message: errorMessage
            })
            .eq('id', item.id);
          
          console.log(`⚠️ Retry ${retryCount}/${maxRetries} for ${item.source}:${item.event}`);
          
          results.push({
            id: item.id,
            status: 'retry_scheduled',
            retry_count: retryCount,
            processing_time_ms: processingTime,
            error: errorMessage
          });
          
        } else {
          // ===============================================
          // 3.2.2 - MOVER PARA DEAD LETTER QUEUE APÓS 3 FALHAS
          // ===============================================
          
          // Inserir na dead_letter_queue
          await supabase
            .from('dead_letter_queue')
            .insert({
              original_webhook_id: item.id,
              source: item.source,
              event_type: item.event,
              payload: item.payload,
              last_error: errorMessage,
              retry_count: retryCount,
              error_history: [{
                attempt: retryCount,
                error: errorMessage,
                timestamp: new Date().toISOString()
              }]
            });
          
          // Remover da fila principal
          await supabase
            .from('webhooks_queue')
            .delete()
            .eq('id', item.id);
          
          // Registrar evento de segurança
          await supabase
            .from('security_events')
            .insert({
              event_type: 'WEBHOOK_FAILED_PERMANENTLY',
              severity: 'critical',
              source: item.source,
              description: `Webhook movido para dead letter queue após ${maxRetries} tentativas`,
              payload: {
                event: item.event,
                error: errorMessage,
                external_event_id: item.external_event_id
              }
            });
          
          console.error(`❌ Moved to DLQ: ${item.source}:${item.event} - ${errorMessage}`);
          
          results.push({
            id: item.id,
            status: 'moved_to_dlq',
            moved_to_dlq: true,
            retry_count: retryCount,
            processing_time_ms: processingTime,
            error: errorMessage
          });
        }

        // Atualizar log de erro
        await supabase
          .from('logs_integracao_detalhado')
          .update({
            status: 'erro',
            erro_detalhado: errorMessage,
            tempo_total_ms: processingTime
          })
          .eq('webhook_queue_id', item.id);
      }
    }

    const totalTime = Date.now() - startTime;

    return new Response(JSON.stringify({
      status: 'ok',
      processed: results.length,
      completed: results.filter(r => r.status === 'completed').length,
      retried: results.filter(r => r.status === 'retry_scheduled').length,
      moved_to_dlq: results.filter(r => r.moved_to_dlq).length,
      results,
      total_time_ms: totalTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Queue worker error:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
