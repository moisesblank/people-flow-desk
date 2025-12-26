// ============================================
// 🔥 EDGE FUNCTION: SECURE API PROXY
// DOGMA IV - TODAS as chaves no servidor
// Frontend NUNCA vê chaves de API
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// ============================================
// CHAVES SECRETAS (APENAS NO SERVIDOR)
// ============================================
const SECRETS = {
  OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY'),
  STRIPE_SECRET_KEY: Deno.env.get('STRIPE_SECRET_KEY'),
  PANDA_API_KEY: Deno.env.get('PANDA_API_KEY'),
  HOTMART_API_KEY: Deno.env.get('HOTMART_API_KEY'),
  YOUTUBE_API_KEY: Deno.env.get('YOUTUBE_API_KEY'),
  FACEBOOK_ACCESS_TOKEN: Deno.env.get('FACEBOOK_ACCESS_TOKEN'),
  INSTAGRAM_ACCESS_TOKEN: Deno.env.get('INSTAGRAM_ACCESS_TOKEN'),
  TIKTOK_ACCESS_TOKEN: Deno.env.get('TIKTOK_ACCESS_TOKEN'),
  WORDPRESS_API_KEY: Deno.env.get('WORDPRESS_API_KEY'),
};

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
    // PROXY PARA PANDA VIDEO
    // ============================================
    if (service === 'panda') {
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
