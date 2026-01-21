// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v3.0
// SESSION_BINDING_ENFORCEMENT — Revogação INSTANTÂNEA via Realtime
// 🔧 P0 FIX: Verifica DB ANTES de mostrar overlay (anti false-positive)
// Frontend NUNCA revoga sessões — só reage a eventos do backend
// ============================================

import { useEffect, useRef, useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SessionRevokedOverlay } from "./SessionRevokedOverlay";
import { useSessionValidator, type SessionValidationResult } from "@/hooks/useSessionValidator";
import { emitSessionTokenChanged } from "@/lib/sessionTokenBus";

const SESSION_TOKEN_KEY = "matriz_session_token";
const SESSION_CHECK_INTERVAL = 30000; // 30s

// 🕐 JANELA DE SUPRESSÃO: Revogações mais antigas que 2 horas não mostram overlay
const REVOCATION_STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 horas

// 🔒 P0 FIX: Grace period após login para evitar race condition
// Não validar sessão nos primeiros 5 segundos após login
const LOGIN_GRACE_PERIOD_MS = 5000;
const LOGIN_TIMESTAMP_KEY = "matriz_login_timestamp";

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

  // Hook de validação com retry e diagnóstico
  const { 
    validateSessionWithRetry, 
    logOverlayEvent,
    forceRevalidation,
    resetRetryCount 
  } = useSessionValidator();

  // Estado para controlar o overlay visual
  const [showRevokedOverlay, setShowRevokedOverlay] = useState(false);
  const [overlayReason, setOverlayReason] = useState<string | undefined>();

  const BOOTSTRAP_RETRY_MS = 10_000;
  
  // 🏛️ CONSTITUIÇÃO: OWNER BYPASS ABSOLUTO para conflitos de sessão
  // 🛡️ SECURITY: Verificar via role='owner' (não por email)
  const { role } = useAuth();
  const isOwner = role === 'owner';
  const MAX_BOOTSTRAP_ATTEMPTS = 3;
  
  // 🎯 P0 FIX v4: Detectar se estamos em rota de onboarding
  const isOnboardingRoute = ONBOARDING_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );

  /**
   * 🔧 P0 FIX v3.0: Verifica no DB ANTES de mostrar overlay
   * Só mostra se revogação for CONFIRMADA e REAL
   */
  const verifyAndShowOverlay = useCallback(async (
    triggerSource: string,
    suspectedReason?: string
  ): Promise<boolean> => {
    // Bypass para owner
    if (isOwner) {
      console.log("[SessionGuard] ✅ OWNER BYPASS - overlay suprimido");
      return false;
    }

    // Bypass durante onboarding
    if (isOnboardingRoute) {
      console.log("[SessionGuard] ✅ ONBOARDING BYPASS - overlay suprimido");
      return false;
    }

    // Validar no banco ANTES de mostrar overlay
    console.log(`[SessionGuard] 🔍 Verificando sessão no DB antes de overlay (trigger: ${triggerSource})`);
    const result = await validateSessionWithRetry();

    // Logar evento para diagnóstico
    await logOverlayEvent(user?.id, result, triggerSource);

    // Só mostra overlay se DB confirmar que deve mostrar
    if (result.shouldShowOverlay) {
      console.error(`[SessionGuard] 🔴 Revogação CONFIRMADA pelo DB: ${result.reason}`);
      setOverlayReason(result.revokedReason || suspectedReason);
      setShowRevokedOverlay(true);
      return true;
    }

    // Se não deve mostrar overlay mas sessão é inválida, fazer logout silencioso
    if (!result.isValid && !result.shouldShowOverlay) {
      console.log(`[SessionGuard] 🔄 Sessão inválida mas sem overlay: ${result.reason}`);
      
      // 🔒 P0 FIX: Verificar grace period antes de fazer signOut silencioso
      // Evita race condition onde login acabou de acontecer mas sessão ainda não propagou
      const loginTimestamp = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
      const timeSinceLogin = loginTimestamp ? Date.now() - parseInt(loginTimestamp, 10) : Infinity;
      
      if (result.reason === 'SESSION_NOT_FOUND' && timeSinceLogin < LOGIN_GRACE_PERIOD_MS) {
        console.log(`[SessionGuard] ⏸️ Grace period ativo (${Math.round(timeSinceLogin/1000)}s) - NÃO fazer signOut`);
        return false; // Não fazer nada, aguardar propagação
      }
      
      if (result.reason === 'USER_LOGOUT' || result.reason === 'SESSION_NOT_FOUND') {
        // Limpar e redirecionar silenciosamente
        const keysToRemove = [
          "matriz_session_token",
          "matriz_last_heartbeat",
          "matriz_device_fingerprint",
          "matriz_trusted_device",
          "mfa_trust_cache",
          LOGIN_TIMESTAMP_KEY, // Limpar também o timestamp
        ];
        keysToRemove.forEach((key) => localStorage.removeItem(key));
        sessionStorage.clear();
        await signOut();
      }
    }

    return false;
  }, [isOwner, isOnboardingRoute, validateSessionWithRetry, logOverlayEvent, user?.id, signOut]);

  /**
   * Callback de retry do overlay
   * Retorna true se recovery bem-sucedido (sessão válida)
   */
  const handleOverlayRetry = useCallback(async (): Promise<boolean> => {
    resetRetryCount();
    const result = await forceRevalidation();
    
    if (result.isValid) {
      console.log("[SessionGuard] ✅ Recovery bem-sucedido! Sessão válida.");
      setShowRevokedOverlay(false);
      return true;
    }

    console.log(`[SessionGuard] ❌ Recovery falhou: ${result.reason}`);
    return false;
  }, [forceRevalidation, resetRetryCount]);

  /**
   * Callback quando usuário fecha o overlay
   */
  const handleOverlayClose = useCallback(async () => {
    setShowRevokedOverlay(false);
    
    // Limpar tokens
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
  }, [signOut]);

  /**
   * Limpa TUDO e força logout — SOMENTE quando backend confirma revogação
   */
  const handleBackendRevocation = useCallback(
    async (reason: string, isDeviceChange = false) => {
      if (hasLoggedOutRef.current) return;

      // Se é mudança de dispositivo, verificar no DB antes de mostrar overlay
      if (isDeviceChange) {
        const shown = await verifyAndShowOverlay('backend_revocation', reason);
        if (!shown) return; // DB não confirmou, não fazer nada
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
    [signOut, verifyAndShowOverlay],
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
   * Bootstrap do token de sessão
   * 🔐 P0 FIX v4: Owner SEMPRE pode criar sessão mesmo com token dessincronizado
   */
  const bootstrapSessionTokenIfMissing = useCallback(async (forceForOwner = false) => {
    if (!user) return;
    
    // 🔐 P0 FIX: Owner bypass - verificar role + email (fallback assíncrono)
    const currentIsOwner = role === 'owner' || user?.email?.toLowerCase() === 'moisesblank@gmail.com';
    
    if (isOnboardingRoute) {
      console.log("[SessionGuard] ⏸️ Bootstrap suspenso - em rota de onboarding");
      return;
    }

    const existing = localStorage.getItem(SESSION_TOKEN_KEY);
    
    // 🔐 P0 FIX v4: Owner pode forçar novo bootstrap mesmo com token existente
    if (existing && !forceForOwner) return;

    const now = Date.now();
    if (isBootstrappingRef.current) return;
    
    // 🔐 P0 FIX v4: Owner ignora cooldown de retry
    if (!currentIsOwner && now - lastBootstrapAtRef.current < BOOTSTRAP_RETRY_MS) return;

    if (!currentIsOwner && bootstrapAttemptsRef.current >= MAX_BOOTSTRAP_ATTEMPTS) {
      console.warn("[SessionGuard] ⚠️ Máximo de tentativas de bootstrap atingido.");
      bootstrapAttemptsRef.current = 0;
      lastBootstrapAtRef.current = now + 60_000;
      return;
    }

    bootstrapAttemptsRef.current += 1;
    lastBootstrapAtRef.current = now;
    isBootstrappingRef.current = true;

    try {
      console.warn("[SessionGuard] ⚠️ Token ausente/inválido — bootstrap de sessão (RPC)");
      const meta = detectClientDeviceMeta();
      
      let serverDeviceHash = localStorage.getItem('matriz_device_server_hash');
      
      // 🔐 P0 FIX v4: Owner sem hash - gerar hash temporário para criar sessão
      if (!serverDeviceHash) {
        if (currentIsOwner) {
          console.log("[SessionGuard] 👑 Owner sem hash - gerando hash temporário para bootstrap");
          // Gerar um hash básico para o Owner poder criar sessão
          serverDeviceHash = `owner_temp_${crypto.randomUUID()}`;
          localStorage.setItem('matriz_device_server_hash', serverDeviceHash);
        } else {
          console.warn("[SessionGuard] ⚠️ Sem hash do servidor - dispositivo não registrado.");
          isBootstrappingRef.current = false;
          return;
        }
      }

      // 🔐 P0 FIX v4: Para Owner, limpar token antigo antes de criar novo
      if (currentIsOwner && forceForOwner) {
        localStorage.removeItem(SESSION_TOKEN_KEY);
        emitSessionTokenChanged({ token: null, source: 'SessionGuard:owner-force-clear' });
        console.log("[SessionGuard] 👑 Owner: Token antigo removido, criando novo...");
      }

      const { data, error } = await supabase.rpc("create_single_session", {
        _ip_address: null,
        _user_agent: navigator.userAgent.slice(0, 255),
        _device_type: meta.device_type,
        _browser: meta.browser,
        _os: meta.os,
        _device_hash_from_server: serverDeviceHash,
      });

      const token = data?.[0]?.session_token;
      if (error || !token) {
        console.error("[SessionGuard] ❌ Bootstrap falhou:", error);
        // 🔐 P0 FIX v4: Owner continua mesmo sem token
        if (currentIsOwner) {
          console.log("[SessionGuard] 👑 Owner: Bootstrap falhou mas navegação permitida");
        }
        return;
      }

      localStorage.setItem(SESSION_TOKEN_KEY, token);
      emitSessionTokenChanged({ token, source: 'SessionGuard:bootstrap' });
      localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
      console.log("[SessionGuard] ✅ Bootstrap OK: matriz_session_token criado");
      bootstrapAttemptsRef.current = 0;
    } catch (e) {
      console.error("[SessionGuard] ❌ Erro inesperado no bootstrap:", e);
      // 🔐 P0 FIX v4: Owner continua mesmo com erro
      if (currentIsOwner) {
        console.log("[SessionGuard] 👑 Owner: Erro no bootstrap mas navegação permitida");
      }
    } finally {
      isBootstrappingRef.current = false;
    }
  }, [user, role, isOnboardingRoute, detectClientDeviceMeta]);

  /**
   * Validar sessão consultando o BACKEND
   * 🔐 P0 FIX v4: Owner com token inválido = criar novo automaticamente
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!user || isValidatingRef.current || hasLoggedOutRef.current) return true;
    
    // 🔐 P0 FIX v4: Detectar Owner antecipadamente
    const currentIsOwner = role === 'owner' || user?.email?.toLowerCase() === 'moisesblank@gmail.com';

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
        return true; // Não bloquear por erro de rede
      }

      const result = data?.[0];

      if (result?.status !== "valid") {
        const reason = result?.reason || "SESSION_INVALID";
        const justLoggedOut = !localStorage.getItem(SESSION_TOKEN_KEY);
        const isUserInitiatedLogout = justLoggedOut || reason === "USER_LOGOUT";

        console.warn(`[SessionGuard] 🔴 Backend revogou: ${reason}`);

        // 🔐 P0 FIX v4: Owner com sessão inválida = criar nova automaticamente
        if (currentIsOwner && !isUserInitiatedLogout) {
          console.log("[SessionGuard] 👑 Owner: Sessão inválida detectada - criando nova automaticamente...");
          isValidatingRef.current = false;
          await bootstrapSessionTokenIfMissing(true); // Force new session
          return true; // Permitir navegação
        }

        if (isUserInitiatedLogout) {
          await handleBackendRevocation(reason, false);
        } else {
          // 🔧 P0 FIX: Verificar no DB antes de mostrar overlay
          await verifyAndShowOverlay('validate_session_epoch', reason);
        }

        isValidatingRef.current = false;
        return false;
      }

      isValidatingRef.current = false;
      return true;
    } catch (err) {
      console.error("[SessionGuard] Erro na validação:", err);
      isValidatingRef.current = false;
      // 🔐 P0 FIX v4: Owner continua mesmo com erro de validação
      if (currentIsOwner) {
        console.log("[SessionGuard] 👑 Owner: Erro de validação ignorado");
        return true;
      }
      return true;
    }
  }, [user, role, handleBackendRevocation, bootstrapSessionTokenIfMissing, verifyAndShowOverlay]);

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
        // 🔧 P0 FIX: Verificar no DB antes de mostrar overlay
        await verifyAndShowOverlay('broadcast_device_revoked', 'device_revoked');
      })
      .on("broadcast", { event: "user-deleted" }, async () => {
        console.error("[SessionGuard] 📡 USER DELETED recebido!");
        await handleBackendRevocation("Sua conta foi removida.");
      })
      .on("broadcast", { event: "session-revoked" }, async (msg) => {
        const reason = msg?.payload?.reason;
        const revokedAt = msg?.payload?.revoked_at;
        console.error("[SessionGuard] 📡 SESSION REVOKED BROADCAST:", { reason, revokedAt });

        // Ignora logout manual
        if (reason === "user_logout") {
          console.log("[SessionGuard] ✅ Logout manual - ignorando overlay");
          return;
        }

        // Ignorar revogações antigas (> 2h)
        if (revokedAt) {
          const age = Date.now() - new Date(revokedAt).getTime();
          if (age > REVOCATION_STALE_THRESHOLD_MS) {
            console.log(`[SessionGuard] ✅ Revogação antiga (${Math.round(age / 60000)} min) - ignorando`);
            return;
          }
        }

        // 🔧 P0 FIX: Verificar no DB antes de mostrar overlay
        await verifyAndShowOverlay('broadcast_session_revoked', reason);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(userChannel);
    };
  }, [user, handleBackendRevocation, validateSession, verifyAndShowOverlay]);

  // 🔒 Realtime listener on active_sessions
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
            match: payloadToken === currentToken,
          });

          // Se MINHA sessão foi revogada
          if (newStatus === "revoked" && payloadToken === currentToken) {
            const isUserInitiatedLogout = revokedReason === "user_logout";

            if (isUserInitiatedLogout) {
              console.log("[SessionGuard] ✅ Logout manual - sem overlay");
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
              // Ignorar revogações antigas
              if (revokedAt) {
                const age = Date.now() - new Date(revokedAt).getTime();
                if (age > REVOCATION_STALE_THRESHOLD_MS) {
                  console.log(`[SessionGuard] ✅ Revogação antiga - logout silencioso`);
                  localStorage.removeItem(SESSION_TOKEN_KEY);
                  await signOut();
                  return;
                }
              }
              
              // 🔧 P0 FIX: Verificar no DB antes de mostrar overlay
              await verifyAndShowOverlay('realtime_session_update', revokedReason);
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
  }, [user, verifyAndShowOverlay, signOut]);

  return (
    <>
      {children}
      <SessionRevokedOverlay 
        isVisible={showRevokedOverlay} 
        onClose={handleOverlayClose}
        onRetry={handleOverlayRetry}
        reason={overlayReason}
      />
    </>
  );
}

export default SessionGuard;
