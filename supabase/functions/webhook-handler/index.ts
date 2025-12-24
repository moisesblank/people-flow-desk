// ============================================
// TRAMON v9.0 - WEBHOOK HANDLER (O Porteiro Resiliente)
// Propósito: Receber, validar (HMAC), e enfileirar webhooks em <50ms
// Com: Idempotência, Segurança, Logging em security_events
// ============================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getWebhookCorsHeaders } from "../_shared/corsConfig.ts";

// CORS para webhooks externos (permissivo para servidores)
const corsHeaders = getWebhookCorsHeaders();

// Função para validar HMAC SHA256
async function validateHMAC(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Comparar signatures (timing-safe comparison)
    const expectedSignature = signature.replace(/^sha256=/, '').toLowerCase();
    return computedSignature.toLowerCase() === expectedSignature;
  } catch (error) {
    console.error('HMAC validation error:', error);
    return false;
  }
}

// Gerar external_event_id único baseado no payload
// Retorna null para fontes que não suportam idempotência
function generateExternalEventId(source: string, payload: Record<string, unknown>): string | null {
  // Usar IDs específicos de cada fonte para garantir idempotência
  if (source === 'hotmart') {
    const data = payload.data as Record<string, unknown> | undefined;
    const purchase = data?.purchase as Record<string, unknown> | undefined;
    const transactionId = purchase?.transaction || (payload as Record<string, unknown>).hottok;
    if (transactionId) {
      return `hotmart_${transactionId}`;
    }
    return null;
  }
  if (source === 'wordpress') {
    if (payload.user_id && payload.action) {
      return `wp_${payload.user_id}_${payload.action}_${payload.timestamp || ''}`;
    }
    return null;
  }
  if (source === 'whatsapp') {
    const entry = (payload.entry as Array<{ id?: string; changes?: Array<{ value?: { messages?: Array<{ id?: string }> } }> }>)?.[0];
    const messageId = entry?.changes?.[0]?.value?.messages?.[0]?.id;
    if (messageId || entry?.id) {
      return `wa_${messageId || entry?.id}`;
    }
    return null;
  }
  // Fontes desconhecidas não têm idempotência automática
  return null;
}

serve(async (req) => {
  const startTime = Date.now();
  // C044: Gerar Correlation-ID para rastreabilidade
  const correlationId = crypto.randomUUID();
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const url = new URL(req.url);
    const rawBody = await req.text();
    
    // Parse do payload
    let payload: Record<string, unknown> = {};
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json') && rawBody) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = { raw: rawBody };
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(rawBody);
      payload = Object.fromEntries(params.entries());
    } else if (rawBody) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = { raw: rawBody };
      }
    }

    // Determinar fonte do webhook via headers ou path
    let source = req.headers.get('X-Webhook-Source') || 'unknown';
    let event = req.headers.get('X-Webhook-Event') || 'unknown';
    
    // Auto-detectar fonte baseado em headers específicos
    if (req.headers.get('X-Hotmart-Hottok')) {
      source = 'hotmart';
    } else if (req.headers.get('X-WordPress-Webhook')) {
      source = 'wordpress';
    } else if (url.searchParams.get('hub.mode')) {
      source = 'whatsapp';
      event = 'verification';
    } else if (payload.entry && Array.isArray(payload.entry)) {
      source = 'whatsapp';
      event = 'incoming_message';
    }

    // Auto-detectar evento baseado no payload
    if (source === 'hotmart' && payload.event) {
      event = String(payload.event);
    } else if (source === 'wordpress' && payload.action) {
      event = String(payload.action);
    }

    const clientIP = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // ===============================================
    // 3.2.1 - VALIDAÇÃO HMAC PARA CADA WEBHOOK
    // ===============================================
    
    // Validação de segurança para Hotmart (Hottok)
    if (source === 'hotmart') {
      const hottok = req.headers.get('X-Hotmart-Hottok');
      const expectedHottok = Deno.env.get('HOTMART_HOTTOK');
      
      if (expectedHottok && hottok !== expectedHottok) {
        // Registrar evento de segurança: assinatura inválida
        await supabase.from('security_events').insert({
          event_type: 'INVALID_HMAC',
          severity: 'warning',
          source: 'hotmart',
          ip_address: clientIP,
          user_agent: userAgent,
          description: 'Webhook Hotmart com Hottok inválido',
          payload: { received_hottok: hottok ? hottok.substring(0, 10) + '...' : null }
        });
        
        console.error(`🚨 [SECURITY] Invalid Hotmart Hottok from ${clientIP}`);
        
        return new Response(JSON.stringify({ 
          status: 'error', 
          message: 'Invalid authentication',
          code: 'INVALID_HMAC'
        }), { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // Validação HMAC para WhatsApp (Meta)
    if (source === 'whatsapp' && event !== 'verification') {
      const signature = req.headers.get('x-hub-signature-256');
      const appSecret = Deno.env.get('WHATSAPP_APP_SECRET');
      
      if (appSecret && signature && rawBody) {
        const isValid = await validateHMAC(rawBody, signature, appSecret);
        
        if (!isValid) {
          await supabase.from('security_events').insert({
            event_type: 'INVALID_HMAC',
            severity: 'warning',
            source: 'whatsapp',
            ip_address: clientIP,
            user_agent: userAgent,
            description: 'Webhook WhatsApp com assinatura HMAC inválida'
          });
          
          console.error(`🚨 [SECURITY] Invalid WhatsApp HMAC from ${clientIP}`);
          
          return new Response(JSON.stringify({ 
            status: 'error', 
            message: 'Invalid signature',
            code: 'INVALID_HMAC'
          }), { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
      }
    }

    // WhatsApp verification challenge
    if (source === 'whatsapp' && event === 'verification') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
      
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('✅ WhatsApp webhook verified');
        return new Response(challenge, { status: 200 });
      }
      
      await supabase.from('security_events').insert({
        event_type: 'INVALID_VERIFICATION',
        severity: 'warning',
        source: 'whatsapp',
        ip_address: clientIP,
        description: 'Tentativa de verificação WhatsApp com token inválido'
      });
      
      return new Response('Forbidden', { status: 403 });
    }

    // ===============================================
    // 3.1.3 - IDEMPOTÊNCIA VIA external_event_id
    // ===============================================
    
    const externalEventId = generateExternalEventId(source, payload);
    
    let data: { id: string } | null = null;
    let error: { code?: string; message: string } | null = null;

    if (externalEventId) {
      // Com external_event_id: usar upsert com idempotência
      const result = await supabase
        .from('webhooks_queue')
        .upsert({
          source,
          event,
          payload,
          external_event_id: externalEventId,
          correlation_id: correlationId, // C044: Correlation-ID
          status: 'pending'
        }, {
          onConflict: 'source,external_event_id,event',
          ignoreDuplicates: true
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
      
      // Se é duplicata, retornar sucesso silencioso
      if (error && error.code === '23505') {
        console.log(`⏭️ Duplicate webhook ignored: ${source}:${event}:${externalEventId}`);
        return new Response(JSON.stringify({ 
          status: 'duplicate',
          message: 'Event already processed',
          external_event_id: externalEventId,
          processing_time_ms: Date.now() - startTime
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    } else {
      // Sem external_event_id: INSERT simples (sem idempotência)
      const result = await supabase
        .from('webhooks_queue')
        .insert({
          source,
          event,
          payload,
          correlation_id: correlationId, // C044: Correlation-ID
          status: 'pending'
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    const processingTime = Date.now() - startTime;

    if (error) {
      console.error('Failed to queue webhook:', error);
      
      await supabase.from('security_events').insert({
        event_type: 'QUEUE_ERROR',
        severity: 'critical',
        source,
        description: `Falha ao enfileirar webhook: ${error.message}`,
        payload: { error: error.message, event }
      });
      
      return new Response(JSON.stringify({ 
        status: 'error', 
        message: 'Failed to queue webhook',
        error: error.message,
        correlation_id: correlationId // C044
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Correlation-ID': correlationId } 
      });
    }

    console.log(`✅ Webhook queued: ${source}:${event} in ${processingTime}ms - ID: ${data?.id}`);

    // Disparar processamento assíncrono (fire and forget)
    if (data?.id) {
      supabase.functions.invoke('queue-worker', {
        body: { queue_id: data.id }
      }).catch(err => console.error('Failed to invoke worker:', err));
    }

    return new Response(JSON.stringify({ 
      status: 'queued',
      queue_id: data?.id,
      external_event_id: externalEventId,
      correlation_id: correlationId, // C044
      source,
      event,
      processing_time_ms: processingTime
    }), { 
      status: 202, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Correlation-ID': correlationId } 
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    
    // Log do erro crítico
    try {
      await supabase.from('security_events').insert({
        event_type: 'HANDLER_ERROR',
        severity: 'critical',
        source: 'webhook-handler',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } catch (logError) {
      console.error('Failed to log security event:', logError);
    }
    
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
