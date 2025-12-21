// ============================================
// 🎥 PANDA VIDEO SIGNED URL GENERATOR
// Edge Function para URLs seguras de vídeo
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    // Gerar timestamp para expiração (1 hora)
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

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

    // URL assinada do Panda Video
    const signedUrl = `https://player-vz-${videoId.substring(0, 8)}.tv.pandavideo.com.br/embed/?v=${videoId}&token=${token}&expires=${expiresAt}`;

    console.log(`[get-panda-signed-url] URL gerada para aula ${lessonId}`);

    // Registrar acesso para analytics
    try {
      await supabase.from('content_access_log').insert({
        user_id: user.id,
        content_id: lessonId,
        content_type: 'video',
        action: 'signed_url_generated',
        success: true,
        metadata: { video_id: videoId, expires_at: expiresAt }
      });
    } catch (logErr) {
      console.warn('[get-panda-signed-url] Erro ao registrar acesso:', logErr);
    }

    return new Response(
      JSON.stringify({ 
        signedUrl,
        expiresAt,
        videoId 
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
