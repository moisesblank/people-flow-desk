// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v3.0
// Autenticação com DOGMA I: Sessão Única
// + LEI VI: Validação de Dispositivo
// + Heartbeat Contínuo
// ============================================

import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from "react";
import { User, Session, Provider } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
  signIn: (email: string, password: string) => Promise<{ error: Error | null; needsChallenge?: boolean; blocked?: boolean }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signInWithProvider: (provider: Provider) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  validateCurrentDevice: () => Promise<DeviceValidationResult | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// HELPER: Coletar fingerprint simplificado
// ============================================
async function collectFingerprint(): Promise<{ hash: string; data: Record<string, unknown> }> {
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
  
  // Generate hash
  const hashSource = JSON.stringify(data);
  const buffer = new TextEncoder().encode(hashSource);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash, data };
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

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    missedHeartbeatsRef.current = 0;
    sendHeartbeat(); // Primeiro heartbeat imediato
    
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    console.log('[Heartbeat] ▶️ Iniciado');
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
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        const email = (session?.user?.email || "").toLowerCase();
        if (email === OWNER_EMAIL) {
          setRole("owner");
        } else if (!session?.user) {
          setRole(null);
          stopHeartbeat();
        }

        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
          
          // Iniciar heartbeat quando logado
          startHeartbeat();
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      const email = (session?.user?.email || "").toLowerCase();
      if (email === OWNER_EMAIL) {
        setRole("owner");
      } else if (!session?.user) {
        setRole(null);
      }

      if (session?.user) {
        fetchUserRole(session.user.id);
        startHeartbeat();
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      stopHeartbeat();
    };
  }, [startHeartbeat, stopHeartbeat]);

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

      const email = (supabase.auth.getUser ? (await supabase.auth.getUser()).data.user?.email : undefined) || undefined;
      const isOwnerEmail = (email || "").toLowerCase() === OWNER_EMAIL;
      if (isOwnerEmail) {
        setRole("owner");
        return;
      }

      setRole((data?.role as AppRole) ?? null);
    } catch (err) {
      console.error("Error fetching role:", err);
    }
  };

  // ============================================
  // 🛡️ DOGMA I + LEI VI: Login com validação
  // ============================================
  const signIn = async (email: string, password: string): Promise<{ error: Error | null; needsChallenge?: boolean; blocked?: boolean }> => {
    // 1. Validar dispositivo ANTES do login
    try {
      const { hash, data: fingerprintData } = await collectFingerprint();
      
      const { data: validationData } = await supabase.functions.invoke('validate-device', {
        body: {
          fingerprint: hash,
          fingerprintData,
          email: email.trim(),
          action: 'pre_login',
        },
      });

      if (validationData) {
        const validation: DeviceValidationResult = {
          riskScore: validationData.riskScore || 0,
          action: validationData.action || 'allow',
          requiresChallenge: validationData.requiresChallenge || false,
          isNewDevice: validationData.isNewDevice || true,
        };
        
        setDeviceValidation(validation);

        // Bloquear se risk muito alto
        if (validation.action === 'block') {
          console.warn('[LEI VI] ❌ Dispositivo bloqueado, risk score:', validation.riskScore);
          return { 
            error: new Error('Acesso bloqueado por motivos de segurança. Entre em contato com o suporte.'), 
            blocked: true 
          };
        }

        // Requerer desafio adicional
        if (validation.requiresChallenge) {
          console.warn('[LEI VI] ⚠️ Challenge necessário, risk score:', validation.riskScore);
          return { error: null, needsChallenge: true };
        }
      }
    } catch (validationError) {
      // Se falhar a validação, continuar (não bloquear por erro)
      console.error('[LEI VI] Erro na validação pré-login:', validationError);
    }

    // 2. Fazer login no Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    
    if (!error) {
      // 3. Criar sessão única e registrar dispositivo
      setTimeout(async () => {
        try {
          const deviceInfo = detectDeviceInfo();
          const { hash, data: fingerprintData } = await collectFingerprint();
          
          // Criar sessão única (DOGMA I)
          const { data } = await supabase.rpc('create_single_session', {
            _ip_address: null,
            _user_agent: navigator.userAgent.slice(0, 255),
            _device_type: deviceInfo.device_type,
            _browser: deviceInfo.browser,
            _os: deviceInfo.os,
          });
          
          if (data && data.length > 0) {
            localStorage.setItem(SESSION_TOKEN_KEY, data[0].session_token);
            console.log('[DOGMA I] ✅ Sessão única criada');
          }

          // Registrar dispositivo (LEI VI)
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.functions.invoke('validate-device', {
              body: {
                fingerprint: hash,
                fingerprintData,
                userId: user.id,
                email: user.email,
                action: 'post_login',
              },
            });
            console.log('[LEI VI] ✅ Dispositivo registrado');
          }
        } catch (err) {
          console.error('[Auth] Erro pós-login:', err);
        }
      }, 100);
    }
    
    return { error };
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
