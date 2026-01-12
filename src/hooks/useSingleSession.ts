// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v2.0
// DOGMA I: SACRAMENTO DA SESSÃO ÚNICA
// Um usuário, uma sessão. Sem exceções.
// ============================================

import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

const SESSION_TOKEN_KEY = 'matriz_session_token';
const SESSION_CHECK_INTERVAL = 30000; // 30 segundos

interface SessionInfo {
  session_token: string;
  auth_epoch_at_login?: number;
}

interface DeviceInfo {
  device_type: string;
  browser: string;
  os: string;
}

// Detectar informações do dispositivo
function detectDeviceInfo(): DeviceInfo {
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
}

export function useSingleSession() {
  const { user, signOut } = useAuth();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isValidatingRef = useRef(false);

  // Criar nova sessão única (invalida todas as anteriores)
  const createSingleSession = useCallback(async (): Promise<SessionInfo | null> => {
    if (!user) return null;
    
    try {
      const deviceInfo = detectDeviceInfo();
      
      // 🔐 P0 FIX: SEMPRE usar hash do servidor (com pepper)
      const serverDeviceHash = localStorage.getItem('matriz_device_server_hash');
      if (!serverDeviceHash) {
        console.error('[SESSÃO ÚNICA] ❌ P0 VIOLATION: Sem hash do servidor!');
        return null;
      }
      
      const { data, error } = await supabase.rpc('create_single_session', {
        _ip_address: null,
        _user_agent: navigator.userAgent.slice(0, 255),
        _device_type: deviceInfo.device_type,
        _browser: deviceInfo.browser,
        _os: deviceInfo.os,
        _device_hash_from_server: serverDeviceHash, // 🔐 P0 FIX: Hash do SERVIDOR
      });
      
      if (error) {
        console.error('[SESSÃO ÚNICA] Erro ao criar sessão:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        const sessionInfo: SessionInfo = {
          session_token: data[0].session_token,
          auth_epoch_at_login: data[0].auth_epoch_at_login,
        };
        
        // Armazenar token localmente
        localStorage.setItem(SESSION_TOKEN_KEY, sessionInfo.session_token);
        
        console.log('[SESSÃO ÚNICA] ✅ Sessão criada, anteriores invalidadas');
        return sessionInfo;
      }
      
      return null;
    } catch (err) {
      console.error('[SESSÃO ÚNICA] Erro crítico:', err);
      return null;
    }
  }, [user]);

  // Validar sessão atual
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!user || isValidatingRef.current) return true;
    
    isValidatingRef.current = true;
    
    try {
      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      
      if (!storedToken) {
        console.warn('[SESSÃO ÚNICA] ⚠️ Token não encontrado localmente');
        isValidatingRef.current = false;
        return true; // Primeira vez, sessão ainda não criada
      }
      
      const { data, error } = await supabase.rpc('validate_session_token', {
        p_session_token: storedToken,
      });
      
      if (error) {
        console.error('[SESSÃO ÚNICA] Erro na validação:', error);
        isValidatingRef.current = false;
        return false;
      }
      
      if (!data) {
        // Sessão inválida - provavelmente login em outro dispositivo
        console.warn('[SESSÃO ÚNICA] 🔴 Sessão invalidada - login detectado em outro dispositivo');
        
        toast.error('Sessão encerrada', {
          description: 'Você fez login em outro dispositivo. Esta sessão foi encerrada.',
          duration: 5000,
        });
        
        // Limpar token local e fazer logout
        localStorage.removeItem(SESSION_TOKEN_KEY);
        await signOut();
        
        isValidatingRef.current = false;
        return false;
      }
      
      isValidatingRef.current = false;
      return true;
    } catch (err) {
      console.error('[SESSÃO ÚNICA] Erro na validação:', err);
      isValidatingRef.current = false;
      return false;
    }
  }, [user, signOut]);

  // Invalidar sessão (logout)
  const invalidateSession = useCallback(async () => {
    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    
    try {
      await supabase.rpc('invalidate_session', {
        p_session_token: storedToken,
      });
      
      localStorage.removeItem(SESSION_TOKEN_KEY);
      console.log('[SESSÃO ÚNICA] ✅ Sessão invalidada');
    } catch (err) {
      console.error('[SESSÃO ÚNICA] Erro ao invalidar:', err);
    }
  }, []);

  // Iniciar verificação periódica de sessão
  useEffect(() => {
    if (!user) {
      // Limpar intervalo quando usuário desloga
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // ✅ P0 FIX: NÃO criar sessão automaticamente aqui
    // A sessão é criada EXCLUSIVAMENTE no login (useAuth.tsx onAuthStateChange SIGNED_IN)
    // Criar aqui causava invalidação da sessão e loop de auth
    // Se não tem token, aguarda o fluxo de login criar
    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!storedToken) {
      console.log('[SESSÃO ÚNICA] Token não encontrado - aguardando login criar sessão');
      // NÃO criar sessão aqui - isso será feito pelo useAuth após SIGNED_IN
    }

    // Verificação periódica (DOGMA I) + PATCH-021: jitter anti-herd (0-30s)
    const jitter = Math.floor(Math.random() * 30000);
    checkIntervalRef.current = setInterval(() => {
      validateSession();
    }, SESSION_CHECK_INTERVAL + jitter);

    // Verificar ao voltar para a aba
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateSession();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, createSingleSession, validateSession]);

  // Cleanup no unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Não invalidar no fechamento normal da aba
      // A sessão permanece válida para quando voltar
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    createSingleSession,
    validateSession,
    invalidateSession,
    getSessionToken: () => localStorage.getItem(SESSION_TOKEN_KEY),
  };
}
