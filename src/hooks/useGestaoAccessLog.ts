// ============================================
// 🛡️ HOOK: useGestaoAccessLog
// Log automático de acessos a /gestaofc
// Especialmente importante para auditoria do OWNER
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from '@/lib/security/fortalezaSupreme';

interface GestaoAccessLogOptions {
  enabled?: boolean;
  logPageViews?: boolean;
  logActions?: boolean;
}

const OWNER_EMAIL = 'moisesblank@gmail.com';

/**
 * Hook para logar automaticamente todos os acessos a /gestaofc
 * Especialmente importante para rastrear ações do OWNER
 */
export function useGestaoAccessLog(options: GestaoAccessLogOptions = {}) {
  const { enabled = true, logPageViews = true, logActions = true } = options;
  const { user, role } = useAuth();
  const location = useLocation();
  const lastLoggedPath = useRef<string>('');
  const sessionStartTime = useRef<number>(Date.now());

  // Verificar se está em área de gestão
  const isGestaoArea = location.pathname.startsWith('/gestaofc');
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() || role === 'owner';

  // Log de entrada na área de gestão
  useEffect(() => {
    if (!enabled || !user?.id || !isGestaoArea) return;
    if (lastLoggedPath.current === location.pathname) return;

    lastLoggedPath.current = location.pathname;
    sessionStartTime.current = Date.now();

    // Log assíncrono (fire-and-forget)
    const logAccess = async () => {
      try {
        // 1. Log na tabela security_events via RPC
        await logSecurityEvent(
          'GESTAO_ACCESS',
          user.id,
          'info',
          {
            path: location.pathname,
            role: role || 'unknown',
            isOwner,
            email: user.email,
            name: user.user_metadata?.name || user.user_metadata?.nome || 'Unknown',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
          }
        );

        // 2. Log adicional na tabela activity_log
        await supabase.from('activity_log').insert({
          user_id: user.id,
          user_email: user.email,
          action: 'GESTAO_PAGE_VIEW',
          table_name: 'navigation',
          record_id: location.pathname,
          new_value: {
            path: location.pathname,
            role,
            isOwner,
            accessedAt: new Date().toISOString(),
          },
        });

        // 3. Log específico para OWNER (auditoria reforçada)
        if (isOwner) {
          await supabase.from('audit_logs').insert({
            action: 'OWNER_GESTAO_ACCESS',
            user_id: user.id,
            table_name: 'gestaofc_navigation',
            record_id: location.pathname,
            new_data: {
              path: location.pathname,
              timestamp: new Date().toISOString(),
              sessionDuration: 0,
              userAgent: navigator.userAgent,
            },
            metadata: {
              isOwner: true,
              email: user.email,
            },
          });
        }

        console.log(`[GESTAO_LOG] ${isOwner ? '👑 OWNER' : '👔 STAFF'} acessou: ${location.pathname}`);
      } catch (err) {
        // Erro silencioso - não interromper navegação
        console.warn('[GESTAO_LOG] Erro ao logar acesso (não crítico):', err);
      }
    };

    if (logPageViews) {
      logAccess();
    }
  }, [location.pathname, user?.id, user?.email, role, isGestaoArea, isOwner, enabled, logPageViews]);

  // Log de saída da área de gestão (duração da sessão)
  useEffect(() => {
    if (!enabled || !user?.id || !isGestaoArea) return;

    return () => {
      if (lastLoggedPath.current.startsWith('/gestaofc')) {
        const duration = Math.round((Date.now() - sessionStartTime.current) / 1000);
        
        // Log de duração da sessão (fire-and-forget)
        logSecurityEvent(
          'GESTAO_SESSION_END',
          user.id,
          'info',
          {
            path: lastLoggedPath.current,
            durationSeconds: duration,
            isOwner,
          }
        ).catch(() => {});
      }
    };
  }, [user?.id, isGestaoArea, isOwner, enabled]);

  // Função para logar ações específicas
  const logAction = useCallback(async (
    actionType: string,
    details: Record<string, unknown> = {}
  ) => {
    if (!enabled || !logActions || !user?.id) return;

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
        },
      });

      // Log adicional para ações críticas do owner
      if (isOwner && ['DELETE', 'UPDATE', 'CREATE', 'EXPORT', 'IMPORT'].includes(actionType.toUpperCase())) {
        await logSecurityEvent(
          `OWNER_${actionType.toUpperCase()}`,
          user.id,
          'warning', // Ações críticas do owner = warning para auditoria
          {
            path: location.pathname,
            ...details,
          }
        );
      }
    } catch (err) {
      console.warn('[GESTAO_LOG] Erro ao logar ação:', err);
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
