// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v3.0
// Autenticação com DOGMA I: Sessão Única
// + LEI VI: Validação de Dispositivo
// + Heartbeat Contínuo
// ============================================

import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef, useMemo } from "react";
import { User, Session, Provider } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { collectEnhancedFingerprint } from "@/lib/enhancedFingerprint";
import { getPostLoginRedirect, type AppRole } from "@/core/urlAccessControl";

const OWNER_EMAIL = "moisesblank@gmail.com";
const SESSION_TOKEN_KEY = 'matriz_session_token';
const HEARTBEAT_INTERVAL = 60_000; // 1 minuto
const LAST_HEARTBEAT_KEY = 'matriz_last_heartbeat';

interface DeviceValidationResult {
  riskScore: number;
  action: 'allow' | 'monitor' | 'challenge' | 'block';
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
    opts?: { turnstileToken?: string }
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
    console.warn('[Auth] Fingerprint reforçado falhou, usando básico:', err);
    const data: Record<string, unknown> = {
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory || null,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      deviceType: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) 
        ? (/iPad|Tablet/i.test(navigator.userAgent) ? 'tablet' : 'mobile')
        : 'desktop',
      browser: navigator.userAgent.includes('Firefox') ? 'Firefox'
        : navigator.userAgent.includes('Edg') ? 'Edge'
        : navigator.userAgent.includes('Chrome') ? 'Chrome'
        : navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown',
      os: navigator.userAgent.includes('Windows') ? 'Windows'
        : navigator.userAgent.includes('Mac') ? 'macOS'
        : navigator.userAgent.includes('Linux') ? 'Linux'
        : navigator.userAgent.includes('Android') ? 'Android'
        : navigator.userAgent.includes('iPhone') ? 'iOS' : 'Unknown',
    };
    
    const hashSource = JSON.stringify(data);
    const buffer = new TextEncoder().encode(hashSource);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return { hash, data };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceValidation, setDeviceValidation] = useState<DeviceValidationResult | null>(null);
  
  // ✅ REGRA MATRIZ: Role derivada SÍNCRONAMENTE do email (sem esperar banco)
  // Garante que OWNER_EMAIL SEMPRE resulta em role="owner" IMEDIATAMENTE
  const derivedRole = useMemo((): AppRole | null => {
    if (!user?.email) return role;
    const email = user.email.toLowerCase();
    if (email === OWNER_EMAIL) return "owner";
    return role; // Para outros, usa a role do banco
  }, [user?.email, role]);
  
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
        .from('active_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('session_token', sessionToken)
        .eq('status', 'active');

      if (error) {
        missedHeartbeatsRef.current++;
        console.warn('[Heartbeat] Erro:', error.message);
        
        if (missedHeartbeatsRef.current >= 3) {
          // Sessão possivelmente revogada
          console.warn('[Heartbeat] Sessão expirada após 3 falhas');
          localStorage.removeItem(SESSION_TOKEN_KEY);
          await supabase.auth.signOut();
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
    console.log('[Heartbeat] ⏹️ Parado');
  }, []);

  // ============================================
  // VALIDAÇÃO DE DISPOSITIVO
  // ============================================
  const validateCurrentDevice = useCallback(async (): Promise<DeviceValidationResult | null> => {
    if (!user) return null;
    
    try {
      const { hash, data: fingerprintData } = await collectFingerprint();
      
      const { data, error } = await supabase.functions.invoke('validate-device', {
        body: {
          fingerprint: hash,
          fingerprintData,
          userId: user.id,
          email: user.email,
          action: 'validate',
        },
      });

      if (error) {
        console.error('[DeviceValidation] Erro:', error);
        return null;
      }

      const result: DeviceValidationResult = {
        riskScore: data.riskScore || 0,
        action: data.action || 'allow',
        requiresChallenge: data.requiresChallenge || false,
        isNewDevice: data.isNewDevice || false,
      };

      setDeviceValidation(result);
      return result;
    } catch (err) {
      console.error('[DeviceValidation] Erro:', err);
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
    console.log('[AUTH] useEffect de auth state iniciado');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('[AUTH][STATE] event:', event, {
          hasSession: Boolean(newSession),
          hasUser: Boolean(newSession?.user),
        });

        // ✅ Atualizações síncronas apenas (evita deadlocks / travas)
        setSession(prev => {
          if (prev?.access_token === newSession?.access_token) return prev;
          return newSession;
        });

        setUser(prev => {
          const newUser = newSession?.user ?? null;
          if (prev?.id === newUser?.id) return prev;
          return newUser;
        });

        const email = (newSession?.user?.email || "").toLowerCase();
        if (email === OWNER_EMAIL) {
          setRole("owner");
        } else if (!newSession?.user) {
          setRole(null);
          stopHeartbeatRef.current();
        }

        // ✅ Tudo que faz I/O deve rodar FORA do callback.
        // P0: Sem setTimeout/delay hacks — usamos um "tick" que dispara useEffect.
        if (newSession?.user) {
          // Role + heartbeat são iniciados em um useEffect baseado em user/session.

          // Pós-login (SIGNED_IN): disparar criação da sessão única + validate-device UMA ÚNICA VEZ
          if (event === 'SIGNED_IN') {
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

      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      // ✅ P0 FIX: Evitar re-render desnecessário
      setSession(prev => {
        if (prev?.access_token === initialSession?.access_token) {
          return prev;
        }
        return initialSession;
      });

      setUser(prev => {
        const newUser = initialSession?.user ?? null;
        if (prev?.id === newUser?.id) {
          return prev;
        }
        return newUser;
      });

      const email = (initialSession?.user?.email || "").toLowerCase();
      if (email === OWNER_EMAIL) {
        setRole("owner");
      } else if (!initialSession?.user) {
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
  // ✅ ÚNICO DONO DO REDIRECT GLOBAL
  // Regra: se existe sessão e está em /auth, redireciona UMA VEZ.
  // Login (/auth) não decide nada.
  // ============================================
  // ✅ P0 FIX: Redirect com dependências primitivas (evita re-render)
  // ✅ P0 FIX v2: Espera role ser carregada antes de redirecionar FUNCIONARIO
  useEffect(() => {
    if (isLoading) return;

    // Não interromper desafio 2FA na tela de /auth
    const is2FAPending = sessionStorage.getItem("matriz_2fa_pending") === "1";
    if (is2FAPending) return;

    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const isAuthPath = path === "/auth" || path.startsWith("/auth/");

    if (user && session && isAuthPath) {
      const email = (user.email || "").toLowerCase();
      const ownerEmail = "moisesblank@gmail.com";
      
      // ✅ P0 FIX: Owner pode redirecionar imediatamente (sem esperar role do banco)
      if (email === ownerEmail) {
        console.log('[AUTH] Owner detectado - redirecionando para /gestaofc');
        window.location.replace("/gestaofc");
        return;
      }
      
      // ✅ P0 FIX CRÍTICO: Para outros usuários, ESPERAR role ser carregada
      // Se derivedRole ainda é null, NÃO redirecionar ainda
      if (derivedRole === null) {
        console.log('[AUTH] Aguardando role ser carregada do banco...');
        return; // Espera próximo ciclo quando role estiver disponível
      }

      // ✅ REGRA DEFINITIVA: Usa função centralizada COM role carregada
      const target = getPostLoginRedirect(derivedRole, email);
      console.log('[AUTH] Redirecionando para', target, '(role:', derivedRole, ')');
      window.location.replace(target);
    }
  }, [isLoading, user?.id, session?.access_token, derivedRole]); // ✅ Inclui role para recálculo

  // ============================================
  // 🛡️ P0 FIX: CRIAÇÃO DE SESSÃO ÚNICA PÓS-LOGIN
  // Executa UMA VEZ após SIGNED_IN (via postSignInTick)
  // ============================================
  useEffect(() => {
    if (postSignInTick === 0) return; // Ignora montagem inicial
    if (!postSignInPayloadRef.current) return;

    const { userId, email } = postSignInPayloadRef.current;

    // ✅ OWNER BYPASS: não criar sessão única para owner (LEI DE IMUNIDADE)
    const ownerEmail = "moisesblank@gmail.com";
    if (email?.toLowerCase() === ownerEmail) {
      console.log('[AUTH][SESSAO] Owner bypass - não cria sessão única');
      postSignInPayloadRef.current = null;
      startHeartbeatRef.current();
      return;
    }

    // 🔒 P0 INCIDENTE: se 2FA está pendente, NÃO criar sessão única (sessão final proibida)
    const is2FAPending = sessionStorage.getItem("matriz_2fa_pending") === "1";
    if (is2FAPending) {
      console.warn('[AUTH][SESSAO] 2FA pendente - sessão única adiada (será criada pós-2FA no /auth)');
      postSignInPayloadRef.current = null;
      return;
    }

    console.log('[AUTH][SESSAO] Criando sessão única pós-login para:', userId);

    const createSession = async () => {
      try {
        const ua = navigator.userAgent;
        let device_type = 'desktop';
        if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
          device_type = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
        }

        let browser = 'unknown';
        if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Edg')) browser = 'Edge';
        else if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Safari')) browser = 'Safari';

        let os = 'unknown';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone')) os = 'iOS';

        const { data, error } = await supabase.rpc('create_single_session', {
          _ip_address: null,
          _user_agent: navigator.userAgent.slice(0, 255),
          _device_type: device_type,
          _browser: browser,
          _os: os,
        });

        if (error) {
          console.error('[AUTH][SESSAO] Erro ao criar sessão:', error);
          return;
        }

        if (data && data.length > 0) {
          const sessionToken = data[0].session_token;
          localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
          console.log('[AUTH][SESSAO] ✅ Sessão única criada com sucesso');

          // Iniciar heartbeat
          startHeartbeatRef.current();
        }
      } catch (err) {
        console.error('[AUTH][SESSAO] Erro crítico:', err);
      }
    };

    createSession();
    postSignInPayloadRef.current = null;
  }, [postSignInTick]);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

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
      if (dbRole === 'owner') {
        console.log('[AUTH] Owner role confirmed from database');
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
    _opts?: { turnstileToken?: string }
  ): Promise<{ error: Error | null; user?: User | null; needsChallenge?: boolean; blocked?: boolean }> => {
    // 🛡️ LOGIN DETERMINÍSTICO: termina SOMENTE no retorno do signInWithPassword
    // Nada pode bloquear o fluxo (sem validate-device pré-login, sem Turnstile)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    // ✅ DEBUG P0: sinalizar resposta (sem expor tokens)
    console.log('[AUTH][LOGIN] signInWithPassword result:', {
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
    
    let device_type = 'desktop';
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
      device_type = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
    }
    
    let browser = 'unknown';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    
    let os = 'unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';
    
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
      // 🎯 P0 FIX: Usar fluxo customizado com email bonito
      const { data, error } = await supabase.functions.invoke("custom-password-reset", {
        body: { action: "request", email: email.trim().toLowerCase() },
      });

      if (error) {
        console.error("[AUTH] Erro no reset customizado:", error);
        return { error: new Error("Erro ao processar solicitação. Tente novamente.") };
      }

      // Sempre retorna sucesso (segurança - não revelar se email existe)
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
      if (sessionToken) {
        await supabase.rpc('invalidate_session', {
          p_session_token: sessionToken,
        });
        localStorage.removeItem(SESSION_TOKEN_KEY);
        console.log('[DOGMA I] ✅ Sessão invalidada');
      }
    } catch (err) {
      console.error('[DOGMA I] Erro ao invalidar sessão:', err);
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
      console.log('[AUTH] Role final:', { 
        email: user.email, 
        derivedRole, 
        dbRole: role,
        isOwnerByEmail: user.email.toLowerCase() === OWNER_EMAIL 
      });
    }
  }, [user?.email, derivedRole, role]);

  return (
    <AuthContext.Provider value={{ 
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
    }}>
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
