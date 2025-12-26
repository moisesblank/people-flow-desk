// ============================================
// 🔥 EDGE FUNCTION: SECURE VIDEO URL
// DOGMA III - URLs assinadas e expiráveis
// DOGMA IV - Chaves no servidor APENAS
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// Chaves do Panda Video (APENAS NO SERVIDOR - DOGMA IV)
const PANDA_API_KEY = Deno.env.get('PANDA_API_KEY');

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

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com token do usuário
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, videoId, token } = await req.json();

    // ============================================
    // AÇÃO: GERAR URL ASSINADA (5 minutos)
    // ============================================
    if (action === 'generate') {
      if (!videoId) {
        return new Response(
          JSON.stringify({ error: 'videoId obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`🔐 Gerando URL assinada para vídeo ${videoId} - Usuário: ${user.email}`);

      // Gerar URL assinada no banco
      const { data: signedData, error: signError } = await supabase
        .rpc('generate_signed_video_url', { p_video_id: videoId, p_expires_minutes: 5 });

      if (signError) {
        console.error('❌ Erro ao gerar URL assinada:', signError);
        return new Response(
          JSON.stringify({ error: 'Erro ao gerar URL assinada' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar dados do usuário para marca d'água
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo, cpf')
        .eq('id', user.id)
        .single();

      // Retornar dados para o player
      return new Response(
        JSON.stringify({
          success: true,
          signedUrl: signedData,
          watermark: {
            nome: profileData?.nome_completo || user.email?.split('@')[0] || 'Usuário',
            cpf: profileData?.cpf || null,
            email: user.email
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // AÇÃO: VALIDAR URL ASSINADA
    // ============================================
    if (action === 'validate') {
      if (!token || !videoId) {
        return new Response(
          JSON.stringify({ error: 'token e videoId obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: isValid, error: validateError } = await supabase
        .rpc('validate_signed_video_url', { p_token: token, p_video_id: videoId });

      if (validateError) {
        console.error('❌ Erro ao validar URL:', validateError);
        return new Response(
          JSON.stringify({ error: 'Erro ao validar URL' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!isValid) {
        // Logar tentativa inválida
        await supabase.from('content_access_log').insert({
          user_id: user.id,
          content_type: 'video',
          content_id: videoId,
          action: 'invalid_access_attempt',
          success: false,
          blocked_reason: 'URL expirada ou inválida'
        });

        return new Response(
          JSON.stringify({ error: 'URL expirada ou inválida', valid: false }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // AÇÃO: OBTER URL DO PANDA VIDEO (proxy seguro)
    // ============================================
    if (action === 'get_panda_url') {
      if (!videoId || !PANDA_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'Configuração incompleta' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Chamar API do Panda Video para obter URL com DRM
      try {
        const pandaResponse = await fetch(
          `https://api-v2.pandavideo.com.br/videos/${videoId}`,
          {
            headers: {
              'Authorization': PANDA_API_KEY,
              'Accept': 'application/json'
            }
          }
        );

        if (!pandaResponse.ok) {
          throw new Error('Erro ao acessar Panda Video API');
        }

        const pandaData = await pandaResponse.json();

        // Retornar URL com DRM habilitado
        return new Response(
          JSON.stringify({
            success: true,
            videoUrl: pandaData.video_player || pandaData.embed_url,
            drmEnabled: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (pandaError) {
        console.error('❌ Erro Panda Video:', pandaError);
        return new Response(
          JSON.stringify({ error: 'Erro ao acessar vídeo' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Ação não reconhecida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na Edge Function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
