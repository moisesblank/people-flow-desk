// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ LEI VII ENFORCER COMPONENT v2.1 - FAIL-OPEN P0
// ═══════════════════════════════════════════════════════════════════════════════
// Componente que executa a LEI VII automaticamente no App
// 🔴 P0: NUNCA pode quebrar a renderização - fail-open obrigatório
// ═══════════════════════════════════════════════════════════════════════════════

import { memo, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FailOpenBoundary } from './FailOpenBoundary';

// 🔴 P0: Imports opcionais com fallback (carregamento assíncrono - sem require)
let executeLeiVII: ((email?: string | null) => { executed: boolean; protectionsActive: number; handlers: string[] }) | null = null;
let updateLeiVIIUser: ((email: string | null) => void) | null = null;
let OWNER_EMAIL = 'moisesblank@gmail.com';
let isOwnerBypass: ((email?: string | null, role?: string | null) => boolean) | null = null;
let logSecurityEvent: ((event: any) => Promise<void>) | null = null;
let detectSuspiciousActivity: (() => { suspicious: boolean; riskScore: number; reasons: string[]; level: string; recommendedAction: string }) | null = null;
let checkSecurityHealth: (() => { healthy: boolean; issues: string[] }) | null = null;

let modulesLoadStarted = false;
async function loadLeiVIIModules() {
  if (modulesLoadStarted) return;
  modulesLoadStarted = true;

  try {
    const leiVII: any = await import('@/lib/constitution/executeLeiVII');
    executeLeiVII = leiVII.executeLeiVII ?? leiVII.default ?? null;
    updateLeiVIIUser = leiVII.updateLeiVIIUser ?? null;
  } catch (e) {
    console.warn('[LeiVIIEnforcer] ⚠️ executeLeiVII não carregou:', e);
  }

  try {
    const leiIII: any = await import('@/lib/constitution/LEI_III_SEGURANCA');
    OWNER_EMAIL = leiIII.OWNER_EMAIL || OWNER_EMAIL;
    isOwnerBypass = leiIII.isOwnerBypass ?? null;
    logSecurityEvent = leiIII.logSecurityEvent ?? null;
    detectSuspiciousActivity = leiIII.detectSuspiciousActivity ?? null;
    checkSecurityHealth = leiIII.checkSecurityHealth ?? null;
  } catch (e) {
    console.warn('[LeiVIIEnforcer] ⚠️ LEI_III_SEGURANCA não carregou:', e);
  }
}

// fire-and-forget (P0: não bloquear bootstrap)
void loadLeiVIIModules();

interface LeiVIIEnforcerProps {
  children: React.ReactNode;
}

function LeiVIIEnforcerInner({ children }: LeiVIIEnforcerProps) {
  const { user } = useAuth();

  const isOwner = useCallback(() => {
    try {
      if (!isOwnerBypass) {
        return (user?.email?.toLowerCase() || '') === OWNER_EMAIL.toLowerCase();
      }
      return isOwnerBypass(user?.email, null);
    } catch {
      return (user?.email?.toLowerCase() || '') === OWNER_EMAIL.toLowerCase();
    }
  }, [user?.email]);

  // Verificação de saúde do sistema
  useEffect(() => {
    try {
      if (checkSecurityHealth) {
        const health = checkSecurityHealth();
        if (!health.healthy) {
          console.warn('[LEI III/VII] ⚠️ Issues detected:', health.issues);
        }
      }
    } catch (e) {
      console.warn('[LeiVIIEnforcer] checkSecurityHealth falhou:', e);
    }
  }, []);

  // Executar LEI VII quando usuário mudar
  useEffect(() => {
    try {
      if (!executeLeiVII) return;

      const report = executeLeiVII(user?.email);

      if (report?.executed) {
        console.log(`[LEI VII] ✅ Proteções ativas: ${report.protectionsActive}`);
        if (report.handlers?.includes?.('owner_bypass')) {
          console.log(`[LEI VII] 👑 OWNER Mode - ${OWNER_EMAIL} - Bypass Total Ativo`);
        }
      }

      if (user?.id && !isOwner() && logSecurityEvent) {
        logSecurityEvent({
          eventType: 'LEI_VII_INITIALIZED',
          severity: 'info',
          userId: user.id,
          payload: {
            protectionsActive: report?.protectionsActive,
            handlers: report?.handlers,
          },
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('[LeiVIIEnforcer] executeLeiVII falhou:', e);
    }

    return () => {
      try {
        if (updateLeiVIIUser) updateLeiVIIUser(user?.email || null);
      } catch {
        // silencioso
      }
    };
  }, [user?.email, user?.id, isOwner]);

  // Listener global para eventos de violação
  useEffect(() => {
    if (isOwner()) return;

    const handleViolation = (e: CustomEvent) => {
      try {
        const { type, severity, count } = e.detail || {};

        if (process.env.NODE_ENV === 'development') {
          console.warn(`[LEI VII] Violação: ${type} (severity: ${severity}, count: ${count})`);
        }

        if (user?.id && logSecurityEvent) {
          logSecurityEvent({
            eventType: `LEI_VII_VIOLATION_${String(type || 'unknown').toUpperCase()}`,
            severity: (severity ?? 0) >= 50 ? 'error' : (severity ?? 0) >= 20 ? 'warning' : 'info',
            userId: user.id,
            payload: { type, severity, count },
          }).catch(() => {});
        }
      } catch {
        // silencioso
      }
    };

    window.addEventListener('sanctum-violation', handleViolation as EventListener);
    return () => window.removeEventListener('sanctum-violation', handleViolation as EventListener);
  }, [user?.id, isOwner]);

  // Detecção periódica de ameaças (apenas não-owners)
  useEffect(() => {
    if (isOwner() || !detectSuspiciousActivity) return;

    const jitter = Math.floor(Math.random() * 5000);
    const interval = setInterval(() => {
      try {
        const threat = detectSuspiciousActivity();
        if (threat?.suspicious && (threat.riskScore ?? 0) >= 50) {
          console.warn('[LEI III] 🚨 Atividade suspeita detectada:', threat.reasons);

          if (user?.id && logSecurityEvent) {
            logSecurityEvent({
              eventType: 'THREAT_DETECTED',
              severity: threat.level === 'critical' ? 'critical' : 'warning',
              userId: user.id,
              payload: {
                riskScore: threat.riskScore,
                reasons: threat.reasons,
                level: threat.level,
                action: threat.recommendedAction,
              },
            }).catch(() => {});
          }
        }
      } catch {
        // silencioso
      }
    }, 30000 + jitter);

    return () => clearInterval(interval);
  }, [user?.id, isOwner]);

  return <>{children}</>;
}

/**
 * 🔴 P0: FAIL-OPEN absoluto.
 * - remove require() (causa raiz do crash em build)
 * - evita setState durante render
 * - captura crashes via ErrorBoundary
 */
export const LeiVIIEnforcer = memo(({ children }: LeiVIIEnforcerProps) => {
  return (
    <FailOpenBoundary name="LeiVIIEnforcer">
      <LeiVIIEnforcerInner>{children}</LeiVIIEnforcerInner>
    </FailOpenBoundary>
  );
});

LeiVIIEnforcer.displayName = 'LeiVIIEnforcer';

export default LeiVIIEnforcer;
