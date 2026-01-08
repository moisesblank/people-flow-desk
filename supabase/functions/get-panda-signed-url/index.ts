// ============================================
// 🎥 PANDA VIDEO URL GENERATOR (SIMPLIFICADO)
// PROTEÇÃO: Por domínio (whitelist) apenas
// SEM: Tokens, HMAC, JWT, DRM API
// IGUAL: Site antigo que funcionava
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// Library ID canônico do Panda Video
const PANDA_LIBRARY_ID = "c3e3c21e-7ce";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  console.log('[get-panda-signed-url] Iniciando processamento SIMPLIFICADO...');

  try {
    const { lessonId } = await req.json();

    if (!lessonId) {
      return new Response(
        JSON.stringify({ error: 'lessonId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verifica autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[get-panda-signed-url] Usuário: ${user.id}`);

    // Buscar a aula
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, video_url, video_provider, panda_video_id')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return new Response(
        JSON.stringify({ error: 'Aula não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Priorizar panda_video_id, depois extrair de video_url
    let videoId = lesson.panda_video_id || lesson.video_url || '';
    
    // Se for uma URL completa do Panda, extrair apenas o ID (UUID)
    if (videoId.includes('pandavideo.com') || videoId.includes('?v=')) {
      const urlMatch = videoId.match(/[?&]v=([a-zA-Z0-9-]+)/);
      if (urlMatch) {
        videoId = urlMatch[1];
      }
    }

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Vídeo não configurado para esta aula' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // URL SIMPLES — IGUAL AO SITE ANTIGO
    // Proteção é feita pelo Panda verificando domínio de origem
    // Domínios na whitelist: pro.moisesmedeiros.com.br, *.lovableproject.com
    // ============================================
    const signedUrl = `https://player-vz-${PANDA_LIBRARY_ID}.tv.pandavideo.com.br/embed/?v=${videoId}`;

    console.log(`[get-panda-signed-url] URL SIMPLES: ${signedUrl}`);

    // Buscar dados para watermark (opcional, para exibição no frontend)
    let watermarkData = null;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, cpf, email')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profile) {
        watermarkData = {
          name: profile.nome || user.email?.split('@')[0] || 'Aluno',
          cpf_last4: profile.cpf ? profile.cpf.replace(/\D/g, '').slice(-4) : '',
          email: profile.email || user.email || '',
        };
      }
    } catch (e) {
      console.warn('[get-panda-signed-url] Erro ao buscar watermark:', e);
    }

    // Log de acesso (opcional)
    try {
      await supabase.rpc('log_content_access', {
        p_user_id: user.id,
        p_content_type: 'video',
        p_content_id: lessonId,
        p_action: 'url_generated',
        p_metadata: { video_id: videoId, provider: 'panda' }
      });
    } catch (e) {
      // Silencioso
    }

    return new Response(
      JSON.stringify({
        signedUrl,
        videoId,
        watermark: watermarkData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[get-panda-signed-url] Erro:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
