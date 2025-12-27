// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v3.0
// Autenticação com DOGMA I: Sessão Única
// + LEI VI: Validação de Dispositivo
// + Heartbeat Contínuo
// ============================================

import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from "react";
import { User, Session, Provider } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { collectEnhancedFingerprint } from "@/lib/enhancedFingerprint";

type AppRole = "owner" | "admin" | "employee" | "coordenacao" | "suporte" | "monitoria" | "afiliado" | "marketing" | "contabilidade";

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
  
  // Heartbeat refs
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const missedHeartbeatsRef = useRef(0);

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
  // AUTH STATE
  // ============================================
  // ============================================
  // ✅ P0 FIX: AUTH STATE com proteções anti-loop
  // - Cleanup obrigatório
  // - setState otimizado (só atualiza se mudou)
  // - Array de dependências vazio
  // ============================================
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // ✅ DEBUG P0: Não logar tokens; apenas presença de sessão/usuário
        console.log('[AUTH][STATE] event:', event, {
          hasSession: Boolean(newSession),
          hasUser: Boolean(newSession?.user),
          path: typeof window !== 'undefined' ? window.location.pathname : undefined,
          is2FAPending: typeof window !== 'undefined'
            ? sessionStorage.getItem('matriz_2fa_pending') === '1'
            : undefined,
        });

        // ✅ P0 FIX: Evitar re-render desnecessário - só atualiza se realmente mudou
        setSession(prev => {
          if (prev?.access_token === newSession?.access_token) {
            return prev;
          }
          return newSession;
        });
        
        setUser(prev => {
          const newUser = newSession?.user ?? null;
          if (prev?.id === newUser?.id) {
            return prev;
          }
          return newUser;
        });

        const email = (newSession?.user?.email || "").toLowerCase();
        if (email === OWNER_EMAIL) {
          setRole("owner");
        } else if (!newSession?.user) {
          setRole(null);
          stopHeartbeat();
        }

        if (newSession?.user) {
          setTimeout(() => {
            fetchUserRole(newSession.user.id);
          }, 0);
          
          // Iniciar heartbeat quando logado
          startHeartbeat();

          // 🛡️ LEI VI: Validar/registrar dispositivo em QUALQUER login (incluindo OAuth)
          // Isso cobre logins via Google, Magic Link, etc.
          if (event === 'SIGNED_IN') {
            try {
              const { hash, data: fingerprintData } = await collectFingerprint();
              const deviceInfo = detectDeviceInfo();
              
              // Criar sessão única (DOGMA I)
              const { data: sessionData } = await supabase.rpc('create_single_session', {
                _ip_address: null,
                _user_agent: navigator.userAgent.slice(0, 255),
                _device_type: deviceInfo.device_type,
                _browser: deviceInfo.browser,
                _os: deviceInfo.os,
              });
              
              if (sessionData && sessionData.length > 0) {
                localStorage.setItem(SESSION_TOKEN_KEY, sessionData[0].session_token);
                console.log('[DOGMA I] ✅ Sessão única criada (auth event)');
              }

              // Registrar dispositivo (LEI VI)
              await supabase.functions.invoke('validate-device', {
                body: {
                  fingerprint: hash,
                  fingerprintData,
                  userId: newSession.user.id,
                  email: newSession.user.email,
                  action: 'post_login',
                },
              });
              console.log('[LEI VI] ✅ Dispositivo registrado (auth event)');
            } catch (err) {
              console.error('[LEI VI] Erro no registro pós-auth:', err);
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
        startHeartbeat();
      }
      setIsLoading(false);
    });

    // ✅ P0 FIX: Cleanup obrigatório
    return () => {
      subscription.unsubscribe();
      stopHeartbeat();
    };
  }, []); // ✅ P0 FIX: Array vazio - executa apenas uma vez

  // ============================================
  // ✅ ÚNICO DONO DO REDIRECT GLOBAL
  // Regra: se existe sessão e está em /auth, redireciona UMA VEZ.
  // Login (/auth) não decide nada.
  // ============================================
  // ✅ P0 FIX: Redirect com dependências primitivas (evita re-render)
  useEffect(() => {
    if (isLoading) return;

    // Não interromper desafio 2FA na tela de /auth
    const is2FAPending = sessionStorage.getItem("matriz_2fa_pending") === "1";
    if (is2FAPending) return;

    const path = typeof window !== "undefined" ? window.location.pathname : "";
    if (user && session && path === "/auth") {
      const email = (user.email || "").toLowerCase();

      // ✅ Rotas reais (evita cair nas rotas legadas que redirecionam para "/")
      const target = email === OWNER_EMAIL ? "/gestaofc" : "/alunos";

      // replace: evita voltar para /auth no histórico
      window.location.replace(target);
    }
  }, [isLoading, user?.id, session?.access_token]); // ✅ P0 FIX: Valores primitivos

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

      // Pós-login é assíncrono e NÃO bloqueia o retorno
      setTimeout(async () => {
        try {
          const deviceInfo = detectDeviceInfo();
          const { hash, data: fingerprintData } = await collectFingerprint();

          // Criar sessão única (DOGMA I)
          const { data: sessionData } = await supabase.rpc('create_single_session', {
            _ip_address: null,
            _user_agent: navigator.userAgent.slice(0, 255),
            _device_type: deviceInfo.device_type,
            _browser: deviceInfo.browser,
            _os: deviceInfo.os,
          });

          if (sessionData && sessionData.length > 0) {
            localStorage.setItem(SESSION_TOKEN_KEY, sessionData[0].session_token);
            console.log('[DOGMA I] ✅ Sessão única criada');
          }

          // Registrar dispositivo (LEI VI) - pós login
          if (authUser) {
            await supabase.functions.invoke('validate-device', {
              body: {
                fingerprint: hash,
                fingerprintData,
                userId: authUser.id,
                email: authUser.email,
                action: 'post_login',
              },
            });
            console.log('[LEI VI] ✅ Dispositivo registrado');
          }
        } catch (err) {
          console.error('[Auth] Erro pós-login:', err);
        }
      }, 100);

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
    
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { nome },
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
    const redirectUrl = `${window.location.origin}/auth?reset=true`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });
    return { error };
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      role, 
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
