// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v2.0
// COMPONENTE DE PROTEÇÃO DE SESSÃO ÚNICA
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SESSION_TOKEN_KEY = 'matriz_session_token';
const SESSION_CHECK_INTERVAL = 30000; // 30 segundos

interface SessionGuardProps {
  children: React.ReactNode;
}

export function SessionGuard({ children }: SessionGuardProps) {
  const { user, signOut } = useAuth();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isValidatingRef = useRef(false);

  // Validar sessão atual
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!user || isValidatingRef.current) return true;
    
    isValidatingRef.current = true;
    
    try {
      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      
      if (!storedToken) {
        isValidatingRef.current = false;
        return true; // Primeira vez, sessão ainda não criada
      }
      
      const { data, error } = await supabase.rpc('validate_session_token', {
        p_session_token: storedToken,
      });
      
      if (error) {
        console.error('[SESSÃO] Erro na validação:', error);
        isValidatingRef.current = false;
        return true; // Não deslogar por erro de rede
      }
      
      if (data === false) {
        // Sessão inválida - provavelmente login em outro dispositivo
        console.warn('[DOGMA I] 🔴 Sessão invalidada - login detectado em outro dispositivo');
        
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
      console.error('[SESSÃO] Erro na validação:', err);
      isValidatingRef.current = false;
      return true; // Não deslogar por erro
    }
  }, [user, signOut]);

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

    // Verificação periódica (DOGMA I)
    checkIntervalRef.current = setInterval(() => {
      validateSession();
    }, SESSION_CHECK_INTERVAL);

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
  }, [user, validateSession]);

  return <>{children}</>;
}

export default SessionGuard;
