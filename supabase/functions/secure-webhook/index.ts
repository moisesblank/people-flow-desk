// ============================================
// 🛡️ SECURE WEBHOOK v1.0
// Webhook com validação de assinatura + idempotência
// Implementa: C040, C041, C042
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

// ============================================
// CORS
// ============================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok, x-stripe-signature, x-webhook-signature',
};

// ============================================
// TIPOS
// ============================================
interface WebhookConfig {
  provider: string;
  secretKey: string;
  signatureHeader: string;
  algorithm: 'sha256' | 'sha512';
  validateTimestamp?: boolean;
  maxAgeSeconds?: number;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  signature?: string;
  timestamp?: number;
}

// ============================================
// CONFIGURAÇÕES POR PROVEDOR
// ============================================
const WEBHOOK_CONFIGS: Record<string, WebhookConfig> = {
  hotmart: {
    provider: 'hotmart',
    secretKey: Deno.env.get('HOTMART_HOTTOK') || '',
    signatureHeader: 'x-hotmart-hottok',
    algorithm: 'sha256',
    validateTimestamp: false,
  },
  stripe: {
    provider: 'stripe',
    secretKey: Deno.env.get('STRIPE_WEBHOOK_SECRET') || '',
    signatureHeader: 'x-stripe-signature',
    algorithm: 'sha256',
    validateTimestamp: true,
    maxAgeSeconds: 300, // 5 minutos
  },
  generic: {
    provider: 'generic',
    secretKey: Deno.env.get('WEBHOOK_SECRET') || '',
    signatureHeader: 'x-webhook-signature',
    algorithm: 'sha256',
    validateTimestamp: false,
  },
};

// ============================================
// UTILIDADES DE VALIDAÇÃO
// ============================================

/**
 * Valida assinatura HMAC
 */
function validateHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512'
): boolean {
  try {
    const expectedSignature = hmac(algorithm, secret, payload, 'utf8', 'hex');
    
    // Comparação timing-safe
    if (signature.length !== expectedSignature.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    
    return result === 0;
  } catch (e) {
    console.error('[Webhook] Erro na validação HMAC:', e);
    return false;
  }
}

/**
 * Valida assinatura do Stripe (formato especial)
 */
function validateStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): ValidationResult {
  try {
    const elements = signatureHeader.split(',');
    const sigMap: Record<string, string> = {};
    
    for (const element of elements) {
      const [key, value] = element.split('=');
      sigMap[key] = value;
    }
    
    const timestamp = parseInt(sigMap['t'], 10);
    const signature = sigMap['v1'];
    
    if (!timestamp || !signature) {
      return { valid: false, error: 'Formato de assinatura inválido' };
    }
    
    // Verificar idade do timestamp
    const now = Math.floor(Date.now() / 1000);
    const age = now - timestamp;
    
    if (age > (WEBHOOK_CONFIGS.stripe.maxAgeSeconds || 300)) {
      return { valid: false, error: 'Timestamp expirado', timestamp };
    }
    
    // Calcular expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = hmac('sha256', secret, signedPayload, 'utf8', 'hex');
    
    // Comparação timing-safe
    if (signature.length !== expectedSignature.length) {
      return { valid: false, error: 'Assinatura inválida', timestamp };
    }
    
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    
    return { 
      valid: result === 0, 
      signature, 
      timestamp,
      error: result !== 0 ? 'Assinatura não confere' : undefined
    };
  } catch (e) {
    return { valid: false, error: `Erro: ${e}` };
  }
}

/**
 * Valida assinatura do Hotmart (token simples)
 */
function validateHotmartSignature(
  hottok: string | null,
  secret: string
): ValidationResult {
  if (!hottok) {
    return { valid: false, error: 'Token ausente' };
  }
  
  if (hottok !== secret) {
    return { valid: false, error: 'Token inválido' };
  }
  
  return { valid: true, signature: hottok };
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    // Ler body como text para validação de assinatura
    const rawBody = await req.text();
    let payload: any;
    
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error(`[Webhook ${requestId}] JSON inválido`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Payload JSON inválido' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // Detectar provedor
    const url = new URL(req.url);
    const providerParam = url.searchParams.get('provider') || 'generic';
    const config = WEBHOOK_CONFIGS[providerParam] || WEBHOOK_CONFIGS.generic;
    
    console.log(`[Webhook ${requestId}] Provedor: ${config.provider}`);
    
    // ============================================
    // VALIDAR ASSINATURA
    // ============================================
    let validationResult: ValidationResult;
    
    switch (config.provider) {
      case 'stripe':
        const stripeSig = req.headers.get('x-stripe-signature');
        if (!stripeSig) {
          validationResult = { valid: false, error: 'Header x-stripe-signature ausente' };
        } else {
          validationResult = validateStripeSignature(rawBody, stripeSig, config.secretKey);
        }
        break;
        
      case 'hotmart':
        const hottok = req.headers.get('x-hotmart-hottok');
        validationResult = validateHotmartSignature(hottok, config.secretKey);
        break;
        
      default:
        const genericSig = req.headers.get(config.signatureHeader);
        if (!genericSig) {
          validationResult = { valid: false, error: `Header ${config.signatureHeader} ausente` };
        } else {
          const isValid = validateHmacSignature(rawBody, genericSig, config.secretKey, config.algorithm);
          validationResult = { valid: isValid, signature: genericSig, error: isValid ? undefined : 'Assinatura inválida' };
        }
    }
    
    // Se inválido, rejeitar
    if (!validationResult.valid) {
      console.warn(`[Webhook ${requestId}] ❌ Validação falhou: ${validationResult.error}`);
      
      // Registrar tentativa inválida
      await supabase.rpc('log_security_event', {
        p_event_type: 'api_abuse',
        p_risk_score: 70,
        p_details: {
          type: 'webhook_signature_invalid',
          provider: config.provider,
          error: validationResult.error,
          ip: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for'),
        },
      });
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Assinatura inválida' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    console.log(`[Webhook ${requestId}] ✅ Assinatura válida`);
    
    // ============================================
    // VERIFICAR IDEMPOTÊNCIA
    // ============================================
    const eventId = payload.id || payload.event_id || payload.transaction_id || 
                    payload.data?.id || crypto.randomUUID();
    
    const { data: idempotencyCheck } = await supabase.rpc('check_webhook_idempotency', {
      p_provider: config.provider,
      p_event_id: eventId,
      p_event_type: payload.event || payload.type || payload.status || null,
      p_payload: payload,
      p_signature_valid: true,
    });
    
    if (idempotencyCheck?.is_duplicate) {
      console.log(`[Webhook ${requestId}] ⚡ Evento duplicado (idempotente): ${eventId}`);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Evento já processado',
        original_id: idempotencyCheck.original_id,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // ============================================
    // PROCESSAR EVENTO
    // ============================================
    console.log(`[Webhook ${requestId}] Processando evento: ${eventId}`);
    
    // Aqui você pode rotear para handlers específicos
    // Por enquanto, apenas marcamos como processado
    
    let processResult = { success: true, message: 'Evento recebido' };
    
    // Exemplo de roteamento por tipo de evento
    const eventType = payload.event || payload.type || payload.status || 'unknown';
    
    switch (eventType) {
      case 'PURCHASE_APPROVED':
      case 'purchase.approved':
      case 'purchase_approved':
        // Chamar o hotmart-webhook-processor existente
        // Ou processar diretamente aqui
        processResult = { success: true, message: 'Compra aprovada registrada' };
        break;
        
      case 'checkout.session.completed':
      case 'invoice.paid':
        // Processar pagamento Stripe
        processResult = { success: true, message: 'Pagamento Stripe registrado' };
        break;
        
      default:
        processResult = { success: true, message: 'Evento registrado para análise' };
    }
    
    // Marcar como processado
    await supabase.rpc('mark_webhook_processed', {
      p_provider: config.provider,
      p_event_id: eventId,
      p_status: processResult.success ? 'processed' : 'failed',
      p_response: processResult,
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Webhook ${requestId}] ✅ Concluído em ${duration}ms`);
    
    return new Response(JSON.stringify({
      success: processResult.success,
      message: processResult.message,
      event_id: eventId,
      processing_time_ms: duration,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`[Webhook ${requestId}] ❌ Erro:`, error);
    
    // Registrar erro
    await supabase.rpc('log_security_event', {
      p_event_type: 'api_abuse',
      p_risk_score: 50,
      p_details: {
        type: 'webhook_processing_error',
        error: errorMessage,
        request_id: requestId,
      },
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno',
      request_id: requestId,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
