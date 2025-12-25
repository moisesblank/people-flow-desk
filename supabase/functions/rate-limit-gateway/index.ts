// ============================================
// 🔥 EDGE FUNCTION: RATE LIMITED GATEWAY v2.0
// DOGMA X - Rate Limiting para Edge Functions
// LEI VI — CORS SEGURO
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// ============================================
// RATE LIMITS - LEI I (Performance 3500/3G)
// Otimizado para 5000 usuários simultâneos
// ============================================
const RATE_LIMITS: Record<string, { limit: number; windowSeconds: number; priority: 'critical' | 'high' | 'normal' | 'low' }> = {
  // === AUTH (CRÍTICO - Proteção contra brute force) ===
  'login': { limit: 5, windowSeconds: 300, priority: 'critical' },         // 5/5min
  'signup': { limit: 3, windowSeconds: 600, priority: 'critical' },        // 3/10min
  'password-reset': { limit: 3, windowSeconds: 600, priority: 'critical' },// 3/10min
  '2fa': { limit: 5, windowSeconds: 300, priority: 'critical' },           // 5/5min
  'magic-link': { limit: 3, windowSeconds: 600, priority: 'critical' },    // 3/10min
  
  // === AI (ALTO CUSTO - Tokens OpenAI/Gemini) ===
  'ai-chat': { limit: 20, windowSeconds: 60, priority: 'high' },           // 20/min
  'ai-tutor': { limit: 15, windowSeconds: 60, priority: 'high' },          // 15/min
  'ai-assistant': { limit: 15, windowSeconds: 60, priority: 'high' },      // 15/min
  'book-chat-ai': { limit: 10, windowSeconds: 60, priority: 'high' },      // 10/min
  'generate-ai-content': { limit: 5, windowSeconds: 60, priority: 'high' },// 5/min (caro)
  
  // === VIDEO (Proteção de URLs assinadas) ===
  'video-authorize': { limit: 30, windowSeconds: 60, priority: 'high' },   // 30/min
  'panda-video': { limit: 30, windowSeconds: 60, priority: 'high' },       // 30/min
  'secure-video-url': { limit: 30, windowSeconds: 60, priority: 'high' },  // 30/min
  'book-page-signed-url': { limit: 60, windowSeconds: 60, priority: 'normal' }, // 60/min (navegação)
  
  // === CHAT/REALTIME (5000 simultâneos) ===
  'chat-message': { limit: 30, windowSeconds: 60, priority: 'normal' },    // 30/min (1 a cada 2s)
  'chat-reaction': { limit: 60, windowSeconds: 60, priority: 'low' },      // 60/min
  'live-presence': { limit: 12, windowSeconds: 60, priority: 'low' },      // 12/min (5s interval)
  
  // === API GERAL ===
  'api-call': { limit: 100, windowSeconds: 60, priority: 'normal' },       // 100/min
  'api-gateway': { limit: 100, windowSeconds: 60, priority: 'normal' },    // 100/min
  'search': { limit: 30, windowSeconds: 60, priority: 'normal' },          // 30/min (debounce 300ms)
  
  // === UPLOADS/ARQUIVOS ===
  'upload': { limit: 10, windowSeconds: 60, priority: 'normal' },          // 10/min
  'file-download': { limit: 50, windowSeconds: 60, priority: 'normal' },   // 50/min
  
  // === EMAIL/NOTIFICAÇÕES ===
  'send-email': { limit: 10, windowSeconds: 60, priority: 'high' },        // 10/min
  'send-notification': { limit: 20, windowSeconds: 60, priority: 'normal' },// 20/min
  
  // === WEBHOOKS (Sistema) ===
  'webhook': { limit: 100, windowSeconds: 60, priority: 'normal' },        // 100/min (hotmart, etc)
  'hotmart-webhook': { limit: 100, windowSeconds: 60, priority: 'normal' },// 100/min
  
  // === DEFAULT ===
  'default': { limit: 30, windowSeconds: 60, priority: 'normal' },         // 30/min
};

// Cache em memória para rate limiting rápido
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

// Limpar cache periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitCache.entries()) {
    if (value.resetAt < now) {
      rateLimitCache.delete(key);
    }
  }
}, 60000);

serve(async (req) => {
  // CORS seguro
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const { endpoint, action, clientId, payload } = await req.json();
    
    // Identificar cliente (IP + User Agent ou clientId fornecido)
    const clientIdentifier = clientId || 
      req.headers.get('x-forwarded-for') || 
      req.headers.get('x-real-ip') || 
      'unknown';
    
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const cacheKey = `${clientIdentifier}:${endpoint}`;
    
    // Obter configuração de rate limit
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS['default'];
    const now = Date.now();
    
    // Verificar cache em memória primeiro (mais rápido)
    let cacheEntry = rateLimitCache.get(cacheKey);
    
    if (cacheEntry) {
      if (cacheEntry.resetAt > now) {
        cacheEntry.count++;
        
        if (cacheEntry.count > config.limit) {
          console.warn(`🚫 Rate limit excedido: ${cacheKey} (${cacheEntry.count}/${config.limit})`);
          
          // Logar tentativa bloqueada
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          await supabase.from('security_events').insert({
            event_type: 'RATE_LIMIT_EXCEEDED',
            severity: 'warn',
            source: 'rate-limit-gateway',
            description: `Rate limit excedido para ${endpoint}`,
            payload: {
              endpoint,
              clientId: clientIdentifier,
              count: cacheEntry.count,
              limit: config.limit,
              userAgent: userAgent.substring(0, 200)
            },
            ip_address: clientIdentifier
          });
          
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit excedido',
              retryAfter: Math.ceil((cacheEntry.resetAt - now) / 1000)
            }),
            { 
              status: 429, 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'Retry-After': String(Math.ceil((cacheEntry.resetAt - now) / 1000))
              } 
            }
          );
        }
      } else {
        // Janela expirou, resetar
        rateLimitCache.set(cacheKey, {
          count: 1,
          resetAt: now + (config.windowSeconds * 1000)
        });
      }
    } else {
      // Nova entrada no cache
      rateLimitCache.set(cacheKey, {
        count: 1,
        resetAt: now + (config.windowSeconds * 1000)
      });
    }
    
    // Rate limit OK, processar requisição
    console.log(`✅ Rate limit OK: ${cacheKey} (${rateLimitCache.get(cacheKey)?.count}/${config.limit})`);
    
    // Se for apenas verificação de rate limit
    if (action === 'check') {
      const current = rateLimitCache.get(cacheKey);
      return new Response(
        JSON.stringify({
          allowed: true,
          remaining: config.limit - (current?.count || 0),
          resetAt: current?.resetAt || now + (config.windowSeconds * 1000)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Se tiver payload, processar como proxy
    if (action === 'proxy' && payload) {
      // Aqui você pode encaminhar para outras Edge Functions
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Request permitido pelo rate limiter',
          remaining: config.limit - (rateLimitCache.get(cacheKey)?.count || 0)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        remaining: config.limit - (rateLimitCache.get(cacheKey)?.count || 0)
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
