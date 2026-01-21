// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v3.1
// Autenticação com DOGMA I: Sessão Única
// + LEI VI: Validação de Dispositivo
// + Heartbeat Contínuo
// + P0 FIX: Bloqueia redirect se password_change_pending
// ============================================

import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef, useMemo } from "react";
import { User, Session, Provider } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { collectEnhancedFingerprint } from "@/lib/enhancedFingerprint";
import { getPostLoginRedirect, type AppRole } from "@/core/urlAccessControl";

// 🛡️ DEPRECATED: OWNER_EMAIL removido - verificação via role='owner' no banco
// const OWNER_EMAIL = "moisesblank@gmail.com";
const SESSION_TOKEN_KEY = "matriz_session_token";
const HEARTBEAT_INTERVAL = 60_000; // 1 minuto
const LAST_HEARTBEAT_KEY = "matriz_last_heartbeat";

interface DeviceValidationResult {
  riskScore: number;
  action: "allow" | "monitor" | "challenge" | "block";
  requiresChallenge: boolean;
  isNewDevice: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
  deviceValidation: DeviceValidationResult | null;
  signIn: (
    email: string,
    password: string,
    opts?: { turnstileToken?: string },
  ) => Promise<{ error: Error | null; user?: User | null; needsChallenge?: boolean; blocked?: boolean }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signInWithProvider: (provider: Provider) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  validateCurrentDevice: () => Promise<DeviceValidationResult | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// HELPER: Coletar fingerprint (usa versão reforçada)
// ============================================
async function collectFingerprint(): Promise<{ hash: string; data: Record<string, unknown> }> {
  try {
    // Usar fingerprint reforçado com WebRTC, Canvas, WebGL, etc
    const result = await collectEnhancedFingerprint();
    return { hash: result.hash, data: result.data as unknown as Record<string, unknown> };
  } catch (err) {
    // Fallback para versão básica se o reforçado falhar
    console.warn("[Auth] Fingerprint reforçado falhou, usando básico:", err);
    const data: Record<string, unknown> = {
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory || null,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      deviceType: (() => {
        const ua = navigator.userAgent;
        // 🖥️ DESKTOP FIRST
        if (/Mac OS X|Macintosh/i.test(ua) && !/iPhone|iPad/i.test(ua)) return "desktop";
        if (/Windows NT/i.test(ua) && !/Phone/i.test(ua)) return "desktop";
        if (/Linux/i.test(ua) && !/Android/i.test(ua)) return "desktop";
        // 📱 Tablet
        if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "tablet";
        // 📲 Mobile
        if (/Mobi|Android.*Mobile|iPhone/i.test(ua)) return "mobile";
        return "desktop";
      })(),
      browser: navigator.userAgent.includes("Firefox")
        ? "Firefox"
        : navigator.userAgent.includes("Edg")
          ? "Edge"
          : navigator.userAgent.includes("Chrome")
            ? "Chrome"
            : navigator.userAgent.includes("Safari")
              ? "Safari"
              : "Unknown",
      os: navigator.userAgent.includes("Windows")
        ? "Windows"
        : navigator.userAgent.includes("Mac")
          ? "macOS"
          : navigator.userAgent.includes("Linux")
            ? "Linux"
            : navigator.userAgent.includes("Android")
              ? "Android"
              : navigator.userAgent.includes("iPhone")
                ? "iOS"
                : "Unknown",
    };

    const hashSource = JSON.stringify(data);
    const buffer = new TextEncoder().encode(hashSource);
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    return { hash, data };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceValidation, setDeviceValidation] = useState<DeviceValidationResult | null>(null);

  // ✅ REGRA MATRIZ v2: Role derivada do banco (role='owner')
  // Email não é mais usado para determinar owner - banco é fonte da verdade
  const derivedRole = useMemo((): AppRole | null => {
    // Prioriza role do banco
    return role;
  }, [role]);

  // Heartbeat refs
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const missedHeartbeatsRef = useRef(0);

  // =====================================================
  // P0: Post-auth side-effects (SEM setTimeout)
  // - Evita duplicidade de create_single_session
  // - Evita race com SessionGuard/useSingleSession
  // =====================================================
  const postSignInPayloadRef = useRef<{ userId: string; email: string | null } | null>(null);
  const processedSignInTokenRef = useRef<string | null>(null);
  const [postSignInTick, setPostSignInTick] = useState(0);
  const [securitySessionReady, setSecuritySessionReady] = useState(false);

  // ============================================
  // HEARTBEAT CONTÍNUO
  // ============================================
  const sendHeartbeat = useCallback(async () => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);

    if (!sessionToken) {
      return;
    }

    try {
      const { error } = await supabase
        .from("active_sessions")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("session_token", sessionToken)
        .eq("status", "active");

      if (error) {
        missedHeartbeatsRef.current++;
        console.warn("[Heartbeat] Erro:", error.message);

        // ✅ Frontend NUNCA revoga sessões por contador de falhas
        // Backend é a fonte da verdade — SessionGuard valida via RPC
        if (missedHeartbeatsRef.current >= 3) {
          console.warn("[Heartbeat] Múltiplas falhas — aguardando validação do backend");
        }
      } else {
        missedHeartbeatsRef.current = 0;
        localStorage.setItem(LAST_HEARTBEAT_KEY, new Date().toISOString());
      }
    } catch (err) {
      missedHeartbeatsRef.current++;
    }
  }, []);

  // PATCH-020: jitter anti-herd (0-10s)
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    missedHeartbeatsRef.current = 0;
    sendHeartbeat(); // Primeiro heartbeat imediato

    const jitter = Math.floor(Math.random() * 10000);
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL + jitter);
    console.log(`[Heartbeat] ▶️ Iniciado (intervalo: ${HEARTBEAT_INTERVAL + jitter}ms com jitter)`);
  }, [sendHeartbeat]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    console.log("[Heartbeat] ⏹️ Parado");
  }, []);

  // ============================================
  // VALIDAÇÃO DE DISPOSITIVO
  // ============================================
  const validateCurrentDevice = useCallback(async (): Promise<DeviceValidationResult | null> => {
    if (!user) return null;

    try {
      const { hash, data: fingerprintData } = await collectFingerprint();

      const { data, error } = await supabase.functions.invoke("validate-device", {
        body: {
          fingerprint: hash,
          fingerprintData,
          userId: user.id,
          email: user.email,
          action: "validate",
        },
      });

      if (error) {
        console.error("[DeviceValidation] Erro:", error);
        return null;
      }

      const result: DeviceValidationResult = {
        riskScore: data.riskScore || 0,
        action: data.action || "allow",
        requiresChallenge: data.requiresChallenge || false,
        isNewDevice: data.isNewDevice || false,
      };

      setDeviceValidation(result);
      return result;
    } catch (err) {
      console.error("[DeviceValidation] Erro:", err);
      return null;
    }
  }, [user]);

  // ============================================
  // AUTH STATE - ESTÁVEL
  // ============================================
  // Usar refs para evitar stale closures no useEffect com []
  const startHeartbeatRef = useRef(startHeartbeat);
  const stopHeartbeatRef = useRef(stopHeartbeat);

  // Manter refs atualizadas
  useEffect(() => {
    startHeartbeatRef.current = startHeartbeat;
    stopHeartbeatRef.current = stopHeartbeat;
  }, [startHeartbeat, stopHeartbeat]);

  useEffect(() => {
    console.log("[AUTH] useEffect de auth state iniciado");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("[AUTH][STATE] event:", event, {
        hasSession: Boolean(newSession),
        hasUser: Boolean(newSession?.user),
      });

      // ✅ Atualizações síncronas apenas (evita deadlocks / travas)
      setSession((prev) => {
        if (prev?.access_token === newSession?.access_token) return prev;
        return newSession;
      });

      setUser((prev) => {
        const newUser = newSession?.user ?? null;
        if (prev?.id === newUser?.id) return prev;
        return newUser;
      });

      // 🛡️ v2: Não atribuir role por email - fetchUserRole busca do banco
      if (!newSession?.user) {
        setRole(null);
        stopHeartbeatRef.current();
      }

      // ✅ Tudo que faz I/O deve rodar FORA do callback.
      // P0: Sem setTimeout/delay hacks — usamos um "tick" que dispara useEffect.
      if (newSession?.user) {
        // Role + heartbeat são iniciados em um useEffect baseado em user/session.

        // 🔥 P0 FIX v4: TOKEN_REFRESHED → Sincronizar sessão customizada
        // Quando Supabase renova o JWT automaticamente, atualizar last_activity_at
        // para evitar "sessão fantasma" que causa overlay falso
        if (event === "TOKEN_REFRESHED") {
          const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
          if (sessionToken) {
            // Atualizar last_activity_at de forma assíncrona (não bloqueia callback)
            setTimeout(async () => {
              try {
                await supabase
                  .from('active_sessions')
                  .update({ last_activity_at: new Date().toISOString() })
                  .eq('session_token', sessionToken);
                console.log("[AUTH] ✅ TOKEN_REFRESHED → active_sessions.last_activity_at sincronizado");
              } catch (err) {
                console.warn("[AUTH] ⚠️ Falha ao sincronizar sessão no TOKEN_REFRESHED:", err);
              }
            }, 0);
          }
          return;
        }

        // Pós-login/restauração: garantir sessão única + token de segurança
        // - SIGNED_IN: login explícito
        // - INITIAL_SESSION: sessão restaurada (ex: segundo device abrindo com cookie)
        // P0: evita sessões simultâneas por falta de criação do token
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          // 🔒 Anti-loop: quando o login é feito pela tela /auth,
          // quem cria a sessão única é o próprio Auth.tsx (fluxo soberano).
          // Se também criarmos aqui, podemos invalidar tokens recém-criados e gerar loop /auth ↔ app.
          const isAuthPath =
            typeof window !== "undefined" &&
            (window.location.pathname === "/auth" || window.location.pathname.startsWith("/auth/"));
          if (isAuthPath) {
            return;
          }

          const hasSecurityToken =
            typeof window !== "undefined" ? Boolean(localStorage.getItem(SESSION_TOKEN_KEY)) : false;

          // Se já temos matriz_session_token, não precisa disparar novamente
          if (hasSecurityToken) return;

          const tokenKey = newSession.access_token || `${newSession.user.id}:${new Date().toISOString()}`;

          if (processedSignInTokenRef.current !== tokenKey) {
            processedSignInTokenRef.current = tokenKey;
            postSignInPayloadRef.current = {
              userId: newSession.user.id,
              email: newSession.user.email ?? null,
            };
            setPostSignInTick((t) => t + 1);
          }
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      // ✅ P0 FIX: Evitar re-render desnecessário
      setSession((prev) => {
        if (prev?.access_token === initialSession?.access_token) {
          return prev;
        }
        return initialSession;
      });

      setUser((prev) => {
        const newUser = initialSession?.user ?? null;
        if (prev?.id === newUser?.id) {
          return prev;
        }
        return newUser;
      });

      // 🛡️ v2: Não atribuir role por email - fetchUserRole busca do banco
      if (!initialSession?.user) {
        setRole(null);
      }

      if (initialSession?.user) {
        fetchUserRole(initialSession.user.id);
        startHeartbeatRef.current();
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      stopHeartbeatRef.current();
    };
  }, []);

  // ============================================
  // ✅ Fonte da verdade do "token de sessão de segurança" no client
  // - Mantém um flag reativo para impedir redirect antes do token existir
  // ============================================
  useEffect(() => {
    if (!user) {
      setSecuritySessionReady(false);
      return;
    }

    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    setSecuritySessionReady(Boolean(token));
  }, [user?.id]);

  // ============================================
  // 🔥 DOGMA SUPREMO: LISTENER REALTIME PARA LOGOUT FORÇADO
  // Quando usuário é DELETADO, recebe broadcast e faz logout IMEDIATO
  // ============================================
  useEffect(() => {
    if (!user?.id) return;

    console.log("[AUTH][REALTIME] 📡 Inscrevendo no canal force-logout...");

    const channel = supabase
      .channel("force-logout")
      .on("broadcast", { event: "user-deleted" }, async (payload) => {
        const { userId, email, reason } = payload.payload as {
          userId: string;
          email: string;
          reason: string;
        };

        console.log("[AUTH][REALTIME] 🔥 Evento user-deleted recebido:", { userId, email });

        // Verificar se o broadcast é para ESTE usuário
        if (userId === user.id || email?.toLowerCase() === user.email?.toLowerCase()) {
          console.error("[AUTH][REALTIME] 💀 ESTE USUÁRIO FOI DELETADO! Forçando logout...");

          // 1. Limpar TUDO do localStorage
          const keysToRemove = [
            "matriz_session_token",
            "matriz_last_heartbeat",
            "matriz_device_fingerprint",
            "matriz_trusted_device",
            "sb-fyikfsasudgzsjmumdlw-auth-token",
          ];
          keysToRemove.forEach((key) => localStorage.removeItem(key));

          // 2. Limpar sessionStorage
          sessionStorage.clear();

          // 3. Parar heartbeat
          stopHeartbeatRef.current();

          // 4. Mostrar mensagem antes de fazer logout
          alert(`Sua conta foi removida do sistema.\nMotivo: ${reason || "Exclusão administrativa"}`);

          // 5. Signout e redirect
          await supabase.auth.signOut();
          window.location.replace("/auth?deleted=true");
        }
      })
      .subscribe((status) => {
        console.log("[AUTH][REALTIME] Status do canal force-logout:", status);
      });

    return () => {
      console.log("[AUTH][REALTIME] 🔌 Desconectando do canal force-logout");
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.email]);

  // ============================================
  // ✅ ÚNICO DONO DO REDIRECT GLOBAL
  // Regra: se existe sessão e está em /auth, redireciona UMA VEZ.
  // Login (/auth) não decide nada.
  // ============================================
  // ✅ P0 FIX: Redirect com dependências primitivas (evita re-render)
  // ✅ P0 FIX v2: Espera role ser carregada antes de redirecionar FUNCIONARIO
  // ✅ P0 FIX v3.1: Bloqueia redirect se password_change_pending
  useEffect(() => {
    if (isLoading) return;

    // 🎯 P0 FIX v3.1: Não interromper troca de senha obrigatória
    const isPasswordChangePending = sessionStorage.getItem("matriz_password_change_pending") === "1";
    if (isPasswordChangePending) {
      console.log("[AUTH] 🔐 Password change pendente - bloqueando redirect");
      return;
    }

    // Não interromper desafio 2FA na tela de /auth
    const is2FAPending = sessionStorage.getItem("matriz_2fa_pending") === "1";
    if (is2FAPending) return;

    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const isAuthPath = path === "/auth" || path.startsWith("/auth/");

    if (user && session && isAuthPath) {
      // ✅ BLOCO CRÍTICO: não sair de /auth sem o token de sessão de segurança.
      // Se sair cedo, o SessionGuard em outras rotas aplica fail-closed (~6s) e desloga.
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!token || !securitySessionReady) {
        console.warn("[AUTH] Aguardando token de sessão de segurança antes de redirecionar...");
        return;
      }

      const email = (user.email || "").toLowerCase();
      const ownerEmail = "moisesblank@gmail.com";

      // ✅ P0 FIX: Owner pode redirecionar sem esperar role do banco (MAS só após token pronto)
      if (email === ownerEmail) {
        console.log("[AUTH] Owner detectado - redirecionando para /gestaofc");
        window.location.replace("/gestaofc");
        return;
      }

      // ✅ P0 FIX CRÍTICO: Para outros usuários, ESPERAR role ser carregada
      // Se derivedRole ainda é null, NÃO redirecionar ainda
      if (derivedRole === null) {
        console.log("[AUTH] Aguardando role ser carregada do banco...");
        return; // Espera próximo ciclo quando role estiver disponível
      }

      // ✅ REGRA DEFINITIVA: Usa função centralizada COM role carregada
      const target = getPostLoginRedirect(derivedRole, email);
      console.log("[AUTH] ✅ Redirecionando para", target, "(role:", derivedRole, ")");
      window.location.replace(target);
    }
  }, [isLoading, user?.id, session?.access_token, derivedRole, securitySessionReady]);

  // ============================================
  // 🛡️ P0 FIX: CRIAÇÃO DE SESSÃO ÚNICA PÓS-LOGIN
  // Executa UMA VEZ após SIGNED_IN (via postSignInTick)
  // ============================================
  useEffect(() => {
    if (postSignInTick === 0) return; // Ignora montagem inicial
    if (!postSignInPayloadRef.current) return;

    // 🔒 Anti-loop: se por algum motivo disparou enquanto estamos em /auth, não criar sessão aqui.
    // O Auth.tsx é o dono do fluxo de sessão única quando o usuário está logando.
    const isAuthPath =
      typeof window !== "undefined" &&
      (window.location.pathname === "/auth" || window.location.pathname.startsWith("/auth/"));
    if (isAuthPath) {
      postSignInPayloadRef.current = null;
      return;
    }

    const { userId, email } = postSignInPayloadRef.current;

    // ✅ OWNER: Também precisa de sessão para SessionGuard funcionar
    // (Sem sessão, SessionGuard faz logout após grace period)
    const ownerEmail = "moisesblank@gmail.com";
    const isOwner = email?.toLowerCase() === ownerEmail;

    // 🔒 P0 INCIDENTE: se 2FA está pendente, NÃO criar sessão única (sessão final proibida)
    const is2FAPending = sessionStorage.getItem("matriz_2fa_pending") === "1";
    if (is2FAPending) {
      console.warn("[AUTH][SESSAO] 2FA pendente - sessão única adiada (será criada pós-2FA no /auth)");
      postSignInPayloadRef.current = null;
      return;
    }

    // 🎯 P0 FIX v3.1: se password_change está pendente, NÃO criar sessão única ainda
    const isPasswordChangePending = sessionStorage.getItem("matriz_password_change_pending") === "1";
    if (isPasswordChangePending) {
      console.warn("[AUTH][SESSAO] Password change pendente - sessão única adiada");
      postSignInPayloadRef.current = null;
      return;
    }

    // ✅ Regra: 2FA pendente = não criar sessão final ainda.
    // Fora isso, SEMPRE garantir que o token exista rapidamente, mesmo em /auth,
    // pois o redirect pode tirar o usuário de /auth antes do Auth.tsx terminar.
    // (Evita logout ~5-6s pelo SessionGuard em rotas não-/auth)
    const existingToken = typeof window !== "undefined" ? localStorage.getItem(SESSION_TOKEN_KEY) : null;

    // 🔥 P0 FIX v4: Se token existe, verificar se sessão no banco ainda é válida
    // Evita "sessão fantasma" onde token local aponta para sessão inválida/expirada
    if (existingToken) {
      console.log("[AUTH][SESSAO] Token existe - verificando validade no banco...");
      
      const validateAndProceed = async () => {
        try {
          const { data, error } = await supabase
            .from('active_sessions')
            .select('status, last_activity_at, expires_at')
            .eq('session_token', existingToken)
            .maybeSingle();
          
          if (error || !data) {
            // Token local não tem sessão correspondente - criar nova
            console.warn("[AUTH][SESSAO] ⚠️ Sessão não encontrada no banco - recriando...");
            localStorage.removeItem(SESSION_TOKEN_KEY);
            // Dispara novo tick para criar sessão
            setPostSignInTick((t) => t + 1);
            return;
          }
          
          // Verificar se sessão está ativa e não expirou
          const isExpired = new Date(data.expires_at) < new Date();
          const isRevoked = data.status !== 'active';
          
          if (isExpired || isRevoked) {
            console.warn("[AUTH][SESSAO] ⚠️ Sessão expirada/revogada - recriando...");
            localStorage.removeItem(SESSION_TOKEN_KEY);
            setPostSignInTick((t) => t + 1);
            return;
          }
          
          // ✅ Sessão válida - atualizar last_activity_at e continuar
          await supabase
            .from('active_sessions')
            .update({ last_activity_at: new Date().toISOString() })
            .eq('session_token', existingToken);
          
          console.log("[AUTH][SESSAO] ✅ Sessão existente válida - last_activity_at atualizado");
          setSecuritySessionReady(true);
          startHeartbeatRef.current();
        } catch (err) {
          console.error("[AUTH][SESSAO] Erro ao validar sessão existente:", err);
          // Em caso de erro, manter token e continuar
          setSecuritySessionReady(true);
          startHeartbeatRef.current();
        }
      };
      
      validateAndProceed();
      postSignInPayloadRef.current = null;
      return;
    }

    console.log("[AUTH][SESSAO] Criando sessão única pós-login para:", userId);

    const createSession = async () => {
      try {
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

        // 🔐 BLOCO 6: Criar sessão (useAuth - P0 FIX: usar hash do SERVIDOR)
        // CRÍTICO: SEMPRE usar o hash do servidor salvo no localStorage
        const serverDeviceHash = localStorage.getItem('matriz_device_server_hash');
        
        if (!serverDeviceHash) {
          console.warn('[AUTH][SESSAO] ⚠️ Hash do servidor não encontrado - dispositivo não registrado. Abortando criação de sessão.');
          return; // Não criar sessão sem hash válido do servidor
        }
        
        const { data, error } = await supabase.rpc("create_single_session", {
          _ip_address: null,
          _user_agent: navigator.userAgent.slice(0, 255),
          _device_type: device_type,
          _browser: browser,
          _os: os,
          _device_hash_from_server: serverDeviceHash, // 🔐 P0 FIX: Hash do SERVIDOR (com pepper)
        });

        if (error) {
          console.error("[AUTH][SESSAO] Erro ao criar sessão:", error);
          return;
        }

        if (data && data.length > 0) {
          const sessionToken = data[0].session_token;
          localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
          setSecuritySessionReady(true);
          console.log("[AUTH][SESSAO] ✅ Sessão única criada com sucesso");

          // Iniciar heartbeat
          startHeartbeatRef.current();
        }
      } catch (err) {
        console.error("[AUTH][SESSAO] Erro crítico:", err);
      }
    };

    createSession();
    postSignInPayloadRef.current = null;
  }, [postSignInTick]);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();

      if (error) {
        console.error("Error fetching role:", error);
        return;
      }

      // ✅ SEGURO: Role vem do banco, não de email hardcoded
      // O email é usado APENAS para bypass de fricção (guards/UI), nunca para autorização
      // A role real sempre vem da tabela user_roles
      const dbRole = (data?.role as AppRole) ?? null;
      setRole(dbRole);

      // Log para auditoria se for owner
      if (dbRole === "owner") {
        console.log("[AUTH] Owner role confirmed from database");
      }
    } catch (err) {
      console.error("Error fetching role:", err);
    }
  };

  // ============================================
  // 🛡️ DOGMA I + LEI VI: Login com validação
  // ============================================
  const signIn = async (
    email: string,
    password: string,
    _opts?: { turnstileToken?: string },
  ): Promise<{ error: Error | null; user?: User | null; needsChallenge?: boolean; blocked?: boolean }> => {
    // 🛡️ LOGIN DETERMINÍSTICO: termina SOMENTE no retorno do signInWithPassword
    // Nada pode bloquear o fluxo (sem validate-device pré-login, sem Turnstile)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    // ✅ DEBUG P0: sinalizar resposta (sem expor tokens)
    console.log("[AUTH][LOGIN] signInWithPassword result:", {
      hasError: Boolean(error),
      hasSession: Boolean(data?.session),
      hasUser: Boolean(data?.user),
    });

    if (!error) {
      const authUser = data?.user ?? null;

      // P0: Side-effects pós-login (sessão única, role, heartbeat, validate-device)
      // são executados EXCLUSIVAMENTE pelo listener onAuthStateChange + useEffects.
      // Isso evita duplicidade de create_single_session e invalidação acidental de tokens.
      return { error: null, user: authUser };
    }

    return { error, user: null };
  };

  const detectDeviceInfo = () => {
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
    else if (ua.includes("iOS") || ua.includes("iPhone")) os = "iOS";

    return { device_type, browser, os };
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const redirectUrl = `${window.location.origin}/`;

    // AXIOMA DE IDENTIDADE: 1 EMAIL = 1 PESSOA = 1 LOGIN
    const normalizedEmail = email.toLowerCase().trim();

    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { nome: nome.trim() },
      },
    });
    return { error };
  };

  const signInWithProvider = async (provider: Provider) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    try {
      // 🎯 CONSTITUIÇÃO v10.x: Usar fluxo customizado - REVELA se email não existe
      const { data, error } = await supabase.functions.invoke("custom-password-reset", {
        body: { action: "request", email: email.trim().toLowerCase() },
      });

      if (error) {
        console.error("[AUTH] Erro no reset customizado:", error);
        return { error: new Error("Erro ao processar solicitação. Tente novamente.") };
      }

      // 🎯 NOVO: Se a edge function retornou erro, propagar
      if (data?.error) {
        console.log("[AUTH] ❌ Email não cadastrado:", data.error);
        return { error: new Error(data.error) };
      }

      return { error: null };
    } catch (err: any) {
      console.error("[AUTH] Erro inesperado no reset:", err);
      return { error: new Error("Erro ao processar solicitação.") };
    }
  };

  // 🛡️ DOGMA I: Logout invalida sessão
  const signOut = async () => {
    stopHeartbeat();

    try {
      const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);

      // 🎯 LIMPAR TOKEN ANTES do RPC para que SessionGuard saiba que é logout manual
      // Isso evita que o Realtime listener mostre overlay de conflito
      localStorage.removeItem(SESSION_TOKEN_KEY);
      console.log("[DOGMA I] Token removido ANTES do RPC");

      // 🎯 P0 FIX v3.1: Limpar flag de password change pendente no logout
      sessionStorage.removeItem("matriz_password_change_pending");

      if (sessionToken) {
        await supabase.rpc("invalidate_session", {
          p_session_token: sessionToken,
        });
        console.log("[DOGMA I] ✅ Sessão invalidada no backend");
      }
    } catch (err) {
      console.error("[DOGMA I] Erro ao invalidar sessão:", err);
    }

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setDeviceValidation(null);
  };

  // ✅ LOG FORENSE: Role derivada vs role do banco
  useEffect(() => {
    if (user?.email && derivedRole) {
      console.log("[AUTH] Role final:", {
        email: user.email,
        derivedRole,
        dbRole: role,
        isOwner: role === 'owner',
      });
    }
  }, [user?.email, derivedRole, role]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role: derivedRole, // ✅ REGRA MATRIZ: Sempre usar role derivada (owner por email é síncrono)
        isLoading,
        deviceValidation,
        signIn,
        signUp,
        signInWithProvider,
        signOut,
        resetPassword,
        validateCurrentDevice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
