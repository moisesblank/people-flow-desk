// ============================================
// 🛡️ FORTALEZA DIGITAL ULTRA v2.0
// SECURE WEBHOOK - VALIDAÇÃO MÁXIMA
// Implementa: C040, C041, C042, C044
// 5.000+ webhooks/minuto
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// CORS HEADERS
// ============================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok, x-stripe-signature, x-webhook-signature, x-correlation-id',
};

// ============================================
// TIPOS
// ============================================

interface WebhookConfig {
  provider: string;
  secretEnvVar: string;
  signatureHeader: string;
  signatureType: 'hmac_sha256' | 'hmac_sha512' | 'token_match' | 'stripe';
  validateTimestamp?: boolean;
  maxAgeSeconds?: number;
  allowedIPs?: string[];
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  signature?: string;
  timestamp?: number;
}

interface ProcessingResult {
  success: boolean;
  message: string;
  event_id?: string;
  processing_time_ms?: number;
}

// ============================================
// CONFIGURAÇÕES DE PROVEDORES
// ============================================

const WEBHOOK_CONFIGS: Record<string, WebhookConfig> = {
  hotmart: {
    provider: 'hotmart',
    secretEnvVar: 'HOTMART_HOTTOK',
    signatureHeader: 'x-hotmart-hottok',
    signatureType: 'token_match',
    validateTimestamp: false,
  },
  stripe: {
    provider: 'stripe',
    secretEnvVar: 'STRIPE_WEBHOOK_SECRET',
    signatureHeader: 'stripe-signature',
    signatureType: 'stripe',
    validateTimestamp: true,
    maxAgeSeconds: 300,
  },
  generic: {
    provider: 'generic',
    secretEnvVar: 'WEBHOOK_SECRET',
    signatureHeader: 'x-webhook-signature',
    signatureType: 'hmac_sha256',
    validateTimestamp: false,
  },
};

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Calcular HMAC-SHA256
 */
async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Comparação timing-safe
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Validar token simples (Hotmart)
 */
function validateTokenMatch(
  receivedToken: string | null,
  expectedToken: string
): ValidationResult {
  if (!receivedToken) {
    return { valid: false, error: 'Token ausente no header' };
  }
  
  if (!timingSafeEqual(receivedToken, expectedToken)) {
    return { valid: false, error: 'Token inválido' };
  }
  
  return { valid: true, signature: receivedToken };
}

/**
 * Validar HMAC-SHA256
 */
async function validateHmacSha256(
  payload: string,
  signature: string | null,
  secret: string
): Promise<ValidationResult> {
  if (!signature) {
    return { valid: false, error: 'Assinatura ausente' };
  }
  
  const expectedSignature = await hmacSha256(secret, payload);
  
  if (!timingSafeEqual(signature, expectedSignature)) {
    return { valid: false, error: 'Assinatura HMAC inválida' };
  }
  
  return { valid: true, signature };
}

/**
 * Validar assinatura Stripe
 */
async function validateStripeSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string,
  maxAgeSeconds: number = 300
): Promise<ValidationResult> {
  if (!signatureHeader) {
    return { valid: false, error: 'Header stripe-signature ausente' };
  }
  
  // Parse signature header
  const elements = signatureHeader.split(',');
  const sigMap: Record<string, string> = {};
  
  for (const element of elements) {
    const [key, value] = element.split('=');
    if (key && value) {
      sigMap[key] = value;
    }
  }
  
  const timestamp = parseInt(sigMap['t'], 10);
  const signature = sigMap['v1'];
  
  if (!timestamp || !signature) {
    return { valid: false, error: 'Formato de assinatura Stripe inválido' };
  }
  
  // Verificar timestamp
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;
  
  if (age > maxAgeSeconds) {
    return { valid: false, error: `Timestamp expirado (${age}s > ${maxAgeSeconds}s)`, timestamp };
  }
  
  // Calcular expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = await hmacSha256(secret, signedPayload);
  
  if (!timingSafeEqual(signature, expectedSignature)) {
    return { valid: false, error: 'Assinatura Stripe inválida', timestamp };
  }
  
  return { valid: true, signature, timestamp };
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const correlationId = req.headers.get('x-correlation-id') || requestId;
  
  // Criar cliente Supabase
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  try {
    // ============================================
    // 1. LER E VALIDAR PAYLOAD
    // ============================================
    
    const rawBody = await req.text();
    
    if (!rawBody || rawBody.length === 0) {
      console.error(`[Webhook ${requestId}] Payload vazio`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Payload vazio',
        request_id: requestId 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error(`[Webhook ${requestId}] JSON inválido`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'JSON inválido',
        request_id: requestId 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // ============================================
    // 2. DETECTAR PROVEDOR
    // ============================================
    
    const url = new URL(req.url);
    const providerParam = url.searchParams.get('provider') || 'generic';
    const config = WEBHOOK_CONFIGS[providerParam] || WEBHOOK_CONFIGS.generic;
    
    console.log(`[Webhook ${requestId}] Provedor: ${config.provider}`);
    
    // ============================================
    // 3. OBTER SECRET
    // ============================================
    
    const secret = Deno.env.get(config.secretEnvVar);
    
    if (!secret) {
      console.error(`[Webhook ${requestId}] Secret não configurado: ${config.secretEnvVar}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Configuração de segurança ausente',
        request_id: requestId 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // ============================================
    // 4. VALIDAR ASSINATURA
    // ============================================
    
    const signatureHeader = req.headers.get(config.signatureHeader);
    let validationResult: ValidationResult;
    
    switch (config.signatureType) {
      case 'token_match':
        validationResult = validateTokenMatch(signatureHeader, secret);
        break;
      case 'stripe':
        validationResult = await validateStripeSignature(
          rawBody, 
          signatureHeader, 
          secret,
          config.maxAgeSeconds
        );
        break;
      case 'hmac_sha256':
      default:
        validationResult = await validateHmacSha256(rawBody, signatureHeader, secret);
        break;
    }
    
    if (!validationResult.valid) {
      console.error(`[Webhook ${requestId}] Validação falhou: ${validationResult.error}`);
      
      // Log security event
      await supabase.from('security_events').insert({
        event_type: 'webhook_validation_failed',
        severity: 'warning',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
        payload: {
          provider: config.provider,
          error: validationResult.error,
          request_id: requestId,
        },
      });
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Validação de assinatura falhou',
        request_id: requestId 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    console.log(`[Webhook ${requestId}] Assinatura validada com sucesso`);
    
    // ============================================
    // 5. VERIFICAR IDEMPOTÊNCIA
    // ============================================
    
    const eventId = (payload.id as string) || 
                    (payload.transaction as string) || 
                    (payload.event_id as string) ||
                    requestId;
    
    const idempotencyKey = `${config.provider}:${eventId}`;
    
    // Verificar se já processamos este evento
    const { data: existingEvent } = await supabase
      .from('webhooks_queue')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    
    if (existingEvent) {
      console.log(`[Webhook ${requestId}] Evento duplicado: ${idempotencyKey}`);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Evento já processado',
        event_id: existingEvent.id,
        status: existingEvent.status,
        request_id: requestId 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // ============================================
    // 6. INSERIR NA FILA
    // ============================================
    
    const { data: queueEntry, error: queueError } = await supabase
      .from('webhooks_queue')
      .insert({
        source: config.provider,
        event_type: (payload.event as string) || (payload.type as string) || 'unknown',
        idempotency_key: idempotencyKey,
        payload: payload,
        headers: Object.fromEntries(req.headers.entries()),
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        correlation_id: correlationId,
        status: 'pending',
      })
      .select('id')
      .single();
    
    if (queueError) {
      console.error(`[Webhook ${requestId}] Erro ao inserir na fila:`, queueError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro ao processar webhook',
        request_id: requestId 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log(`[Webhook ${requestId}] Sucesso em ${processingTime}ms - Queue ID: ${queueEntry.id}`);
    
    // ============================================
    // 7. RESPOSTA DE SUCESSO
    // ============================================
    
    const result: ProcessingResult = {
      success: true,
      message: 'Webhook recebido e enfileirado',
      event_id: queueEntry.id,
      processing_time_ms: processingTime,
    };
    
    return new Response(JSON.stringify({
      ...result,
      request_id: requestId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[Webhook ${requestId}] Erro crítico:`, error);
    
    // Log security event
    try {
      await supabase.from('security_events').insert({
        event_type: 'webhook_critical_error',
        severity: 'error',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
          request_id: requestId,
          processing_time_ms: processingTime,
        },
      });
    } catch (logError) {
      console.error(`[Webhook ${requestId}] Erro ao logar:`, logError);
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Erro interno do servidor',
      request_id: requestId 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
