// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v2.0
// Autenticação com DOGMA I: Sessão Única
// ============================================

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { User, Session, Provider } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "owner" | "admin" | "employee" | "coordenacao" | "suporte" | "monitoria" | "afiliado" | "marketing" | "contabilidade";

const OWNER_EMAIL = "moisesblank@gmail.com";
const SESSION_TOKEN_KEY = 'matriz_session_token';
interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signInWithProvider: (provider: Provider) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        const email = (session?.user?.email || "").toLowerCase();
        if (email === OWNER_EMAIL) {
          // Owner sempre reconhecido imediatamente
          setRole("owner");
        } else if (!session?.user) {
          setRole(null);
        }

        // Defer role fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
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
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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

      // Owner nunca perde o role por falha/ausência de registro em user_roles
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

  // 🛡️ DOGMA I: Login cria sessão única e invalida anteriores
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    
    if (!error) {
      // Criar sessão única após login bem-sucedido
      setTimeout(async () => {
        try {
          const deviceInfo = detectDeviceInfo();
          const { data } = await supabase.rpc('create_single_session', {
            _ip_address: null,
            _user_agent: navigator.userAgent.slice(0, 255),
            _device_type: deviceInfo.device_type,
            _browser: deviceInfo.browser,
            _os: deviceInfo.os,
          });
          
          if (data && data.length > 0) {
            localStorage.setItem(SESSION_TOKEN_KEY, data[0].session_token);
            console.log('[DOGMA I] ✅ Sessão única criada, anteriores invalidadas');
          }
        } catch (err) {
          console.error('[DOGMA I] Erro ao criar sessão:', err);
        }
      }, 100);
    }
    
    return { error };
  };
  
  // Helper para detectar dispositivo
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
    // Invalidar sessão no banco antes de deslogar
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
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      role, 
      isLoading, 
      signIn, 
      signUp, 
      signInWithProvider,
      signOut,
      resetPassword 
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
