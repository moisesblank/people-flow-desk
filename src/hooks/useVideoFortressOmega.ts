// ============================================
// 🔥🛡️ USE VIDEO FORTRESS OMEGA v5.0 🛡️🔥
// O HOOK DEFINITIVO — SANCTUM 2.0 + INTEGRAÇÃO TOTAL
// ============================================
// ✅ Integração com useAuth (roles)
// ✅ Integração com SecurityContext
// ✅ Integração com SNA (automações IA)
// ✅ Bypass inteligente para agentes
// ✅ Detecção gradual (warn → degrade → pause → reauth)
// ✅ Backend decide ações
// ✅ Métricas e analytics
// ============================================

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
    'employee', // Alias
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
    '192.168.', // Rede local
    '10.0.',    // Rede local
  ],
  
  // Emails com bypass TOTAL
  allowlistEmails: [
    'moisesblank@gmail.com',
    'suporte@moisesmedeiros.com.br',
    'bot@moisesmedeiros.com.br',
    'automacao@moisesmedeiros.com.br',
    'teste@moisesmedeiros.com.br',
    'dev@moisesmedeiros.com.br',
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
    none: 0,     // Sem ação
    warn: 50,    // Apenas log interno
    degrade: 100, // Blur leve
    pause: 200,   // Pausar vídeo
    reauth: 400,  // Pedir re-autenticação
    revoke: 800,  // Revogar sessão (RARO)
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
  heartbeatInterval: 30000, // 30 segundos
  devToolsCheckInterval: 3000, // 3 segundos (menos frequente)
  sessionTTL: 5, // minutos
  
  // Feature flags
  features: {
    devToolsDetection: true,
    keyboardBlocking: true,
    watermarkEnabled: true,
    heartbeatEnabled: true,
    violationReporting: true,
    // Novos
    aiAnomalyDetection: false, // Futuro: IA detecta anomalias
    biometricVerification: false, // Futuro: verificação biométrica
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
  // Autorização
  isAuthorizing: boolean;
  isAuthorized: boolean;
  session: VideoSessionOmega | null;
  error: string | null;
  
  // Sessão
  isSessionValid: boolean;
  sessionExpiresAt: Date | null;
  
  // Segurança SANCTUM
  isImmune: boolean;
  isRelaxed: boolean;
  bypassReason: string | null;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  
  // Detecção
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
  const hostname = window.location.hostname;
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
  const ua = navigator.userAgent;
  const matchedBot = SANCTUM_CONFIG.allowlistUserAgents.find(bot => ua.includes(bot));
  if (matchedBot) {
    return { isImmune: true, isRelaxed: false, reason: `BOT_AGENT:${matchedBot}` };
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
  const visibilityCountRef = useRef(0);
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

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-authorize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authSession.access_token}`,
            "x-device-fingerprint": fingerprint,
            "x-request-origin": window.location.origin,
            "x-sanctum-version": SANCTUM_CONFIG.version,
            "x-user-role": role || "viewer",
          },
          body: JSON.stringify({
            lesson_id: options.lessonId,
            course_id: options.courseId,
            provider_video_id: options.providerVideoId,
            provider: options.provider || "panda",
            sanctum: {
              isImmune: bypass.isImmune,
              isRelaxed: bypass.isRelaxed,
              bypassReason: bypass.reason,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Falha na autorização");
      }

      const session: VideoSessionOmega = {
        sessionId: data.sessionId,
        sessionCode: data.sessionCode,
        sessionToken: data.sessionToken,
        embedUrl: data.embedUrl,
        expiresAt: data.expiresAt,
        watermark: data.watermark,
        provider: data.provider,
        drmEnabled: data.drmEnabled,
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
        sessionExpiresAt: new Date(data.expiresAt),
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
      return null;
    }
  }, [user, role]);

  // ============================================
  // HEARTBEAT
  // ============================================
  const startHeartbeat = useCallback((sessionToken: string) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    const sendHeartbeat = async () => {
      const now = Date.now();
      if (now - lastHeartbeatRef.current < 25000) return;
      lastHeartbeatRef.current = now;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-heartbeat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-session-token": sessionToken,
            },
            body: JSON.stringify({
              session_token: sessionToken,
              position_seconds: getCurrentVideoPosition(),
            }),
          }
        );

        const data = await response.json();

        if (!data.success) {
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
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // ============================================
  // DETECTOR DE DEVTOOLS (SANCTUM — GRADUAL)
  // ============================================
  const startDevToolsDetector = useCallback(() => {
    if (devToolsIntervalRef.current) {
      clearInterval(devToolsIntervalRef.current);
    }

    const checkDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;

      const isOpen = widthDiff || heightDiff;
      
      setState(prev => {
        if (isOpen && !prev.devToolsOpen) {
          // DevTools acabou de abrir
          reportViolation("devtools_open", {
            widthDiff: window.outerWidth - window.innerWidth,
            heightDiff: window.outerHeight - window.innerHeight,
          });
        }
        return { ...prev, devToolsOpen: isOpen };
      });
    };

    devToolsIntervalRef.current = setInterval(checkDevTools, SANCTUM_CONFIG.devToolsCheckInterval);
  }, []);

  const stopDevToolsDetector = useCallback(() => {
    if (devToolsIntervalRef.current) {
      clearInterval(devToolsIntervalRef.current);
      devToolsIntervalRef.current = null;
    }
  }, []);

  // ============================================
  // REPORTAR VIOLAÇÃO (SANCTUM — BACKEND DECIDE)
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

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-violation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-token": state.session.sessionToken,
          },
          body: JSON.stringify({
            session_token: state.session.sessionToken,
            violation_type: type,
            details: {
              ...details,
              user_role: role,
              is_immune: state.isImmune,
              is_relaxed: state.isRelaxed,
              sanctum_version: SANCTUM_CONFIG.version,
            },
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const newScore = data.riskScore || state.riskScore + (severity * 5);
        const action = data.instructions?.action || getActionFromScore(newScore);
        
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
  }, [state.session?.sessionToken, state.isImmune, state.isRelaxed, role]);

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
  // MÉTRICAS (para dashboard)
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
// UTILITÁRIOS
// ============================================

async function generateDeviceFingerprint(): Promise<string> {
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
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

function getCurrentVideoPosition(): number {
  const video = document.querySelector("video");
  return video ? Math.floor(video.currentTime) : 0;
}

// ============================================
// EXPORTS
// ============================================
export default useVideoFortressOmega;
