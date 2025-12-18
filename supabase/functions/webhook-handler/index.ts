// 🧠 TRAMON v8 - WEBHOOK HANDLER (O Porteiro Resiliente)
// Propósito: Receber, validar e enfileirar webhooks em <50ms
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-source, x-webhook-event, x-hotmart-hottok',
};

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Extrair informações do webhook
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    
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
    }

    // Parse do payload
    let payload: Record<string, unknown> = {};
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      payload = Object.fromEntries(formData.entries());
    } else {
      const text = await req.text();
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
    }

    // Auto-detectar evento baseado no payload
    if (source === 'hotmart' && payload.event) {
      event = String(payload.event);
    } else if (source === 'wordpress' && payload.action) {
      event = String(payload.action);
    } else if (payload.entry && Array.isArray(payload.entry)) {
      source = 'whatsapp';
      event = 'incoming_message';
    }

    // Validação de segurança para Hotmart
    if (source === 'hotmart') {
      const hottok = req.headers.get('X-Hotmart-Hottok');
      const expectedHottok = Deno.env.get('HOTMART_HOTTOK');
      
      if (hottok && expectedHottok && hottok !== expectedHottok) {
        console.error('Invalid Hotmart Hottok');
        return new Response(JSON.stringify({ 
          status: 'error', 
          message: 'Invalid authentication' 
        }), { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // WhatsApp verification challenge
    if (source === 'whatsapp' && event === 'verification') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
      
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('WhatsApp webhook verified');
        return new Response(challenge, { status: 200 });
      }
      
      return new Response('Forbidden', { status: 403 });
    }

    // Enfileirar webhook para processamento assíncrono
    const { data, error } = await supabase
      .from('webhooks_queue')
      .insert({
        source,
        event,
        payload,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to queue webhook:', error);
      return new Response(JSON.stringify({ 
        status: 'error', 
        message: 'Failed to queue webhook',
        error: error.message 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Webhook queued: ${source}:${event} in ${processingTime}ms - ID: ${data.id}`);

    // Disparar processamento assíncrono (fire and forget)
    supabase.functions.invoke('queue-worker', {
      body: { queue_id: data.id }
    }).catch(err => console.error('Failed to invoke worker:', err));

    return new Response(JSON.stringify({ 
      status: 'queued',
      queue_id: data.id,
      source,
      event,
      processing_time_ms: processingTime
    }), { 
      status: 202, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
