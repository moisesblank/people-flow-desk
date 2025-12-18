// 🧠 TRAMON v8 - QUEUE WORKER (O Operário Inteligente)
// Propósito: Processar webhooks da fila e acionar o orquestrador
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const body = await req.json();
    const { queue_id } = body;

    // Se recebeu um ID específico, processar apenas ele
    // Senão, buscar pendentes na fila
    let items = [];

    if (queue_id) {
      const { data, error } = await supabase
        .from('webhooks_queue')
        .select('*')
        .eq('id', queue_id)
        .single();
      
      if (data && !error) {
        items = [data];
      }
    } else {
      // Buscar até 10 itens pendentes para processamento em lote
      const { data, error } = await supabase
        .from('webhooks_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);
      
      if (data && !error) {
        items = data;
      }
    }

    const results = [];

    for (const item of items) {
      const itemStartTime = Date.now();
      
      try {
        // Marcar como processando
        await supabase
          .from('webhooks_queue')
          .update({ status: 'processing' })
          .eq('id', item.id);

        // Criar log de integração
        const { data: log } = await supabase
          .from('logs_integracao_detalhado')
          .insert({
            webhook_queue_id: item.id,
            source: item.source,
            event: item.event,
            status: 'processando',
            etapa_atual: 'iniciando_orchestrator',
            payload_entrada: item.payload
          })
          .select()
          .single();

        // Chamar o orquestrador
        const orchestratorResult = await supabase.functions.invoke('orchestrator', {
          body: {
            queue_id: item.id,
            source: item.source,
            event: item.event,
            data: item.payload,
            log_id: log?.id
          }
        });

        const processingTime = Date.now() - itemStartTime;

        if (orchestratorResult.error) {
          throw new Error(orchestratorResult.error.message);
        }

        // Marcar como concluído
        await supabase
          .from('webhooks_queue')
          .update({ 
            status: 'completed',
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
              payload_saida: orchestratorResult.data,
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
        const maxRetries = item.max_retries || 3;
        
        if (retryCount < maxRetries) {
          // Marcar para retry
          await supabase
            .from('webhooks_queue')
            .update({ 
              status: 'pending',
              retry_count: retryCount,
              error_message: errorMessage
            })
            .eq('id', item.id);
          
          console.log(`⚠️ Retry ${retryCount}/${maxRetries} for ${item.source}:${item.event}`);
        } else {
          // Marcar como falha definitiva
          await supabase
            .from('webhooks_queue')
            .update({ 
              status: 'failed',
              error_message: errorMessage,
              processed_at: new Date().toISOString()
            })
            .eq('id', item.id);
          
          console.error(`❌ Failed permanently: ${item.source}:${item.event} - ${errorMessage}`);
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

        results.push({
          id: item.id,
          status: 'failed',
          error: errorMessage,
          retry_count: retryCount,
          processing_time_ms: processingTime
        });
      }
    }

    const totalTime = Date.now() - startTime;

    return new Response(JSON.stringify({
      status: 'ok',
      processed: results.length,
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
