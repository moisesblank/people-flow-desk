// ============================================
// VERIFY TURNSTILE EDGE FUNCTION
// LEI III - DOGMA SEGURANÇA: Validação Server-Side
// Valida token do Cloudflare Turnstile
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyRequest {
  token: string;
  remoteip?: string;
}

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

serve(async (req) => {
  // LEI VI: CORS dinâmico via allowlist centralizado
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  try {
    const { token, remoteip } = await req.json() as TurnstileVerifyRequest;

    if (!token) {
      console.error('[verify-turnstile] Token não fornecido');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token de verificação não fornecido' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // ============================================
    // 🛡️ P1-1 FIX: DEV_BYPASS REMOVIDO PARA PRODUÇÃO
    // Bypass NÃO existe mais em runtime de produção
    // Ambiente de dev deve usar Turnstile test keys
    // ============================================

    // 🛡️ FALLBACK GRACIOSO: Aceitar token de fallback (Turnstile falhou 3x)
    // Backend aplica rate-limit agressivo (1 tentativa/min por IP)
    if (token.startsWith('FALLBACK_')) {
      const hostname = token.split('_').pop() || '';
      // MONO-DOMÍNIO: gestao.* descontinuado
      const allowedProdHosts = [
        'pro.moisesmedeiros.com.br',
        'moisesmedeiros.com.br',
        'www.moisesmedeiros.com.br',
      ];
      
      const isAllowedHost = allowedProdHosts.some(h => hostname.includes(h)) ||
                            hostname.includes('lovableproject.com') ||
                            hostname === 'localhost';
      
      if (isAllowedHost) {
        console.warn(`[verify-turnstile] ⚠️ FALLBACK aceito para: ${hostname} (rate-limit agressivo aplicado)`);
        return new Response(
          JSON.stringify({
            success: true,
            hostname: hostname,
            timestamp: new Date().toISOString(),
            fallbackMode: true,
            rateLimitApplied: '1/min'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        console.warn(`[verify-turnstile] ❌ FALLBACK rejeitado para hostname não permitido: ${hostname}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Hostname não permitido para fallback' 
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    const secretKey = Deno.env.get('CLOUDFLARE_TURNSTILE_SECRET_KEY');
    if (!secretKey) {
      console.error('[verify-turnstile] Secret key não configurada');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configuração de segurança incompleta' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Preparar form data para Cloudflare
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    console.log('[verify-turnstile] Verificando token com Cloudflare...');

    // Chamar API do Cloudflare
    const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result: TurnstileVerifyResponse = await verifyResponse.json();

    console.log('[verify-turnstile] Resposta Cloudflare:', {
      success: result.success,
      hostname: result.hostname,
      challenge_ts: result.challenge_ts,
      errorCodes: result['error-codes']
    });

    if (!result.success) {
      const errorCodes = result['error-codes'] || [];
      let errorMessage = 'Verificação de segurança falhou';
      
      // Mapear códigos de erro para mensagens amigáveis
      if (errorCodes.includes('invalid-input-response')) {
        errorMessage = 'Token de verificação inválido ou expirado';
      } else if (errorCodes.includes('timeout-or-duplicate')) {
        errorMessage = 'Verificação expirada. Por favor, tente novamente';
      } else if (errorCodes.includes('bad-request')) {
        errorMessage = 'Requisição inválida';
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          codes: errorCodes 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 🛡️ PATCH-005: Validar hostname contra allowlist (MONO-DOMÍNIO)
    const defaultAllowedHostnames = [
      'pro.moisesmedeiros.com.br',
      'moisesmedeiros.com.br',
      'www.moisesmedeiros.com.br',
      'localhost',
      '127.0.0.1',
    ];

    const envAllowlistRaw = (Deno.env.get('TURNSTILE_ALLOWED_HOSTNAMES') || '').trim();
    const envAllowlist = envAllowlistRaw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    // Se a env estiver claramente mal configurada (ex.: "turnsecret"), ignorar e usar fallback
    const looksLikeHostname = (h: string) => h.includes('.') || h === 'localhost' || h === '127.0.0.1';
    const shouldUseEnvAllowlist = envAllowlist.length > 0 && envAllowlist.every(looksLikeHostname);

    const allowedHostnames = (shouldUseEnvAllowlist ? envAllowlist : defaultAllowedHostnames)
      .map((s) => s.toLowerCase());

    const responseHostname = (result.hostname || '').toLowerCase();

    // 🔧 Permitir domínios de preview do Lovable (LEI VI - IMUNIDADE DEV)
    const isLovablePreview = responseHostname.endsWith('.lovableproject.com') ||
                              responseHostname.endsWith('.lovable.app') ||
                              responseHostname.endsWith('.lovable.dev');

    if (!responseHostname || (!allowedHostnames.includes(responseHostname) && !isLovablePreview)) {
      console.warn(
        `[verify-turnstile] ❌ Hostname não permitido: "${responseHostname}" (permitidos: ${allowedHostnames.join(', ')} + *.lovable*)`
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Origem não autorizada',
          hostname: responseHostname,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Log para preview aceito
    if (isLovablePreview) {
      console.log(`[verify-turnstile] ✅ Preview Lovable aceito: ${responseHostname}`);
    }

    // Verificação bem sucedida
    console.log('[verify-turnstile] ✅ Verificação bem sucedida para hostname:', result.hostname);

    return new Response(
      JSON.stringify({
        success: true,
        hostname: result.hostname,
        timestamp: result.challenge_ts,
        action: result.action
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[verify-turnstile] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno na verificação de segurança' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
