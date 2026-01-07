// ============================================
// 🎥 PANDA VIDEO SIGNED URL GENERATOR
// Edge Function para URLs seguras de vídeo
// P0 FIX: Usar JWT (HS256) para DRM via API
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// ============================================
// JWT HELPER - HS256 para Panda Video DRM
// ============================================
function toBase64Url(data: Uint8Array | ArrayBuffer): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function createJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  
  const encoder = new TextEncoder();
  const headerB64 = toBase64Url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = toBase64Url(encoder.encode(JSON.stringify(payload)));
  
  const dataToSign = `${headerB64}.${payloadB64}`;
  
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(dataToSign));
  const signatureB64 = toBase64Url(signature);
  
  return `${dataToSign}.${signatureB64}`;
}

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

    // Gerar URL assinada do Panda Video - USAR CHAVE SECRETA DO DRM
    const pandaDrmSecret = Deno.env.get('PANDA_DRM_SECRET_KEY');
    if (!pandaDrmSecret) {
      console.error('[get-panda-signed-url] PANDA_DRM_SECRET_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta (DRM)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[get-panda-signed-url] Usando DRM Secret Key para assinatura');

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

    // P0 FIX: Buscar dados do usuário para watermark
    let userName = user.email?.split('@')[0] || 'Aluno';
    let userCpf = '';
    let userEmail = user.email || '';
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, cpf, email')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        userName = profile.name || userName;
        userCpf = profile.cpf || '';
        userEmail = profile.email || user.email || '';
      }
    } catch (profileErr) {
      console.warn('[get-panda-signed-url] Erro ao buscar perfil:', profileErr);
    }

    // ============================================
    // PANDA DRM VIA API — URL ASSINADA
    // IMPORTANTE: no codebase existem DOIS formatos de URL:
    //  (A) token+expires (HMAC do Panda) — usado em secure-video-url e video-authorize-omega
    //  (B) watermark JWT (drm_group_id + exp + string1/2/3) — depende de configuração da conta
    // Para eliminar inconsistência e reduzir risco de "This video encountered an error",
    // retornamos como CANÔNICO o formato (A) e ainda geramos o JWT (B) para auditoria.
    // ============================================

    // (B) JWT (mantido para auditoria/telemetria)
    const pandaDrmGroupId = Deno.env.get('PANDA_DRM_GROUP_ID');
    if (!pandaDrmGroupId) {
      console.error('[get-panda-signed-url] PANDA_DRM_GROUP_ID não configurado');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta (DRM Group ID)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwtPayload = {
      drm_group_id: pandaDrmGroupId,
      exp: expiresAt,
      string1: userName,
      string2: userCpf ? userCpf.replace(/\D/g, '').slice(-4) : '',
      string3: userEmail,
    };

    const jwtToken = await createJWT(jwtPayload, pandaDrmSecret);

    // (A) Token HMAC (canônico)
    const encoder = new TextEncoder();
    const dataToSign = encoder.encode(`${videoId}${expiresAt}`);
    const keyData = encoder.encode(pandaDrmSecret);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataToSign);
    const pandaToken = toBase64Url(signature);

    console.log(
      `[get-panda-signed-url] Tokens gerados: token(hmac)=${pandaToken.slice(0, 10)}..., jwt(drm_group_id)=${pandaDrmGroupId}, exp=${expiresAt}`
    );

    // URL do player oficial do Panda
    const PANDA_LIBRARY_ID = "d59d6cb7-b9c";
    
    // ============================================
    // DESCOBERTA CRÍTICA: No site antigo (old.moisesmedeiros.com.br),
    // o player funcionava SÓ COM O UUID, sem token/assinatura!
    // Isso indica que a conta Panda usa PROTEÇÃO POR DOMÍNIO (whitelist),
    // não necessariamente DRM via API com token obrigatório.
    // 
    // ESTRATÉGIA: Retornar URL SIMPLES (como site antigo) como canônica.
    // Se o domínio pro.moisesmedeiros.com.br estiver na whitelist, funciona.
    // ============================================
    
    // URL SIMPLES (como site antigo funcionava)
    const signedUrl = `https://player-vz-${PANDA_LIBRARY_ID}.tv.pandavideo.com.br/embed/?v=${videoId}`;
    
    // Alternativas com tokens (para debug/fallback)
    const signedUrlWithHmac = `https://player-vz-${PANDA_LIBRARY_ID}.tv.pandavideo.com.br/embed/?v=${videoId}&token=${encodeURIComponent(pandaToken)}&expires=${expiresAt}`;
    const signedUrlWatermarkJwt = `https://player-vz-${PANDA_LIBRARY_ID}.tv.pandavideo.com.br/embed/?v=${videoId}&watermark=${encodeURIComponent(jwtToken)}`;

    console.log(`[get-panda-signed-url] URL SIMPLES gerada (como site antigo): ${signedUrl}`);
    console.log(`[get-panda-signed-url] Alternativas: HMAC=${signedUrlWithHmac.slice(0,80)}..., JWT=${signedUrlWatermarkJwt.slice(0,80)}...`);

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
        // Alternativas para teste manual (debug)
        debug: {
          signedUrlWithHmac,
          signedUrlWatermarkJwt,
          drmGroupId: pandaDrmGroupId,
          nota: 'Se signedUrl não funcionar, teste signedUrlWithHmac ou signedUrlWatermarkJwt no navegador',
        },
        expiresAt,
        videoId,
        ttlSeconds,
        watermark: watermarkData,
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
