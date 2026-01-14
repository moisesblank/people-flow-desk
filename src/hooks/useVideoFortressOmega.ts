// ============================================
// 🔥🛡️ USE VIDEO FORTRESS OMEGA v5.0 🛡️🔥
// O HOOK DEFINITIVO — SANCTUM 2.0 + INTEGRAÇÃO TOTAL
// ============================================
// ✅ Integração com useAuth (roles)
// ✅ Bypass inteligente para agentes
// ✅ Detecção gradual (warn → degrade → pause → reauth)
// ✅ Backend decide ações
// ✅ Métricas e analytics
// ============================================

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getPandaEmbedUrl } from "@/lib/video/panda";
import { toast } from "sonner";

// ============================================
// 🛡️ SANCTUM CONFIG — CONFIGURAÇÃO CENTRAL
// ============================================
export const SANCTUM_CONFIG = {
  // Versão do protocolo
  version: "2.0-OMEGA",
  
  // Roles que são COMPLETAMENTE IMUNES
  immuneRoles: [
    'owner', 
    'admin', 
    'funcionario', 
    'suporte', 
    'coordenacao',
    'employee',
    'monitoria',
  ] as const,
  
  // Roles com proteção RELAXADA (log apenas)
  relaxedRoles: [
    'afiliado',
    'marketing',
    'contabilidade',
  ] as const,
  
  // Ambientes onde proteção é DESATIVADA
  devEnvironments: [
    'localhost', 
    '127.0.0.1', 
    'staging', 
    'dev', 
    'preview',
    '192.168.',
    '10.0.',
  ],
  
  // 🛡️ DEPRECATED: Email allowlist removido - usar role='owner' via useAuth
  // Emails mantidos apenas para bots/automações internas
  allowlistEmails: [
    // Emails de bots/automações (não pessoas)
    'bot@moisesmedeiros.com.br',
    'automacao@moisesmedeiros.com.br',
    // Owner bypass via role='owner', não via email
  ],
  
  // User agents de automações internas
  allowlistUserAgents: [
    'MoisesBot',
    'TramonAgent', 
    'SNAWorker',
    'SNAGateway',
    'Playwright',
    'Cypress',
    'Puppeteer',
    'HeadlessChrome',
    'PhantomJS',
  ],
  
  // Thresholds de ação (SANCTUM 2.0 — muito tolerante)
  thresholds: {
    none: 0,
    warn: 50,
    degrade: 100,
    pause: 200,
    reauth: 400,
    revoke: 800,
  },
  
  // Severidade por tipo de violação (REDUZIDA)
  severityMap: {
    context_menu: 1,
    drag_attempt: 1,
    copy_attempt: 1,
    visibility_abuse: 1,
    keyboard_shortcut: 2,
    devtools_open: 3,
    screenshot_attempt: 3,
    iframe_manipulation: 4,
    multiple_sessions: 5,
    screen_recording: 6,
    invalid_domain: 8,
    network_tampering: 9,
    unknown: 1,
  } as Record<string, number>,
  
  // Intervalos
  heartbeatInterval: 30000,
  devToolsCheckInterval: 3000,
  sessionTTL: 5,
  
  // Feature flags
  features: {
    devToolsDetection: true,
    keyboardBlocking: true,
    watermarkEnabled: true,
    heartbeatEnabled: true,
    violationReporting: true,
    aiAnomalyDetection: false,
    biometricVerification: false,
  },
};

// ============================================
// TIPOS
// ============================================
export interface VideoSessionOmega {
  sessionId: string;
  sessionCode: string;
  sessionToken: string;
  embedUrl: string;
  expiresAt: string;
  watermark: {
    text: string;
    hash: string;
    mode: "moving" | "static";
  };
  provider: "panda" | "youtube";
  drmEnabled: boolean;
  sanctum: {
    isImmune: boolean;
    isRelaxed: boolean;
    bypassReason?: string;
  };
}

export interface VideoFortressOmegaState {
  isAuthorizing: boolean;
  isAuthorized: boolean;
  session: VideoSessionOmega | null;
  error: string | null;
  isSessionValid: boolean;
  sessionExpiresAt: Date | null;
  isImmune: boolean;
  isRelaxed: boolean;
  bypassReason: string | null;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  devToolsOpen: boolean;
  violationCount: number;
  lastAction: string | null;
}

export type ViolationType = keyof typeof SANCTUM_CONFIG.severityMap;

interface AuthorizeOptions {
  lessonId?: string;
  courseId?: string;
  providerVideoId: string;
  provider?: "panda" | "youtube";
}

// ============================================
// FUNÇÕES DE BYPASS
// ============================================

/**
 * Verifica se o usuário/ambiente tem bypass TOTAL
 */
export function checkSanctumBypass(
  user: any, 
  userRole?: string | null
): { isImmune: boolean; isRelaxed: boolean; reason: string | null } {
  // 1. Ambiente de desenvolvimento
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isDev = SANCTUM_CONFIG.devEnvironments.some(env => hostname.includes(env));
  if (isDev) {
    return { isImmune: true, isRelaxed: false, reason: 'DEV_ENVIRONMENT' };
  }
  
  // 2. Role completamente imune
  if (userRole && SANCTUM_CONFIG.immuneRoles.includes(userRole as any)) {
    return { isImmune: true, isRelaxed: false, reason: `IMMUNE_ROLE:${userRole}` };
  }
  
  // 3. Role com proteção relaxada
  if (userRole && SANCTUM_CONFIG.relaxedRoles.includes(userRole as any)) {
    return { isImmune: false, isRelaxed: true, reason: `RELAXED_ROLE:${userRole}` };
  }
  
  // 4. Email na allowlist
  if (user?.email && SANCTUM_CONFIG.allowlistEmails.includes(user.email.toLowerCase())) {
    return { isImmune: true, isRelaxed: false, reason: `ALLOWLIST_EMAIL:${user.email}` };
  }
  
  // 5. User agent de automação
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent;
    const matchedBot = SANCTUM_CONFIG.allowlistUserAgents.find(bot => ua.includes(bot));
    if (matchedBot) {
      return { isImmune: true, isRelaxed: false, reason: `BOT_AGENT:${matchedBot}` };
    }
  }
  
  // 6. Sem bypass
  return { isImmune: false, isRelaxed: false, reason: null };
}

/**
 * Determina o nível de risco baseado no score
 */
function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= SANCTUM_CONFIG.thresholds.revoke) return "critical";
  if (score >= SANCTUM_CONFIG.thresholds.pause) return "high";
  if (score >= SANCTUM_CONFIG.thresholds.degrade) return "medium";
  return "low";
}

/**
 * Determina a ação baseada no score
 */
function getActionFromScore(score: number): string {
  const t = SANCTUM_CONFIG.thresholds;
  if (score >= t.revoke) return "revoke";
  if (score >= t.reauth) return "reauth";
  if (score >= t.pause) return "pause";
  if (score >= t.degrade) return "degrade";
  if (score >= t.warn) return "warn";
  return "none";
}

// ============================================
// UTILITÁRIOS
// ============================================

async function generateDeviceFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return 'server';
  
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.maxTouchPoints || 0,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ];

  const text = components.join("|");
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  try {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
  } catch {
    // Fallback simples
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).slice(0, 32).padStart(32, '0');
  }
}

function getCurrentVideoPosition(): number {
  if (typeof document === 'undefined') return 0;
  const video = document.querySelector("video");
  return video ? Math.floor(video.currentTime) : 0;
}

// ============================================
// HOOK PRINCIPAL
// ============================================
export function useVideoFortressOmega() {
  const { user, role } = useAuth();
  
  // Estado principal
  const [state, setState] = useState<VideoFortressOmegaState>({
    isAuthorizing: false,
    isAuthorized: false,
    session: null,
    error: null,
    isSessionValid: true,
    sessionExpiresAt: null,
    isImmune: false,
    isRelaxed: false,
    bypassReason: null,
    riskScore: 0,
    riskLevel: "low",
    devToolsOpen: false,
    violationCount: 0,
    lastAction: null,
  });

  // Refs
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const devToolsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef(0);

  // ============================================
  // VERIFICAR BYPASS NA MONTAGEM
  // ============================================
  useEffect(() => {
    const bypass = checkSanctumBypass(user, role);
    
    setState(prev => ({
      ...prev,
      isImmune: bypass.isImmune,
      isRelaxed: bypass.isRelaxed,
      bypassReason: bypass.reason,
    }));

    if (bypass.isImmune) {
      console.log(`🛡️ SANCTUM ${SANCTUM_CONFIG.version}: Bypass ativo`, {
        reason: bypass.reason,
        role,
        email: user?.email,
      });
    }
  }, [user, role]);

  // ============================================
  // HEARTBEAT
  // ============================================
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback((sessionToken: string) => {
    stopHeartbeat();

    const sendHeartbeat = async () => {
      const now = Date.now();
      if (now - lastHeartbeatRef.current < 25000) return;
      lastHeartbeatRef.current = now;

      try {
        const { data, error } = await supabase.rpc("video_session_heartbeat", {
          p_session_token: sessionToken,
          p_position_seconds: getCurrentVideoPosition(),
        });

        if (error || !data) {
          setState(prev => ({
            ...prev,
            isSessionValid: false,
            error: "Sessão expirada ou revogada",
          }));
          stopHeartbeat();
        }
      } catch (error) {
        console.warn("🛡️ SANCTUM: Heartbeat falhou (ignorado)", error);
      }
    };

    heartbeatIntervalRef.current = setInterval(sendHeartbeat, SANCTUM_CONFIG.heartbeatInterval);
  }, [stopHeartbeat]);

  // ============================================
  // DETECTOR DE DEVTOOLS
  // ============================================
  const stopDevToolsDetector = useCallback(() => {
    if (devToolsIntervalRef.current) {
      clearInterval(devToolsIntervalRef.current);
      devToolsIntervalRef.current = null;
    }
  }, []);

  const startDevToolsDetector = useCallback(() => {
    stopDevToolsDetector();

    const checkDevTools = () => {
      if (typeof window === 'undefined') return;
      
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      const isOpen = widthDiff || heightDiff;
      
      setState(prev => {
        if (isOpen && !prev.devToolsOpen) {
          console.log("🛡️ SANCTUM: DevTools detectado");
        }
        return { ...prev, devToolsOpen: isOpen };
      });
    };

    // PATCH-026: jitter anti-herd (0-3s)
    const jitter = Math.floor(Math.random() * 3000);
    devToolsIntervalRef.current = setInterval(checkDevTools, SANCTUM_CONFIG.devToolsCheckInterval + jitter);
  }, [stopDevToolsDetector]);

  // ============================================
  // REPORTAR VIOLAÇÃO
  // ============================================
  const reportViolation = useCallback(async (
    type: ViolationType,
    details?: Record<string, unknown>
  ): Promise<{ action: string; score: number } | null> => {
    // Imunes não reportam
    if (state.isImmune) {
      console.log(`🛡️ SANCTUM: Violação ignorada (imune) - ${type}`);
      return null;
    }

    // Relaxados apenas logam
    if (state.isRelaxed) {
      console.log(`🛡️ SANCTUM: Violação logada (relaxado) - ${type}`);
      return { action: "none", score: 0 };
    }

    if (!state.session?.sessionToken) return null;
    if (!SANCTUM_CONFIG.features.violationReporting) return null;

    try {
      const severity = SANCTUM_CONFIG.severityMap[type] || 1;
      
      // Mapear tipos internos para tipos do banco
      const dbViolationType = ['extension_detected', 'automation_detected', 'debugger_detected', 'console_open'].includes(type) 
        ? 'unknown' 
        : type;

      const { data, error } = await supabase.rpc("register_video_violation", {
        p_session_token: state.session.sessionToken,
        p_violation_type: dbViolationType as "context_menu" | "copy_attempt" | "devtools_open" | "drag_attempt" | "expired_token" | "iframe_manipulation" | "invalid_domain" | "keyboard_shortcut" | "multiple_sessions" | "network_tampering" | "screen_recording" | "screenshot_attempt" | "unknown" | "visibility_abuse",
        p_severity: severity,
        p_details: {
          ...details,
          user_role: role,
          is_immune: state.isImmune,
          is_relaxed: state.isRelaxed,
          sanctum_version: SANCTUM_CONFIG.version,
        },
      });

      if (!error && data) {
        const responseData = data as { risk_score?: number; action?: string };
        const newScore = responseData.risk_score || state.riskScore + (severity * 5);
        const action = responseData.action || getActionFromScore(newScore);
        
        setState(prev => ({
          ...prev,
          riskScore: newScore,
          riskLevel: getRiskLevel(newScore),
          violationCount: prev.violationCount + 1,
          lastAction: action,
        }));

        return { action, score: newScore };
      }
    } catch (error) {
      console.warn("🛡️ SANCTUM: Falha ao reportar (ignorado)", error);
    }

    return null;
  }, [state.session?.sessionToken, state.isImmune, state.isRelaxed, state.riskScore, role]);

  // ============================================
  // AUTORIZAÇÃO
  // ============================================
  const authorize = useCallback(async (options: AuthorizeOptions): Promise<VideoSessionOmega | null> => {
    if (!user) {
      setState(prev => ({ ...prev, error: "Usuário não autenticado" }));
      return null;
    }

    setState(prev => ({ ...prev, isAuthorizing: true, error: null }));

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (!authSession?.access_token) {
        throw new Error("Sessão inválida");
      }

      const fingerprint = await generateDeviceFingerprint();
      const bypass = checkSanctumBypass(user, role);

      // Usar RPC com os parâmetros corretos
      const { data, error } = await supabase.rpc("create_video_session", {
        p_user_id: user.id,
        p_lesson_id: options.lessonId || undefined,
        p_course_id: options.courseId || undefined,
        p_provider_video_id: options.providerVideoId,
        p_provider: options.provider || "panda",
        p_device_fingerprint: fingerprint,
        p_user_agent: navigator.userAgent.slice(0, 255),
      });

      if (error) {
        throw new Error(error.message);
      }

      // 🛡️ v11.0 FIX: A função SQL retorna diretamente os dados, não um objeto {success: boolean}
      const responseData = data as {
        session_id?: string;
        session_code?: string;
        session_token?: string;
        expires_at?: string;
        watermark_text?: string;
        watermark_hash?: string;
        error?: string;
      };

      // 🛡️ v11.0 FIX: Verificar session_id em vez de success
      if (!responseData || !responseData.session_id) {
        throw new Error(responseData?.error || "Falha ao criar sessão de vídeo");
      }

      // Construir URL do embed baseado no provider
      let embedUrl = "";
      if (options.provider === "youtube") {
        const params = new URLSearchParams({
          rel: "0",
          modestbranding: "1",
          showinfo: "0",
          iv_load_policy: "3",
          disablekb: "1",
          fs: "1",
          playsinline: "1",
          enablejsapi: "1",
          origin: window.location.origin,
        });
        embedUrl = `https://www.youtube.com/embed/${options.providerVideoId}?${params}`;
      } else {
        embedUrl = getPandaEmbedUrl(options.providerVideoId);
      }

      const session: VideoSessionOmega = {
        sessionId: responseData.session_id,
        sessionCode: responseData.session_code || responseData.session_id.slice(0, 8).toUpperCase(),
        sessionToken: responseData.session_token || '',
        embedUrl,
        expiresAt: responseData.expires_at || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        // 🛡️ v11.0 FIX: A função SQL retorna watermark_text, não um objeto watermark
        watermark: {
          text: responseData.watermark_text || `${user.email?.split('@')[0] || 'user'}`,
          hash: responseData.watermark_hash || fingerprint.slice(0, 8),
          mode: "moving",
        },
        provider: options.provider || "panda",
        drmEnabled: false,
        sanctum: {
          isImmune: bypass.isImmune,
          isRelaxed: bypass.isRelaxed,
          bypassReason: bypass.reason || undefined,
        },
      };

      setState(prev => ({
        ...prev,
        isAuthorizing: false,
        isAuthorized: true,
        session,
        error: null,
        isSessionValid: true,
        sessionExpiresAt: new Date(responseData.expires_at || Date.now() + 5 * 60 * 1000),
        isImmune: bypass.isImmune,
        isRelaxed: bypass.isRelaxed,
        bypassReason: bypass.reason,
      }));

      // Iniciar heartbeat se habilitado e não imune
      if (SANCTUM_CONFIG.features.heartbeatEnabled && !bypass.isImmune) {
        startHeartbeat(session.sessionToken);
      }

      // Iniciar detector de DevTools se habilitado e não imune
      if (SANCTUM_CONFIG.features.devToolsDetection && !bypass.isImmune) {
        startDevToolsDetector();
      }

      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setState(prev => ({ 
        ...prev, 
        isAuthorizing: false, 
        error: message,
      }));
      toast.error(`Erro ao autorizar: ${message}`);
      return null;
    }
  }, [user, role, startHeartbeat, startDevToolsDetector]);

  // ============================================
  // FINALIZAR SESSÃO
  // ============================================
  const endSession = useCallback(async () => {
    stopHeartbeat();
    stopDevToolsDetector();
    
    if (state.session?.sessionToken) {
      try {
        await supabase.rpc("end_video_session", {
          p_session_token: state.session.sessionToken,
        });
      } catch (error) {
        console.warn("🛡️ SANCTUM: Falha ao finalizar sessão", error);
      }
    }

    setState(prev => ({
      ...prev,
      isAuthorized: false,
      session: null,
      isSessionValid: false,
    }));
  }, [state.session?.sessionToken, stopHeartbeat, stopDevToolsDetector]);

  // ============================================
  // CLEANUP
  // ============================================
  useEffect(() => {
    return () => {
      stopHeartbeat();
      stopDevToolsDetector();
    };
  }, [stopHeartbeat, stopDevToolsDetector]);

  // ============================================
  // MÉTRICAS
  // ============================================
  const metrics = useMemo(() => ({
    sanctumVersion: SANCTUM_CONFIG.version,
    isImmune: state.isImmune,
    isRelaxed: state.isRelaxed,
    bypassReason: state.bypassReason,
    riskScore: state.riskScore,
    riskLevel: state.riskLevel,
    violationCount: state.violationCount,
    sessionActive: state.isAuthorized && state.isSessionValid,
    devToolsOpen: state.devToolsOpen,
    lastAction: state.lastAction,
  }), [state]);

  // ============================================
  // RETORNO
  // ============================================
  return {
    // Estado
    ...state,
    
    // Ações
    authorize,
    reportViolation,
    endSession,
    
    // Config
    config: SANCTUM_CONFIG,
    
    // Métricas
    metrics,
    
    // Helpers
    checkBypass: () => checkSanctumBypass(user, role),
  };
}

// ============================================
// EXPORTS
// ============================================
export default useVideoFortressOmega;
