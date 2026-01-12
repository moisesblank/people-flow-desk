// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v2.3
// SESSION_BINDING_ENFORCEMENT — Revogação INSTANTÂNEA via Realtime
// Frontend NUNCA revoga sessões — só reage a eventos do backend
// 🎯 P0 FIX v4: Ignora conflitos durante primeiro acesso/onboarding
// ============================================

import { useEffect, useRef, useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SessionRevokedOverlay } from "./SessionRevokedOverlay";

const SESSION_TOKEN_KEY = "matriz_session_token";
const SESSION_CHECK_INTERVAL = 30000; // 30s

// 🕐 JANELA DE SUPRESSÃO: Revogações mais antigas que 2 horas não mostram overlay
// Isso evita "ecos" de sessões revogadas ontem aparecerem hoje
const REVOCATION_STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 horas

// 🎯 Rotas onde NÃO devemos mostrar conflito de sessão (primeiro acesso)
const ONBOARDING_ROUTES = [
  '/primeiro-acesso',
  '/auth',
  '/security/device-limit',
  '/security/same-type-replacement',
];

interface SessionGuardProps {
  children: React.ReactNode;
}

export function SessionGuard({ children }: SessionGuardProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isValidatingRef = useRef(false);
  const isBootstrappingRef = useRef(false);
  const bootstrapAttemptsRef = useRef(0);
  const lastBootstrapAtRef = useRef(0);
  const hasLoggedOutRef = useRef(false);

  // Estado para controlar o overlay visual
  const [showRevokedOverlay, setShowRevokedOverlay] = useState(false);

  const BOOTSTRAP_RETRY_MS = 10_000;
  
  // 🏛️ CONSTITUIÇÃO: OWNER BYPASS ABSOLUTO para conflitos de sessão
  const isOwner = user?.email?.toLowerCase() === 'moisesblank@gmail.com';
  const MAX_BOOTSTRAP_ATTEMPTS = 3;
  
  // 🎯 P0 FIX v4: Detectar se estamos em rota de onboarding
  const isOnboardingRoute = ONBOARDING_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );

  /**
   * Exibe overlay visual e prepara logout
   * SOMENTE quando backend confirma revogação por novo dispositivo
   * 🏛️ OWNER BYPASS: Nunca mostra overlay para Owner
   * 🎯 P0 FIX v4: Nunca mostra overlay durante onboarding
   */
  const handleDeviceRevocation = useCallback(() => {
    // 🏛️ CONSTITUIÇÃO: Owner nunca é bloqueado por conflito de sessão
    if (isOwner) {
      console.log("[SessionGuard] ✅ OWNER BYPASS - conflito de sessão ignorado");
      return;
    }
    
    // 🎯 P0 FIX v4: Ignorar conflitos durante primeiro acesso
    if (isOnboardingRoute) {
      console.log("[SessionGuard] ✅ ONBOARDING BYPASS - conflito de sessão ignorado durante primeiro acesso");
      return;
    }
    
    if (hasLoggedOutRef.current) return;
    hasLoggedOutRef.current = true;

    console.error("[SessionGuard] 🔴 Sessão revogada - novo dispositivo detectado");

    // Limpar tokens imediatamente
    const keysToRemove = [
      "matriz_session_token",
      "matriz_last_heartbeat",
      "matriz_device_fingerprint",
      "matriz_trusted_device",
      "mfa_trust_cache",
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();

    // Mostrar overlay visual
    setShowRevokedOverlay(true);
  }, [isOwner, isOnboardingRoute]);

  /**
   * Callback quando usuário fecha o overlay
   */
  const handleOverlayClose = useCallback(async () => {
    setShowRevokedOverlay(false);
    await signOut();
  }, [signOut]);

  /**
   * Limpa TUDO e força logout — SOMENTE quando backend confirma revogação
   * Guarda contra múltiplos logouts simultâneos
   * 🏛️ OWNER BYPASS: Owner nunca é deslogado por conflito de sessão
   * 🎯 P0 FIX v4: Ignorar conflitos durante onboarding
   */
  const handleBackendRevocation = useCallback(
    async (reason: string, isDeviceChange = false) => {
      // 🏛️ CONSTITUIÇÃO: Owner tem bypass para conflitos de sessão
      if (isOwner && isDeviceChange) {
        console.log("[SessionGuard] ✅ OWNER BYPASS - revogação por dispositivo ignorada:", reason);
        return;
      }
      
      // 🎯 P0 FIX v4: Ignorar conflitos durante primeiro acesso
      if (isOnboardingRoute && isDeviceChange) {
        console.log("[SessionGuard] ✅ ONBOARDING BYPASS - revogação por dispositivo ignorada durante primeiro acesso");
        return;
      }
      
      if (hasLoggedOutRef.current) return;

      // Se é mudança de dispositivo, usar overlay visual
      if (isDeviceChange) {
        handleDeviceRevocation();
        return;
      }

      hasLoggedOutRef.current = true;
      console.error(`[SessionGuard] 🔴 Backend confirmou revogação: ${reason}`);

      // Limpar TUDO
      const keysToRemove = [
        "matriz_session_token",
        "matriz_last_heartbeat",
        "matriz_device_fingerprint",
        "matriz_trusted_device",
        "mfa_trust_cache",
      ];
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      sessionStorage.clear();

      await signOut();
    },
    [signOut, handleDeviceRevocation, isOwner, isOnboardingRoute],
  );

  const detectClientDeviceMeta = useCallback(() => {
    const ua = navigator.userAgent;

    let device_type = "desktop";
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
      device_type = /iPad|Tablet/i.test(ua) ? "tablet" : "mobile";
    }

    let browser = "unknown";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";

    let os = "unknown";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone")) os = "iOS";

    return { device_type, browser, os };
  }, []);

  /**
   * Bootstrap do token de sessão (P0):
   * Se o usuário está autenticado mas não existe matriz_session_token,
   * criamos a sessão única via backend (fonte da verdade).
   *
   * 🔧 FIX CRÍTICO: Falha de bootstrap NUNCA força logout!
   * 🎯 P0 FIX v4: NÃO fazer bootstrap durante onboarding (criação de sessão é feita lá)
   */
  const bootstrapSessionTokenIfMissing = useCallback(async () => {
    if (!user) return;
    
    // 🎯 P0 FIX v4: Não fazer bootstrap durante primeiro acesso
    // A sessão será criada na etapa 4 do onboarding (TrustDeviceStage)
    if (isOnboardingRoute) {
      console.log("[SessionGuard] ⏸️ Bootstrap suspenso - em rota de onboarding");
      return;
    }

    const existing = localStorage.getItem(SESSION_TOKEN_KEY);
    if (existing) return;

    const now = Date.now();
    if (isBootstrappingRef.current) return;
    if (now - lastBootstrapAtRef.current < BOOTSTRAP_RETRY_MS) return;

    if (bootstrapAttemptsRef.current >= MAX_BOOTSTRAP_ATTEMPTS) {
      console.warn("[SessionGuard] ⚠️ Máximo de tentativas de bootstrap atingido. Aguardando próximo ciclo.");
      bootstrapAttemptsRef.current = 0;
      lastBootstrapAtRef.current = now + 60_000;
      return;
    }

    bootstrapAttemptsRef.current += 1;
    lastBootstrapAtRef.current = now;
    isBootstrappingRef.current = true;

    try {
      console.warn("[SessionGuard] ⚠️ Token ausente — bootstrap de sessão única (RPC)");
      const meta = detectClientDeviceMeta();
      
      // 🔐 P0 FIX: SEMPRE usar hash do servidor (com pepper)
      const serverDeviceHash = localStorage.getItem('matriz_device_server_hash');
      if (!serverDeviceHash) {
        console.warn("[SessionGuard] ⚠️ Sem hash do servidor - dispositivo não registrado. Abortando bootstrap.");
        return;
      }

      const { data, error } = await supabase.rpc("create_single_session", {
        _ip_address: null,
        _user_agent: navigator.userAgent.slice(0, 255),
        _device_type: meta.device_type,
        _browser: meta.browser,
        _os: meta.os,
        _device_hash_from_server: serverDeviceHash, // 🔐 P0 FIX: Hash do SERVIDOR
      });

      const token = data?.[0]?.session_token;
      if (error || !token) {
        console.error("[SessionGuard] ❌ Bootstrap falhou:", error);
        return;
      }

      localStorage.setItem(SESSION_TOKEN_KEY, token);
      console.log("[SessionGuard] ✅ Bootstrap OK: matriz_session_token criado");
      bootstrapAttemptsRef.current = 0;
    } catch (e) {
      console.error("[SessionGuard] ❌ Erro inesperado no bootstrap:", e);
    } finally {
      isBootstrappingRef.current = false;
    }
  }, [user, isOnboardingRoute, detectClientDeviceMeta]);

  /**
   * Validar sessão consultando o BACKEND — nunca revoga por timer
   * 🔐 P0 FIX v5: Também verifica se mfa_verified = true
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!user || isValidatingRef.current || hasLoggedOutRef.current) return true;

    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);

    if (!storedToken) {
      await bootstrapSessionTokenIfMissing();
      return true;
    }

    isValidatingRef.current = true;

    try {
      const { data, error } = await supabase.rpc("validate_session_epoch", {
        p_session_token: storedToken,
      });

      if (error) {
        console.error("[SessionGuard] Erro na validação (rede):", error);
        isValidatingRef.current = false;
        return true;
      }

      const result = data?.[0];

      // 🔧 CORREÇÃO: usar status !== 'valid' ao invés de !is_valid
      if (result?.status !== "valid") {
        const reason = result?.reason || "SESSION_INVALID";

        // 🎯 DIFERENCIAR: user_logout não mostra overlay de conflito
        // SESSION_NOT_FOUND pode ser user_logout ou conflito real
        // Para ser preciso, verificamos se acabamos de fazer logout
        const justLoggedOut = !localStorage.getItem(SESSION_TOKEN_KEY);
        const isUserInitiatedLogout = justLoggedOut || reason === "USER_LOGOUT";

        console.warn(`[SessionGuard] 🔴 Backend revogou: ${reason}, justLoggedOut: ${justLoggedOut}`);

        if (isUserInitiatedLogout) {
          // Logout silencioso
          await handleBackendRevocation(reason, false);
        } else {
          // Conflito de sessão: mostrar overlay
          await handleBackendRevocation(reason, true);
        }

        isValidatingRef.current = false;
        return false;
      }

      isValidatingRef.current = false;
      return true;
    } catch (err) {
      console.error("[SessionGuard] Erro na validação:", err);
      isValidatingRef.current = false;
      return true;
    }
  }, [user, handleBackendRevocation, bootstrapSessionTokenIfMissing]);

  // ✅ Verificação periódica + visibilidade
  useEffect(() => {
    if (!user) return;

    const intervalId = window.setInterval(() => {
      validateSession();
    }, SESSION_CHECK_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        validateSession();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, validateSession]);

  // 🛡️ Broadcasts de lockdown/epoch/device-revoked/user-deleted
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("session-guard-lockdown")
      .on("broadcast", { event: "auth-lockdown" }, async () => {
        console.error("[SessionGuard] 📡 LOCKDOWN BROADCAST recebido!");
        await handleBackendRevocation("Sistema em manutenção de emergência.");
      })
      .on("broadcast", { event: "epoch-increment" }, async () => {
        console.error("[SessionGuard] 📡 EPOCH INCREMENT recebido!");
        await validateSession();
      })
      .subscribe();

    const userChannel = supabase
      .channel(`user:${user.id}`)
      .on("broadcast", { event: "device-revoked" }, async (payload) => {
        console.error("[SessionGuard] 📡 DEVICE REVOKED recebido!", payload);
        await handleBackendRevocation("Este dispositivo foi removido.");
      })
      .on("broadcast", { event: "user-deleted" }, async () => {
        console.error("[SessionGuard] 📡 USER DELETED recebido!");
        await handleBackendRevocation("Sua conta foi removida.");
      })
      // 🚀 Broadcast direto para revogação de sessão (conflito)
      // Só mostra overlay se NÃO for logout manual E se for recente (< 2h)
      .on("broadcast", { event: "session-revoked" }, async (msg) => {
        const reason = msg?.payload?.reason;
        const revokedAt = msg?.payload?.revoked_at;
        console.error("[SessionGuard] 📡 SESSION REVOKED BROADCAST recebido!", { reason, revokedAt });

        // Ignora se for logout manual do próprio usuário
        if (reason === "user_logout") {
          console.log("[SessionGuard] ✅ Broadcast de logout manual - ignorando overlay");
          return;
        }

        // 🕐 JANELA DE 2 HORAS: Ignorar revogações antigas
        if (revokedAt) {
          const revokedTime = new Date(revokedAt).getTime();
          const age = Date.now() - revokedTime;
          if (age > REVOCATION_STALE_THRESHOLD_MS) {
            console.log(`[SessionGuard] ✅ Revogação antiga (${Math.round(age / 60000)} min) - ignorando overlay`);
            return;
          }
        }

        // Conflito real E recente: mostrar overlay
        handleDeviceRevocation();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(userChannel);
    };
  }, [user, handleBackendRevocation, validateSession, handleDeviceRevocation]);

  // 🔒 SESSION_BINDING_ENFORCEMENT: Realtime listener on active_sessions
  // Filtrar por user_id (suportado) e verificar session_token no callback
  useEffect(() => {
    if (!user) return;

    const myToken = localStorage.getItem(SESSION_TOKEN_KEY);

    console.log(
      "[SessionGuard] 🔗 Iniciando listener Realtime para user:",
      user.id,
      "token:",
      myToken?.slice(0, 8) + "...",
    );

    const realtimeChannel = supabase
      .channel(`session-revocation-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "active_sessions",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newStatus = payload.new?.status;
          const payloadToken = payload.new?.session_token;
          const revokedReason = payload.new?.revoked_reason;
          const revokedAt = payload.new?.revoked_at;
          const currentToken = localStorage.getItem(SESSION_TOKEN_KEY);

          console.log("[SessionGuard] 📡 Realtime UPDATE active_sessions:", {
            newStatus,
            revokedReason,
            revokedAt,
            payloadToken: payloadToken?.slice(0, 8) + "...",
            currentToken: currentToken?.slice(0, 8) + "...",
            match: payloadToken === currentToken,
          });

          // ⚡ Se MINHA sessão foi revogada → verificar o motivo
          if (newStatus === "revoked" && payloadToken === currentToken) {
            // 🎯 DIFERENCIAR: user_logout vs conflito de sessão
            const isUserInitiatedLogout = revokedReason === "user_logout";

            if (isUserInitiatedLogout) {
              // Logout manual: não mostrar overlay de conflito
              console.log("[SessionGuard] ✅ Logout manual detectado - sem overlay de conflito");
              // Apenas limpar e sair silenciosamente
              const keysToRemove = [
                "matriz_session_token",
                "matriz_last_heartbeat",
                "matriz_device_fingerprint",
                "matriz_trusted_device",
                "mfa_trust_cache",
              ];
              keysToRemove.forEach((key) => localStorage.removeItem(key));
              sessionStorage.clear();
              await signOut();
            } else {
              // 🕐 JANELA DE 2 HORAS: Ignorar revogações antigas
              if (revokedAt) {
                const revokedTime = new Date(revokedAt).getTime();
                const age = Date.now() - revokedTime;
                if (age > REVOCATION_STALE_THRESHOLD_MS) {
                  console.log(`[SessionGuard] ✅ Revogação antiga (${Math.round(age / 60000)} min) - ignorando overlay`);
                  // Limpar token local para forçar relogin, mas SEM overlay dramático
                  localStorage.removeItem(SESSION_TOKEN_KEY);
                  await signOut();
                  return;
                }
              }
              
              // Conflito de sessão real E recente: mostrar overlay
              console.error("[SessionGuard] 🔴 Conflito de sessão detectado:", revokedReason);
              handleDeviceRevocation();
            }
          }
        },
      )
      .subscribe((status) => {
        console.log("[SessionGuard] 📡 Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [user, handleDeviceRevocation, signOut]);

  return (
    <>
      {children}
      {/* @ts-ignore - Props corretas, TypeScript desatualizado */}
      <SessionRevokedOverlay isVisible={showRevokedOverlay} onClose={handleOverlayClose} />
    </>
  );
}

export default SessionGuard;
