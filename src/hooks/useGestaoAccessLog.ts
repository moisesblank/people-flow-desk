// ============================================
// 🛡️ HOOK: useGestaoAccessLog (OTIMIZADO)
// Log automático de acessos a /gestaofc
// PATCH-CUSTO: Reduzido de 3 tabelas para 1 única
// Escritas reduzidas em ~67%
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface GestaoAccessLogOptions {
  enabled?: boolean;
  logPageViews?: boolean;
  logActions?: boolean;
}

/**
 * @deprecated P1-2: OWNER_EMAIL não é mais usado.
 * Verificação primária é via role === 'owner'.
 */
// const OWNER_EMAIL = 'moisesblank@gmail.com';

// PATCH-CUSTO: Debounce para evitar múltiplos logs em navegação rápida
const LOG_DEBOUNCE_MS = 2000; // 2 segundos entre logs

/**
 * Hook para logar automaticamente todos os acessos a /gestaofc
 * OTIMIZADO: Usa apenas 1 tabela (audit_logs) ao invés de 3
 */
export function useGestaoAccessLog(options: GestaoAccessLogOptions = {}) {
  const { enabled = true, logPageViews = true, logActions = true } = options;
  const { user, role } = useAuth();
  const location = useLocation();
  const lastLoggedPath = useRef<string>('');
  const lastLogTime = useRef<number>(0);
  const sessionStartTime = useRef<number>(Date.now());

  // Verificar se está em área de gestão
  const isGestaoArea = location.pathname.startsWith('/gestaofc');
  // P1-2 FIX: Role como fonte da verdade
  const isOwner = role === 'owner';

  // PATCH-CUSTO: Log único consolidado (1 tabela ao invés de 3)
  useEffect(() => {
    if (!enabled || !user?.id || !isGestaoArea) return;
    if (lastLoggedPath.current === location.pathname) return;
    
    // PATCH-CUSTO: Debounce para evitar spam de logs
    const now = Date.now();
    if (now - lastLogTime.current < LOG_DEBOUNCE_MS) return;

    lastLoggedPath.current = location.pathname;
    lastLogTime.current = now;
    sessionStartTime.current = now;

    // PATCH-CUSTO: Log único consolidado (fire-and-forget)
    const logAccess = async () => {
      try {
        // ÚNICA escrita ao invés de 3 anteriores
        await supabase.from('audit_logs').insert({
          action: isOwner ? 'OWNER_GESTAO_ACCESS' : 'GESTAO_PAGE_VIEW',
          user_id: user.id,
          table_name: 'navigation',
          record_id: location.pathname,
          new_data: {
            path: location.pathname,
            timestamp: new Date().toISOString(),
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
          },
          metadata: {
            isOwner,
            email: user.email,
            role: role || 'unknown',
            userAgent: navigator.userAgent.substring(0, 200), // Limitar tamanho
          },
        });

        console.log(`[GESTAO_LOG] ${isOwner ? '👑 OWNER' : '👔 STAFF'}: ${location.pathname}`);
      } catch (err) {
        // Erro silencioso - não interromper navegação
        console.warn('[GESTAO_LOG] Erro ao logar (não crítico)');
      }
    };

    if (logPageViews) {
      logAccess();
    }
  }, [location.pathname, user?.id, user?.email, role, isGestaoArea, isOwner, enabled, logPageViews]);

  // PATCH-CUSTO: Removido log de session_end (redundante)
  // A duração pode ser calculada via query: max(timestamp) - min(timestamp) por sessão

  // Função para logar ações específicas (mantida para ações críticas)
  const logAction = useCallback(async (
    actionType: string,
    details: Record<string, unknown> = {}
  ) => {
    if (!enabled || !logActions || !user?.id) return;

    // PATCH-CUSTO: Só loga ações realmente críticas
    const criticalActions = ['DELETE', 'UPDATE_ROLE', 'EXPORT', 'IMPORT', 'CREATE_USER'];
    const isCritical = criticalActions.includes(actionType.toUpperCase());
    
    // Para ações não críticas, skip
    if (!isCritical && !isOwner) return;

    try {
      await supabase.from('audit_logs').insert({
        action: `GESTAO_${actionType.toUpperCase()}`,
        user_id: user.id,
        table_name: 'gestaofc_actions',
        record_id: location.pathname,
        new_data: {
          actionType,
          path: location.pathname,
          timestamp: new Date().toISOString(),
          ...details,
        },
        metadata: {
          isOwner,
          email: user.email,
          role,
          isCritical,
        },
      });
    } catch (err) {
      console.warn('[GESTAO_LOG] Erro ao logar ação');
    }
  }, [user?.id, user?.email, role, location.pathname, isOwner, enabled, logActions]);

  return {
    isGestaoArea,
    isOwner,
    logAction,
    currentPath: location.pathname,
  };
}

export default useGestaoAccessLog;
