// ============================================
// 🔥 EDGE FUNCTION: SECURE API PROXY
// DOGMA IV - TODAS as chaves no servidor
// Frontend NUNCA vê chaves de API
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// ============================================
// CHAVES SECRETAS (APENAS NO SERVIDOR)
// ============================================
const SECRETS = {
  OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY'),
  STRIPE_SECRET_KEY: Deno.env.get('STRIPE_SECRET_KEY'),
  PANDA_API_KEY: Deno.env.get('PANDA_API_KEY'),
  // P0 FIX: Adicionar PANDA_DRM_SECRET_KEY para DRM via API
  PANDA_DRM_SECRET_KEY: Deno.env.get('PANDA_DRM_SECRET_KEY'),
  HOTMART_API_KEY: Deno.env.get('HOTMART_API_KEY'),
  YOUTUBE_API_KEY: Deno.env.get('YOUTUBE_API_KEY'),
  FACEBOOK_ACCESS_TOKEN: Deno.env.get('FACEBOOK_ACCESS_TOKEN'),
  INSTAGRAM_ACCESS_TOKEN: Deno.env.get('INSTAGRAM_ACCESS_TOKEN'),
  TIKTOK_ACCESS_TOKEN: Deno.env.get('TIKTOK_ACCESS_TOKEN'),
  WORDPRESS_API_KEY: Deno.env.get('WORDPRESS_API_KEY'),
};

const PANDA_LIBRARY_ID = "d59d6cb7-b9c";

serve(async (req) => {
  // LEI VI: CORS dinâmico via allowlist centralizado
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');

    // Verificar autenticação
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { service, endpoint, method = 'GET', data } = body;

    console.log(`🔐 Proxy API - Serviço: ${service}, Endpoint: ${endpoint}, Usuário: ${user.email}`);

    // ============================================
    // PROXY PARA OPENAI
    // ============================================
    if (service === 'openai') {
      if (!SECRETS.OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'OpenAI não configurado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const openaiResponse = await fetch(`https://api.openai.com/v1/${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${SECRETS.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseData = await openaiResponse.json();
      return new Response(
        JSON.stringify(responseData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // PROXY PARA STRIPE
    // ============================================
    if (service === 'stripe') {
      if (!SECRETS.STRIPE_SECRET_KEY) {
        return new Response(
          JSON.stringify({ error: 'Stripe não configurado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const stripeResponse = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${SECRETS.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data ? new URLSearchParams(data).toString() : undefined,
      });

      const responseData = await stripeResponse.json();
      return new Response(
        JSON.stringify(responseData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // PROXY PARA PANDA VIDEO — COM SUPORTE A DRM
    // P0 FIX: Usa PANDA_DRM_SECRET_KEY para geração de URLs assinadas
    // ============================================
    if (service === 'panda') {
      // Para endpoints de API (metadados), usa PANDA_API_KEY
      if (endpoint && !endpoint.startsWith('signed-url')) {
        if (!SECRETS.PANDA_API_KEY) {
          return new Response(
            JSON.stringify({ error: 'Panda Video não configurado' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const pandaResponse = await fetch(`https://api-v2.pandavideo.com.br/${endpoint}`, {
          method,
          headers: {
            'Authorization': SECRETS.PANDA_API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: data ? JSON.stringify(data) : undefined,
        });

        const responseData = await pandaResponse.json();
        return new Response(
          JSON.stringify(responseData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Para geração de URL assinada (DRM), usa PANDA_DRM_SECRET_KEY
      if (!SECRETS.PANDA_DRM_SECRET_KEY) {
        return new Response(
          JSON.stringify({ error: 'Panda DRM não configurado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const videoId = data?.videoId;
      if (!videoId) {
        return new Response(
          JSON.stringify({ error: 'videoId obrigatório para URL assinada' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Gerar URL assinada com HMAC
      const expiresAt = Math.floor(Date.now() / 1000) + (15 * 60);
      const encoder = new TextEncoder();
      const signData = encoder.encode(`${videoId}${expiresAt}`);
      const keyData = encoder.encode(SECRETS.PANDA_DRM_SECRET_KEY);
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, signData);
      const token = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const signedUrl = `https://player-vz-${PANDA_LIBRARY_ID}.tv.pandavideo.com.br/embed/?v=${videoId}&token=${token}&expires=${expiresAt}`;
      
      console.log(`✅ [secure-api-proxy] URL DRM assinada gerada para ${videoId}`);
      
      return new Response(
        JSON.stringify({ success: true, signedUrl, expiresAt, drmEnabled: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // PROXY PARA HOTMART
    // ============================================
    if (service === 'hotmart') {
      if (!SECRETS.HOTMART_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'Hotmart não configurado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const hotmartResponse = await fetch(`https://developers.hotmart.com/payments/api/v1/${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${SECRETS.HOTMART_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseData = await hotmartResponse.json();
      return new Response(
        JSON.stringify(responseData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // PROXY PARA YOUTUBE
    // ============================================
    if (service === 'youtube') {
      if (!SECRETS.YOUTUBE_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'YouTube não configurado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const separator = endpoint.includes('?') ? '&' : '?';
      const youtubeResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/${endpoint}${separator}key=${SECRETS.YOUTUBE_API_KEY}`,
        { method }
      );

      const responseData = await youtubeResponse.json();
      return new Response(
        JSON.stringify(responseData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Serviço não suportado' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no proxy:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
