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
const PANDA_LIBRARY_ID = "d59d6cb7-b9c";

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

    // Buscar dados para watermark (opcional, para exibição no frontend e para o JWT do DRM)
    let watermarkData: null | { name: string; cpf_last4: string; email: string } = null;
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

    // ============================================
    // ✅ DRM (Panda) — Token JWT via parâmetro `watermark`
    // Quando DRM está ativo no Panda, o player espera um JWT assinado
    // contendo `drm_group_id` e `exp`.
    // Se as variáveis não estiverem configuradas, cai no modo simples (whitelist).
    // ============================================

    const PANDA_DRM_SECRET_KEY = Deno.env.get('PANDA_DRM_SECRET_KEY');
    const PANDA_DRM_GROUP_ID = Deno.env.get('PANDA_DRM_GROUP_ID');

    let signedUrl: string;

    if (PANDA_DRM_SECRET_KEY && PANDA_DRM_GROUP_ID) {
      // JWT exp em segundos
      const expiresAt = Math.floor(Date.now() / 1000) + (15 * 60); // 15 minutos

      // Import dinâmico para evitar custo quando DRM não está configurado
      const { SignJWT } = await import('npm:jose@5.2.4');

      // Identificador forense (vai embutido no watermark do Panda)
      // Mantemos curto para evitar problemas de tamanho.
      const forensicIdBase = watermarkData?.cpf_last4
        ? `${watermarkData.name} • CPF****${watermarkData.cpf_last4}`
        : (watermarkData?.name || user.email?.split('@')[0] || 'Aluno');

      const jwt = await new SignJWT({
        drm_group_id: PANDA_DRM_GROUP_ID,
        // campos auxiliares aceitos pela Panda para composição do watermark
        string1: forensicIdBase,
        string2: watermarkData?.email || user.email || '',
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setExpirationTime(expiresAt)
        .sign(new TextEncoder().encode(PANDA_DRM_SECRET_KEY));

      // O Panda espera o token no parâmetro `watermark`
      signedUrl = `https://player-vz-${PANDA_LIBRARY_ID}.tv.pandavideo.com.br/embed/?v=${videoId}&watermark=${encodeURIComponent(jwt)}`;
      console.log(`[get-panda-signed-url] URL DRM (JWT): ${signedUrl}`);
    } else {
      // Modo simples — legado (whitelist por domínio)
      signedUrl = `https://player-vz-${PANDA_LIBRARY_ID}.tv.pandavideo.com.br/embed/?v=${videoId}`;
      console.log(`[get-panda-signed-url] URL SIMPLES: ${signedUrl}`);
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
