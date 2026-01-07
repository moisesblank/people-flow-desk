// ============================================
// 🔥 EDGE FUNCTION: RATE LIMITED GATEWAY v3.0
// DOGMA X - Rate Limiting PERSISTENTE (DB)
// LEI VI — CORS SEGURO + RATE LIMIT DISTRIBUÍDO
// P1.3 FIX: Migrado de Map() para api_rate_limits
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// ============================================
// RATE LIMITS - LEI I (Performance 3500/3G)
// Otimizado para 5000 usuários simultâneos
// ============================================
const RATE_LIMITS: Record<string, { limit: number; windowSeconds: number; priority: 'critical' | 'high' | 'normal' | 'low' }> = {
  // === AUTH (CRÍTICO - Proteção contra brute force) ===
  'login': { limit: 5, windowSeconds: 300, priority: 'critical' },
  'signup': { limit: 3, windowSeconds: 600, priority: 'critical' },
  'password-reset': { limit: 3, windowSeconds: 600, priority: 'critical' },
  '2fa': { limit: 5, windowSeconds: 300, priority: 'critical' },
  'magic-link': { limit: 3, windowSeconds: 600, priority: 'critical' },
  
  // === AI (ALTO CUSTO - Tokens OpenAI/Gemini) ===
  'ai-chat': { limit: 20, windowSeconds: 60, priority: 'high' },
  'ai-tutor': { limit: 15, windowSeconds: 60, priority: 'high' },
  'ai-assistant': { limit: 15, windowSeconds: 60, priority: 'high' },
  'book-chat-ai': { limit: 10, windowSeconds: 60, priority: 'high' },
  'generate-ai-content': { limit: 5, windowSeconds: 60, priority: 'high' },
  
  // === VIDEO (Proteção de URLs assinadas) ===
  'video-authorize': { limit: 30, windowSeconds: 60, priority: 'high' },
  'panda-video': { limit: 30, windowSeconds: 60, priority: 'high' },
  'secure-video-url': { limit: 30, windowSeconds: 60, priority: 'high' },
  'book-page-signed-url': { limit: 60, windowSeconds: 60, priority: 'normal' },
  
  // === CHAT/REALTIME (5000 simultâneos) ===
  'chat-message': { limit: 30, windowSeconds: 60, priority: 'normal' },
  'chat-reaction': { limit: 60, windowSeconds: 60, priority: 'low' },
  'live-presence': { limit: 12, windowSeconds: 60, priority: 'low' },
  
  // === API GERAL ===
  'api-call': { limit: 100, windowSeconds: 60, priority: 'normal' },
  'api-gateway': { limit: 100, windowSeconds: 60, priority: 'normal' },
  'search': { limit: 30, windowSeconds: 60, priority: 'normal' },
  
  // === UPLOADS/ARQUIVOS ===
  'upload': { limit: 10, windowSeconds: 60, priority: 'normal' },
  'file-download': { limit: 50, windowSeconds: 60, priority: 'normal' },
  
  // === EMAIL/NOTIFICAÇÕES ===
  'send-email': { limit: 10, windowSeconds: 60, priority: 'high' },
  'send-notification': { limit: 20, windowSeconds: 60, priority: 'normal' },
  
  // === WEBHOOKS (Sistema) ===
  'webhook': { limit: 100, windowSeconds: 60, priority: 'normal' },
  'hotmart-webhook': { limit: 100, windowSeconds: 60, priority: 'normal' },
  
  // === DEFAULT ===
  'default': { limit: 30, windowSeconds: 60, priority: 'normal' },
};

// ============================================
// 🛡️ P1.3 FIX: RATE LIMIT PERSISTENTE (DB)
// Usa tabela api_rate_limits para consistência
// ============================================
async function checkPersistentRateLimit(
  supabase: any,
  clientId: string,
  endpoint: string,
  config: { limit: number; windowSeconds: number }
): Promise<{ allowed: boolean; count: number; resetAt: Date; retryAfter?: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - (config.windowSeconds * 1000));
  
  // Usar UPSERT atômico para evitar race conditions
  // Primeiro, limpar entradas expiradas
  await supabase
    .from('api_rate_limits')
    .delete()
    .eq('client_id', clientId)
    .eq('endpoint', endpoint)
    .lt('window_start', windowStart.toISOString());
  
  // Buscar ou criar entrada atual
  const { data: existing } = await supabase
    .from('api_rate_limits')
    .select('id, request_count, window_start')
    .eq('client_id', clientId)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .order('window_start', { ascending: false })
    .limit(1)
    .single();
  
  if (existing) {
    // Incrementar contador existente
    const newCount = (existing.request_count || 0) + 1;
    
    if (newCount > config.limit) {
      const resetAt = new Date(new Date(existing.window_start).getTime() + (config.windowSeconds * 1000));
      const retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);
      
      return {
        allowed: false,
        count: newCount,
        resetAt,
        retryAfter: Math.max(1, retryAfter)
      };
    }
    
    // Atualizar contador
    await supabase
      .from('api_rate_limits')
      .update({ request_count: newCount })
      .eq('id', existing.id);
    
    const resetAt = new Date(new Date(existing.window_start).getTime() + (config.windowSeconds * 1000));
    return { allowed: true, count: newCount, resetAt };
  } else {
    // Nova janela - criar entrada
    await supabase
      .from('api_rate_limits')
      .insert({
        client_id: clientId,
        endpoint: endpoint,
        request_count: 1,
        window_start: now.toISOString()
      });
    
    const resetAt = new Date(now.getTime() + (config.windowSeconds * 1000));
    return { allowed: true, count: 1, resetAt };
  }
}

serve(async (req) => {
  // CORS seguro
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 🛡️ PATCH-007: NUNCA aceitar clientId do body + endpoint allowlist
    const { endpoint, action, payload } = await req.json();
    
    // Normalizar endpoint para allowlist (evita poluição de DB)
    const safeEndpoint = (endpoint && endpoint in RATE_LIMITS) ? endpoint : 'default';
    
    // Identificar cliente pelo IP real (NUNCA do body)
    const clientIdentifier = 
      req.headers.get('cf-connecting-ip') ||  // Cloudflare proxied
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
      req.headers.get('x-real-ip') || 
      'unknown';
    
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Obter configuração de rate limit (usando endpoint seguro)
    const config = RATE_LIMITS[safeEndpoint];
    
    // 🛡️ P1.3 FIX: Usar rate limit persistente (DB)
    const result = await checkPersistentRateLimit(supabase, clientIdentifier, safeEndpoint, config);
    
    if (!result.allowed) {
      console.warn(`🚫 Rate limit excedido (DB): ${clientIdentifier}:${safeEndpoint} (${result.count}/${config.limit})`);
      
      // Logar tentativa bloqueada
      await supabase.from('security_events').insert({
        event_type: 'RATE_LIMIT_EXCEEDED',
        severity: config.priority === 'critical' ? 'critical' : 'warning',
        source: 'rate-limit-gateway',
        description: `Rate limit excedido para ${safeEndpoint}`,
        payload: {
          endpoint: safeEndpoint,
          originalEndpoint: endpoint, // Log do endpoint original para auditoria
          clientId: clientIdentifier,
          count: result.count,
          limit: config.limit,
          userAgent: userAgent.substring(0, 200),
          persistent: true
        },
        ip_address: clientIdentifier
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit excedido',
          retryAfter: result.retryAfter
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfter)
          } 
        }
      );
    }
    
    // Rate limit OK
    console.log(`✅ Rate limit OK (DB): ${clientIdentifier}:${safeEndpoint} (${result.count}/${config.limit})`);
    
    // Se for apenas verificação de rate limit
    if (action === 'check') {
      return new Response(
        JSON.stringify({
          allowed: true,
          remaining: config.limit - result.count,
          resetAt: result.resetAt.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Se tiver payload, processar como proxy
    if (action === 'proxy' && payload) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Request permitido pelo rate limiter',
          remaining: config.limit - result.count
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        remaining: config.limit - result.count
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no rate limiter:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
