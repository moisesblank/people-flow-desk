// ============================================
// 🔥 VIDEO AUTHORIZE - EDGE FUNCTION
// Autorização de playback com Signed URLs
// Autor: MESTRE (Claude Opus 4.5 PHD)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-fingerprint, x-request-origin",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Configuração Panda Video
const PANDA_API_KEY = Deno.env.get("PANDA_API_KEY") || "";
const PANDA_API_URL = "https://api-v2.pandavideo.com.br";

// Domínios autorizados
const AUTHORIZED_DOMAINS = [
  "gestao.moisesmedeiros.com.br",
  "www.moisesmedeiros.com.br",
  "pro.moisesmedeiros.com.br",
  "localhost",
  "localhost:5173",
  "localhost:3000",
];

interface AuthorizeRequest {
  lesson_id?: string;
  course_id?: string;
  provider_video_id: string;
  provider?: "panda" | "youtube";
}

interface PandaSignedUrlResponse {
  embed_url: string;
  expires_at: string;
}

// Gerar URL assinada do Panda Video
async function getPandaSignedUrl(
  videoId: string,
  watermarkText: string,
  ttlSeconds: number = 300
): Promise<PandaSignedUrlResponse | null> {
  if (!PANDA_API_KEY) {
    console.error("PANDA_API_KEY not configured");
    return null;
  }

  try {
    // Primeiro, buscar informações do vídeo
    const videoResponse = await fetch(`${PANDA_API_URL}/videos/${videoId}`, {
      headers: {
        "Authorization": PANDA_API_KEY,
        "Accept": "application/json",
      },
    });

    if (!videoResponse.ok) {
      console.error("Failed to fetch video info:", await videoResponse.text());
      return null;
    }

    const videoData = await videoResponse.json();

    // Gerar signed URL
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    
    const signedResponse = await fetch(`${PANDA_API_URL}/videos/${videoId}/player-token`, {
      method: "POST",
      headers: {
        "Authorization": PANDA_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_in: ttlSeconds,
        // Configurações de segurança
        drm_enabled: true,
        download_enabled: false,
        share_enabled: false,
        // Watermark dinâmica
        watermark: {
          enabled: true,
          text: watermarkText,
          position: "random",
          opacity: 0.15,
          font_size: 14,
        },
      }),
    });

    if (!signedResponse.ok) {
      // Fallback: usar embed URL padrão se signed URL falhar
      console.warn("Signed URL failed, using fallback");
      const embedUrl = `https://player-vz-${videoId.split("-")[0]}.tv.pandavideo.com.br/embed/?v=${videoId}`;
      return {
        embed_url: embedUrl,
        expires_at: expiresAt,
      };
    }

    const signedData = await signedResponse.json();
    
    return {
      embed_url: signedData.player_url || signedData.embed_url,
      expires_at: expiresAt,
    };
  } catch (error) {
    console.error("Error getting Panda signed URL:", error);
    return null;
  }
}

// Gerar URL do YouTube com proteções
function getYouTubeEmbedUrl(videoId: string, origin: string): string {
  const params = new URLSearchParams({
    autoplay: "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    controls: "1",
    showinfo: "0",
    fs: "1",
    vq: "hd1080",
    iv_load_policy: "3",
    cc_load_policy: "0",
    origin: origin,
    enablejsapi: "0",
    disablekb: "0",
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

// Verificar domínio de origem
function isAuthorizedDomain(origin: string | null): boolean {
  if (!origin) return false;
  
  try {
    const url = new URL(origin);
    const hostname = url.hostname + (url.port ? `:${url.port}` : "");
    return AUTHORIZED_DOMAINS.some(d => 
      hostname === d || hostname.endsWith(`.${d}`)
    );
  } catch {
    return AUTHORIZED_DOMAINS.includes(origin);
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Verificar método
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "METHOD_NOT_ALLOWED" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar origem
    const origin = req.headers.get("origin") || req.headers.get("referer");
    const requestOrigin = req.headers.get("x-request-origin");
    
    if (!isAuthorizedDomain(origin) && !isAuthorizedDomain(requestOrigin)) {
      console.warn("Unauthorized domain:", origin, requestOrigin);
      return new Response(
        JSON.stringify({ 
          error: "UNAUTHORIZED_DOMAIN",
          message: "Este domínio não está autorizado a reproduzir vídeos"
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "UNAUTHORIZED", message: "Token de autenticação não fornecido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar usuário
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "INVALID_TOKEN", message: "Token inválido ou expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: AuthorizeRequest = await req.json();
    
    if (!body.provider_video_id) {
      return new Response(
        JSON.stringify({ error: "MISSING_VIDEO_ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const provider = body.provider || "panda";
    const deviceFingerprint = req.headers.get("x-device-fingerprint") || null;
    const userAgent = req.headers.get("user-agent") || null;
    
    // Extrair IP (pode vir de diferentes headers dependendo do proxy)
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip") ||
                     null;

    // TODO: Verificar entitlement do usuário (plano, expiração)
    // Isso depende da estrutura de tabelas do projeto
    // const { data: enrollment } = await supabase
    //   .from("alunos_perfil")
    //   .select("plano, plano_expira_em")
    //   .eq("id", user.id)
    //   .single();
    // 
    // if (!enrollment || new Date(enrollment.plano_expira_em) < new Date()) {
    //   return new Response(
    //     JSON.stringify({ error: "SUBSCRIPTION_EXPIRED" }),
    //     { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    //   );
    // }

    // Criar sessão de vídeo (revoga anteriores automaticamente)
    const { data: sessionResult, error: sessionError } = await supabase.rpc(
      "create_video_session",
      {
        p_user_id: user.id,
        p_lesson_id: body.lesson_id || null,
        p_course_id: body.course_id || null,
        p_provider: provider,
        p_provider_video_id: body.provider_video_id,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_device_fingerprint: deviceFingerprint,
        p_ttl_minutes: 5,
      }
    );

    if (sessionError) {
      console.error("Session creation error:", sessionError);
      return new Response(
        JSON.stringify({ error: "SESSION_ERROR", details: sessionError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sessionResult.success) {
      return new Response(
        JSON.stringify({ 
          error: sessionResult.error,
          message: sessionResult.message 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar embed URL baseado no provider
    let embedUrl: string;
    let drmEnabled = false;

    if (provider === "panda") {
      const pandaResult = await getPandaSignedUrl(
        body.provider_video_id,
        sessionResult.watermark.text,
        300 // 5 minutos
      );

      if (pandaResult) {
        embedUrl = pandaResult.embed_url;
        drmEnabled = true;
      } else {
        // Fallback para URL básica
        embedUrl = `https://player-vz-${body.provider_video_id.split("-")[0]}.tv.pandavideo.com.br/embed/?v=${body.provider_video_id}`;
      }
    } else {
      // YouTube
      embedUrl = getYouTubeEmbedUrl(
        body.provider_video_id,
        origin || "https://gestao.moisesmedeiros.com.br"
      );
    }

    const latency = Date.now() - startTime;

    // Resposta de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        embedUrl,
        sessionCode: sessionResult.session_code,
        sessionToken: sessionResult.session_token,
        expiresAt: sessionResult.expires_at,
        watermark: sessionResult.watermark,
        provider,
        drmEnabled,
        heartbeatInterval: 30000, // 30 segundos
        latency,
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        } 
      }
    );

  } catch (error) {
    console.error("Video authorize error:", error);
    return new Response(
      JSON.stringify({ 
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Erro interno"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
