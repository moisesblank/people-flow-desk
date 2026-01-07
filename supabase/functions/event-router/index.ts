// ============================================
// TESTAMENTO DA SINGULARIDADE v5.0
// SISTEMA NERVOSO DIVINO - Roteador de Eventos
// Processa eventos pendentes e delega para funções específicas
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// Mapeamento de eventos para Edge Functions processadoras
const EVENT_HANDLERS: Record<string, string> = {
  "payment.succeeded": "c-create-beta-user",
  "payment.failed": "c-handle-payment-failure",
  "payment.refunded": "c-handle-refund",
  "access.granted": "c-grant-access",
  "access.revoked": "c-revoke-access",
  "lesson.completed": "c-grant-xp",
  "quiz.passed": "c-grant-xp",
  "correct.answer": "c-grant-xp",
  "daily.login": "c-grant-xp",
  "streak.achieved": "c-grant-xp",
  "level.up": "c-handle-level-up",
  "badge.earned": "c-handle-badge",
  "churn.risk.detected": "c-handle-churn-risk",
};

serve(async (req) => {
  // LEI VI: CORS dinâmico via allowlist centralizado
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ========================================
    // 🛡️ LEI VI - PROTEÇÃO INTERNA (P0-3 CORRIGIDO)
    // REMOVIDO fallback de User-Agent - apenas x-internal-secret
    // ========================================
    const internalSecret = req.headers.get('x-internal-secret');
    const userAgent = req.headers.get('user-agent') || '';
    const INTERNAL_SECRET = Deno.env.get('INTERNAL_SECRET');
    
    // CRÍTICO: Verificar se INTERNAL_SECRET está configurado
    if (!INTERNAL_SECRET) {
      console.error("🚨 [SECURITY] INTERNAL_SECRET não configurado!");
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Validação ESTRITA: apenas x-internal-secret válido (SEM fallback de User-Agent)
    const isInternalCall = internalSecret === INTERNAL_SECRET;

    if (!isInternalCall) {
      console.log('[EVENT-ROUTER] ❌ BLOQUEADO: Chamada externa não autorizada');
      
      await supabaseAdmin.from('security_events').insert({
        event_type: 'EVENT_ROUTER_EXTERNAL_CALL',
        severity: 'critical',
        description: 'Tentativa de chamada externa ao event-router bloqueada',
        payload: {
          ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
          user_agent: userAgent.substring(0, 255)
        }
      });
      
      return new Response(JSON.stringify({ 
        error: 'Acesso restrito a chamadas internas' 
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log('[EVENT-ROUTER] ✅ Chamada interna autorizada');

    // Registrar este consumidor
    const consumerId = "event-router-main";
    await supabaseAdmin.from("event_consumers").upsert({
      consumer_name: consumerId,
      last_heartbeat: new Date().toISOString(),
      is_active: true,
    }, { onConflict: "consumer_name" });

    // Buscar próximo evento pendente
    const { data: event, error: claimError } = await supabaseAdmin.rpc("claim_next_event", {
      p_consumer_id: consumerId,
    });

    if (claimError) {
      console.error("❌ Erro ao buscar evento:", claimError);
      throw claimError;
    }

    if (!event) {
      return new Response(
        JSON.stringify({ message: "No pending events" }),
        { headers: corsHeaders }
      );
    }

    console.log(`🔄 Processando evento: ${event.name} (ID: ${event.id})`);

    // Identificar handler para este evento
    const handlerFunction = EVENT_HANDLERS[event.name];
    
    if (!handlerFunction) {
      console.log(`⚠️ Nenhum handler para evento: ${event.name}`);
      // Marcar como processado mesmo sem handler
      await supabaseAdmin.rpc("complete_event", {
        p_event_id: event.id,
        p_success: true,
        p_error_message: null,
      });
      return new Response(
        JSON.stringify({ message: "Event has no handler", event_name: event.name }),
        { headers: corsHeaders }
      );
    }

    // Chamar a Edge Function correspondente COM x-internal-secret (P0-3)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    const functionUrl = `${supabaseUrl}/functions/v1/${handlerFunction}`;
    
    console.log(`📡 Delegando para: ${handlerFunction}`);

    const handlerResponse = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
        "x-internal-secret": INTERNAL_SECRET || "",
      },
      body: JSON.stringify({ event }),
    });

    const handlerResult = await handlerResponse.json();

    if (!handlerResponse.ok) {
      console.error(`❌ Handler ${handlerFunction} falhou:`, handlerResult);
      
      // Marcar evento como falho
      await supabaseAdmin.rpc("complete_event", {
        p_event_id: event.id,
        p_success: false,
        p_error_message: handlerResult.error || "Handler failed",
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: handlerResult.error,
          event_id: event.id 
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Marcar evento como processado com sucesso
    await supabaseAdmin.rpc("complete_event", {
      p_event_id: event.id,
      p_success: true,
      p_error_message: null,
    });

    console.log(`✅ Evento ${event.id} processado com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: event.id,
        handler: handlerFunction,
        result: handlerResult 
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("❌ Erro no event-router:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});
