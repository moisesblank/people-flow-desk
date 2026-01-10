// ============================================
// 🔥🛡️ VIDEO AUTHORIZE OMEGA v5.0 🛡️🔥
// EDGE FUNCTION DEFINITIVA — SANCTUM 2.0
// ============================================
// ✅ Autenticação JWT rigorosa
// ✅ Verificação de entitlement (plano)
// ✅ Sessão única por usuário
// ✅ Geração de signed URLs
// ✅ Bypass SANCTUM integrado
// ✅ Watermark dinâmica
// ✅ Logging completo
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// ============================================
// CONFIGURAÇÃO
// ============================================
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// P0 FIX: Usar PANDA_DRM_SECRET_KEY para geração de URLs assinadas (DRM via API ativado)
const PANDA_DRM_SECRET_KEY = Deno.env.get("PANDA_DRM_SECRET_KEY") || "";
const PANDA_LIBRARY_ID = "d59d6cb7-b9c";

const SANCTUM_VERSION = "2.0-OMEGA-DRM";
const SESSION_TTL_MINUTES = 5;

// P1-2 FIX: Roles imunes (sem 'funcionario' e 'employee' deprecated)
const IMMUNE_ROLES = [
  'owner', 'admin', 'suporte', 
  'coordenacao', 'monitoria', 'contabilidade', 'marketing', 'afiliado',
];

// MONO-DOMÍNIO: gestao.* descontinuado
const AUTHORIZED_DOMAINS = [
  'pro.moisesmedeiros.com.br',
  'www.moisesmedeiros.com.br',
  'moisesmedeiros.com.br',
  'localhost',
  '127.0.0.1',
];

// CORS - Usar allowlist dinâmica
import { getCorsHeaders, isOriginAllowed, handleCorsOptions } from "../_shared/corsConfig.ts";

// ============================================
// 🛡️ P0-002 FIX: RATE LIMIT PERSISTENTE (DB)
// Usa tabela api_rate_limits para consistência
// ============================================
const RATE_LIMIT_CONFIG = { limit: 30, windowSeconds: 60 }; // 30 req/min por usuário

interface RateLimitEntry {
  id: string;
  request_count: number;
  window_start: string;
}

async function checkRateLimitPersistent(
  supabase: any,
  clientId: string,
  endpoint: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const windowStart = new Date(Date.now() - RATE_LIMIT_CONFIG.windowSeconds * 1000);
    
    // Limpar entradas expiradas
    await supabase
      .from('api_rate_limits')
      .delete()
      .eq('client_id', clientId)
      .eq('endpoint', endpoint)
      .lt('window_start', windowStart.toISOString());
    
    // Buscar entrada atual
    const { data: existing } = await supabase
      .from('api_rate_limits')
      .select('id, request_count, window_start')
      .eq('client_id', clientId)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: RateLimitEntry | null };
    
    if (existing) {
      const newCount = (existing.request_count || 0) + 1;
      
      if (newCount > RATE_LIMIT_CONFIG.limit) {
        const resetAt = new Date(new Date(existing.window_start).getTime() + RATE_LIMIT_CONFIG.windowSeconds * 1000);
        const retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
        return { allowed: false, retryAfter: Math.max(1, retryAfter) };
      }
      
      await supabase
        .from('api_rate_limits')
        .update({ request_count: newCount })
        .eq('id', existing.id);
      
      return { allowed: true };
    } else {
      // Nova janela
      await supabase
        .from('api_rate_limits')
        .insert({
          client_id: clientId,
          endpoint: endpoint,
          request_count: 1,
          window_start: new Date().toISOString()
        });
      
      return { allowed: true };
    }
  } catch (e) {
    console.error('[video-authorize-omega] Rate limit check failed:', e);
    return { allowed: true }; // Fail-open
  }
}

// ============================================
// TIPOS
// ============================================
interface AuthorizeRequest {
  lesson_id?: string;
  course_id?: string;
  provider_video_id: string;
  provider?: "panda" | "youtube";
  sanctum?: {
    isImmune?: boolean;
    isRelaxed?: boolean;
    bypassReason?: string;
  };
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  cpf?: string;
  role?: string;
  plano?: string;
  plano_expira_em?: string;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'MM-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// CPF COMPLETO - Sem máscara (cada usuário vê apenas o seu próprio)
function formatCPF(cpf?: string): string {
  if (!cpf) return "";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

function isAuthorizedDomain(origin?: string | null): boolean {
  if (!origin) return false;
  return AUTHORIZED_DOMAINS.some(domain => origin.includes(domain));
}

function getUserRole(headers: Headers): string | null {
  return headers.get("x-user-role");
}

// ============================================
// PANDA VIDEO SIGNED URL — DRM VIA API
// Usa PANDA_DRM_SECRET_KEY para assinatura HMAC
// ============================================
async function generatePandaSignedUrl(
  videoId: string,
  watermarkText: string,
): Promise<string | null> {
  // P0 FIX: Se não tiver DRM secret, retorna null (NÃO usar embed básico com DRM ativado)
  if (!PANDA_DRM_SECRET_KEY) {
    console.error("❌ PANDA_DRM_SECRET_KEY não configurada - DRM ativado requer chave secreta");
    return null;
  }

  try {
    // Gerar signed URL via HMAC (DRM via API)
    const expiresAt = Math.floor(Date.now() / 1000) + (SESSION_TTL_MINUTES * 60);

    // Criar hash HMAC-SHA256 usando DRM Secret Key
    const encoder = new TextEncoder();
    const data = encoder.encode(`${videoId}${expiresAt}`);
    const keyData = encoder.encode(PANDA_DRM_SECRET_KEY);
    
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

    // URL assinada do Panda Video com token DRM
    const signedUrl = `https://player-vz-${PANDA_LIBRARY_ID}.tv.pandavideo.com.br/embed/?v=${videoId}&token=${token}&expires=${expiresAt}`;
    
    console.log(`✅ [video-authorize-omega] URL DRM assinada gerada para ${videoId}`);
    return signedUrl;
  } catch (error) {
    console.error("❌ Erro ao gerar signed URL DRM:", error);
    return null;
  }
}

// ============================================
// YOUTUBE EMBED URL
// ============================================
function generateYouTubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: "0",
    modestbranding: "1",
    rel: "0",
    enablejsapi: "1",
    origin: AUTHORIZED_DOMAINS[0],
    controls: "0", // Controles personalizados
  });

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

// ============================================
// HANDLER PRINCIPAL
// ============================================
serve(async (req: Request) => {
  // CORS seguro com allowlist
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }
  
  const corsHeaders = getCorsHeaders(req);

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Método não permitido" }),
      { status: 405, headers: corsHeaders }
    );
  }

  const startTime = Date.now();
  
  try {
    // ============================================
    // 1. VERIFICAR DOMÍNIO
    // ============================================
    const origin = req.headers.get("origin") || req.headers.get("x-request-origin");
    if (!isAuthorizedDomain(origin)) {
      console.warn(`⚠️ Domínio não autorizado: ${origin}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Domínio não autorizado",
          code: "DOMAIN_BLOCKED",
        }),
        { status: 403, headers: corsHeaders }
      );
    }

    // ============================================
    // 2. AUTENTICAÇÃO JWT
    // ============================================
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Token de autenticação ausente",
          code: "AUTH_MISSING",
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Cliente autenticado
    const supabaseUser = createClient(SUPABASE_URL, token, {
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Token inválido ou expirado",
          code: "AUTH_INVALID",
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Cliente com service role para operações privilegiadas
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // ============================================
    // 🛡️ P0-002 FIX: RATE LIMIT PERSISTENTE
    // ============================================
    const rateCheck = await checkRateLimitPersistent(supabaseAdmin, user.id, 'video-authorize');
    if (!rateCheck.allowed) {
      console.warn(`[video-authorize-omega] ⚠️ Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Muitas requisições. Aguarde um momento.",
          code: "RATE_LIMITED",
          retryAfter: rateCheck.retryAfter || 60 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateCheck.retryAfter || 60) 
          } 
        }
      );
    }
    // ============================================
    // 3. PARSE DO BODY
    // ============================================
    const body: AuthorizeRequest = await req.json();
    const { 
      lesson_id, 
      course_id, 
      provider_video_id, 
      provider = "panda",
      sanctum: sanctumClient,
    } = body;

    if (!provider_video_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "provider_video_id é obrigatório",
          code: "MISSING_VIDEO_ID",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // ============================================
    // 4. BUSCAR PERFIL DO USUÁRIO
    // ============================================
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, cpf, role")
      .eq("id", user.id)
      .maybeSingle();

    // Tentar buscar role de user_roles se não tiver no profile
    let userRole = profile?.role || null;
    if (!userRole) {
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      userRole = roleData?.role || null;
    }

    // Role do header (para casos de teste/staging)
    const headerRole = getUserRole(req.headers);
    const effectiveRole = userRole || headerRole;

    // ============================================
    // 5. VERIFICAR SANCTUM BYPASS
    // ============================================
    const isImmune = IMMUNE_ROLES.includes(effectiveRole as string) || 
                     sanctumClient?.isImmune === true;
    const isRelaxed = sanctumClient?.isRelaxed === true;
    const bypassReason = isImmune 
      ? `ROLE:${effectiveRole}` 
      : sanctumClient?.bypassReason || null;

    // 🛡️ LEI V: Logs sem PII em produção
    console.log(`🛡️ SANCTUM ${SANCTUM_VERSION}`, {
      userId: user.id.substring(0, 8) + '...',
      role: effectiveRole,
      isImmune,
      isRelaxed,
      bypassReason,
    });

    // ============================================
    // 6. VERIFICAR ENTITLEMENT (PLANO) — SKIP SE IMUNE
    // ============================================
    if (!isImmune) {
      const { data: alunoPerfil } = await supabaseAdmin
        .from("alunos_perfil")
        .select("plano, plano_expira_em, status")
        .eq("id", user.id)
        .maybeSingle();

      // Verificar se tem acesso ao conteúdo
      const hasAccess = alunoPerfil?.status === 'ativo' || 
                        alunoPerfil?.plano === 'beta' ||
                        (alunoPerfil?.plano_expira_em && 
                         new Date(alunoPerfil.plano_expira_em) > new Date());

      if (!hasAccess) {
        // Log de tentativa de acesso negado
        try {
          await supabaseAdmin.from("video_access_logs").insert({
            user_id: user.id,
            lesson_id,
            provider_video_id,
            provider,
            action: "ACCESS_DENIED",
            details: { reason: "NO_ENTITLEMENT", role: effectiveRole },
          });
        } catch (e) { console.error("Log error:", e); }

        return new Response(
          JSON.stringify({
            success: false,
            error: "Você não tem acesso a este conteúdo",
            code: "NO_ENTITLEMENT",
          }),
          { status: 403, headers: corsHeaders }
        );
      }
    }

    // ============================================
    // 7. REVOGAR SESSÕES ANTERIORES
    // ============================================
    try {
      await supabaseAdmin
        .from("video_play_sessions")
        .update({ 
          revoked_at: new Date().toISOString(),
          revoke_reason: "NEW_SESSION",
        })
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .is("ended_at", null);
    } catch (e) { console.error("Revoke error:", e); }

    // ============================================
    // 8. CRIAR NOVA SESSÃO
    // ============================================
    const sessionCode = generateSessionCode();
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000);
    
    // Watermark text
    const userName = profile?.full_name || user.email?.split("@")[0] || "Usuário";
    const cpfFormatted = formatCPF(profile?.cpf);
    const watermarkText = `${userName} • ${cpfFormatted} • ${sessionCode}`;
    const watermarkHash = sessionCode;

    // Fingerprint do dispositivo
    const deviceFingerprint = req.headers.get("x-device-fingerprint") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("video_play_sessions")
      .insert({
        user_id: user.id,
        lesson_id,
        provider,
        provider_video_id,
        session_code: sessionCode,
        session_token: sessionToken,
        watermark_text: watermarkText,
        expires_at: expiresAt.toISOString(),
        ip,
        user_agent: userAgent,
        device_fingerprint: deviceFingerprint,
        sanctum_immune: isImmune,
        sanctum_bypass_reason: bypassReason,
      })
      .select("id")
      .single();

    if (sessionError) {
      console.error("❌ Erro ao criar sessão:", sessionError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Falha ao criar sessão de vídeo",
          code: "SESSION_ERROR",
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // ============================================
    // 9. GERAR EMBED URL
    // ============================================
    let embedUrl: string | null = null;
    let drmEnabled = false;

    if (provider === "panda") {
      embedUrl = await generatePandaSignedUrl(provider_video_id, watermarkText);
      drmEnabled = true;
    } else if (provider === "youtube") {
      embedUrl = generateYouTubeEmbedUrl(provider_video_id);
      drmEnabled = false;
    }

    if (!embedUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Falha ao gerar URL do vídeo",
          code: "URL_ERROR",
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // ============================================
    // 10. LOG DE ACESSO
    // ============================================
    try {
      await supabaseAdmin.from("video_access_logs").insert({
        user_id: user.id,
        lesson_id,
        provider_video_id,
        provider,
        action: "AUTHORIZED",
        session_id: session.id,
        details: {
          sessionCode,
          isImmune,
          isRelaxed,
          bypassReason,
          latencyMs: Date.now() - startTime,
        },
      });
    } catch (e) { console.error("Log error:", e); }

    // ============================================
    // 11. RESPOSTA
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        sessionCode,
        sessionToken,
        embedUrl,
        expiresAt: expiresAt.toISOString(),
        provider,
        drmEnabled,
        watermark: {
          text: watermarkText,
          hash: watermarkHash,
          mode: "moving",
        },
        sanctum: {
          version: SANCTUM_VERSION,
          isImmune,
          isRelaxed,
          bypassReason,
        },
        latencyMs: Date.now() - startTime,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("❌ Erro não tratado:", error);
    
    // 🛡️ PATCH-009: Mensagem genérica, sem detalhes internos
    return new Response(
      JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        code: "INTERNAL_ERROR",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
