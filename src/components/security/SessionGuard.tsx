// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v2.0
// COMPONENTE DE PROTEÇÃO DE SESSÃO ÚNICA
// + NUCLEAR LOCKDOWN INTEGRATION
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SESSION_TOKEN_KEY = 'matriz_session_token';
// REMOVIDO: Validação periódica - agora usa apenas broadcast Realtime quando admin exclui

interface SessionGuardProps {
  children: React.ReactNode;
}

export function SessionGuard({ children }: SessionGuardProps) {
  const { user, signOut } = useAuth();
  const isValidatingRef = useRef(false);

  /**
   * Limpa TUDO e força logout (BLOCO 3: frontend_regras)
   */
  const forceLogoutWithCleanup = useCallback(async (reason: string) => {
    console.error(`[SessionGuard] 🔴 Forçando logout: ${reason}`);

    // Limpar TUDO
    const keysToRemove = [
      'matriz_session_token',
      'matriz_last_heartbeat',
      'matriz_device_fingerprint',
      'matriz_trusted_device',
      'mfa_trust_cache',
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();

    // Toast informativo
    toast.error('Sessão encerrada', {
      description: reason,
      duration: 5000,
    });

    await signOut();
  }, [signOut]);

  /**
   * Validar sessão usando a nova função que verifica EPOCH
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!user || isValidatingRef.current) return true;
    
    isValidatingRef.current = true;
    
    try {
      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      
      if (!storedToken) {
        isValidatingRef.current = false;
        return true; // Primeira vez, sessão ainda não criada
      }
      
      // 🛡️ BLOCO 2: Usar nova função que valida EPOCH
      const { data, error } = await supabase.rpc('validate_session_epoch', {
        p_session_token: storedToken,
      });
      
      if (error) {
        console.error('[SessionGuard] Erro na validação:', error);
        isValidatingRef.current = false;
        return true; // Não deslogar por erro de rede
      }
      
      const result = data?.[0];
      
      if (!result?.is_valid) {
        const reason = result?.reason || 'SESSION_INVALID';
        
        // 🛡️ BLOCO 2: Mensagens específicas para cada tipo de erro
        let message = 'Sessão encerrada por motivo desconhecido.';
        
        switch (reason) {
          case 'AUTH_DISABLED':
            message = 'Sistema em manutenção. Por favor, aguarde.';
            break;
          case 'AUTH_EPOCH_REVOKED':
            message = 'Sua sessão foi invalidada por medida de segurança. Faça login novamente.';
            break;
          case 'SESSION_NOT_FOUND':
            message = 'Sessão não encontrada. Faça login novamente.';
            break;
          default:
            message = 'Sessão inválida. Faça login novamente.';
        }
        
        console.warn(`[SessionGuard] 🔴 ${reason}: ${message}`);
        
        await forceLogoutWithCleanup(message);
        
        isValidatingRef.current = false;
        return false;
      }
      
      isValidatingRef.current = false;
      return true;
    } catch (err) {
      console.error('[SessionGuard] Erro na validação:', err);
      isValidatingRef.current = false;
      return true; // Não deslogar por erro
    }
  }, [user, forceLogoutWithCleanup]);

  // REMOVIDO: Validação periódica
  // Agora usa APENAS broadcast Realtime quando admin exclui usuário
  // Isso é mais eficiente: 0 queries periódicas, logout instantâneo via broadcast

  // 🛡️ BLOCO 3 + BLOCO 5: Listener para broadcasts de lockdown/epoch/device-revoked
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('session-guard-lockdown')
      .on('broadcast', { event: 'auth-lockdown' }, async () => {
        console.error('[SessionGuard] 📡 LOCKDOWN BROADCAST recebido!');
        await forceLogoutWithCleanup('Sistema em manutenção de emergência.');
      })
      .on('broadcast', { event: 'epoch-increment' }, async () => {
        console.error('[SessionGuard] 📡 EPOCH INCREMENT recebido!');
        await validateSession();
      })
      .subscribe();

    // 🔐 BLOCO 5: Listener para dispositivo revogado (logout imediato)
    const userChannel = supabase.channel(`user:${user.id}`)
      .on('broadcast', { event: 'device-revoked' }, async (payload) => {
        console.error('[SessionGuard] 📡 DEVICE REVOKED recebido!', payload);
        await forceLogoutWithCleanup('Este dispositivo foi removido. Faça login novamente.');
      })
      .on('broadcast', { event: 'user-deleted' }, async () => {
        console.error('[SessionGuard] 📡 USER DELETED recebido!');
        await forceLogoutWithCleanup('Sua conta foi removida.');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(userChannel);
    };
  }, [user, forceLogoutWithCleanup, validateSession]);

  return <>{children}</>;
}

export default SessionGuard;
