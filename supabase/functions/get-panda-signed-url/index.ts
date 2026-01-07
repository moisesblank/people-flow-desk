// ============================================
// 🎥 PANDA VIDEO SIGNED URL GENERATOR
// Edge Function para URLs seguras de vídeo
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

serve(async (req) => {
  // LEI VI: CORS dinâmico via allowlist centralizado
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  console.log('[get-panda-signed-url] Iniciando processamento...');

  try {
    const { lessonId } = await req.json();

    if (!lessonId) {
      console.error('[get-panda-signed-url] lessonId não fornecido');
      return new Response(
        JSON.stringify({ error: 'lessonId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verifica autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[get-panda-signed-url] Header de autorização ausente');
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
      console.error('[get-panda-signed-url] Erro de autenticação:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[get-panda-signed-url] Usuário autenticado: ${user.id}`);

    // Verificar se o usuário tem acesso ao curso (verificação simples de matrícula)
    // Buscar a aula e verificar acesso
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        id,
        video_url,
        video_provider,
        module:modules!lessons_module_id_fkey(
          id,
          course:courses!modules_course_id_fkey(
            id,
            is_published
          )
        )
      `)
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      console.error('[get-panda-signed-url] Aula não encontrada:', lessonError?.message);
      return new Response(
        JSON.stringify({ error: 'Aula não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o vídeo existe
    if (!lesson.video_url) {
      console.error('[get-panda-signed-url] Aula sem vídeo configurado');
      return new Response(
        JSON.stringify({ error: 'Vídeo não configurado para esta aula' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar URL assinada do Panda Video
    const pandaApiKey = Deno.env.get('PANDA_API_KEY');
    if (!pandaApiKey) {
      console.error('[get-panda-signed-url] PANDA_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair ID do vídeo (pode ser URL completa ou apenas o ID)
    let videoId = lesson.video_url;
    
    // Se for uma URL completa do Panda, extrair apenas o ID
    if (videoId.includes('pandavideo.com')) {
      const urlMatch = videoId.match(/v=([a-zA-Z0-9-]+)/);
      if (urlMatch) {
        videoId = urlMatch[1];
      }
    }

    // C061: Buscar TTL configurado do banco (padrão 15 minutos para vídeo)
    let ttlSeconds = 900; // Default 15 minutos
    try {
      const { data: configData } = await supabase.rpc('get_content_ttl', { p_content_type: 'video' });
      if (configData && typeof configData === 'number') {
        ttlSeconds = configData;
      }
    } catch (e) {
      console.warn('[get-panda-signed-url] Usando TTL padrão:', ttlSeconds);
    }
    
    // Gerar timestamp para expiração com TTL configurado
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    
    console.log(`[get-panda-signed-url] TTL configurado: ${ttlSeconds}s`);

    // Criar hash de segurança (HMAC)
    const encoder = new TextEncoder();
    const data = encoder.encode(`${videoId}${expiresAt}`);
    const keyData = encoder.encode(pandaApiKey);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const token = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // URL assinada do Panda Video - usando Library ID CANÔNICO da conta
    const PANDA_LIBRARY_ID = "7b4690a0-a6d";
    const signedUrl = `https://player-vz-${PANDA_LIBRARY_ID}.tv.pandavideo.com.br/embed/?v=${videoId}&token=${token}&expires=${expiresAt}`;

    console.log(`[get-panda-signed-url] URL gerada para aula ${lessonId}`);

    // C064: Registrar acesso via função com detecção de anomalia
    try {
      await supabase.rpc('log_content_access', {
        p_user_id: user.id,
        p_content_type: 'video',
        p_content_id: lessonId,
        p_action: 'signed_url_generated',
        p_metadata: { 
          video_id: videoId, 
          expires_at: expiresAt,
          ttl_seconds: ttlSeconds,
          provider: 'panda'
        }
      });
    } catch (logErr) {
      console.warn('[get-panda-signed-url] Erro ao registrar acesso:', logErr);
    }
    
    // C062: Gerar dados de watermark
    let watermarkData = null;
    try {
      const { data: wmData } = await supabase.rpc('generate_content_watermark', {
        p_user_id: user.id,
        p_content_id: lessonId,
        p_content_type: 'video'
      });
      if (wmData && wmData.length > 0) {
        watermarkData = wmData[0];
      }
    } catch (wmErr) {
      console.warn('[get-panda-signed-url] Erro ao gerar watermark:', wmErr);
    }

    return new Response(
      JSON.stringify({ 
        signedUrl,
        expiresAt,
        videoId,
        ttlSeconds,
        watermark: watermarkData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[get-panda-signed-url] Erro interno:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
