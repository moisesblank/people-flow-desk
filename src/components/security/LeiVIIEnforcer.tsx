// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ LEI VII ENFORCER COMPONENT v2.1 - FAIL-OPEN P0
// ═══════════════════════════════════════════════════════════════════════════════
// Componente que executa a LEI VII automaticamente no App
// 🔴 P0: NUNCA pode quebrar a renderização - fail-open obrigatório
// ═══════════════════════════════════════════════════════════════════════════════

import { memo, useEffect, useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

// 🔴 P0: Imports opcionais com fallback
let executeLeiVII: ((email?: string | null) => { executed: boolean; protectionsActive: number; handlers: string[] }) | null = null;
let updateLeiVIIUser: ((email: string | null) => void) | null = null;
let OWNER_EMAIL = 'moisesblank@gmail.com';
let isOwnerBypass: ((email?: string | null, role?: string | null) => boolean) | null = null;
let logSecurityEvent: ((event: any) => Promise<void>) | null = null;
let detectSuspiciousActivity: (() => { suspicious: boolean; riskScore: number; reasons: string[]; level: string; recommendedAction: string }) | null = null;
let checkSecurityHealth: (() => { healthy: boolean; issues: string[] }) | null = null;

// Carregar módulos de forma segura (fail-open)
try {
  const leiVII = require('@/lib/constitution/executeLeiVII');
  executeLeiVII = leiVII.executeLeiVII;
  updateLeiVIIUser = leiVII.updateLeiVIIUser;
} catch (e) {
  console.warn('[LeiVIIEnforcer] ⚠️ executeLeiVII não carregou:', e);
}

try {
  const leiIII = require('@/lib/constitution/LEI_III_SEGURANCA');
  OWNER_EMAIL = leiIII.OWNER_EMAIL || OWNER_EMAIL;
  isOwnerBypass = leiIII.isOwnerBypass;
  logSecurityEvent = leiIII.logSecurityEvent;
  detectSuspiciousActivity = leiIII.detectSuspiciousActivity;
  checkSecurityHealth = leiIII.checkSecurityHealth;
} catch (e) {
  console.warn('[LeiVIIEnforcer] ⚠️ LEI_III_SEGURANCA não carregou:', e);
}

interface LeiVIIEnforcerProps {
  children: React.ReactNode;
}

/**
 * Componente que executa a LEI VII automaticamente
 * 🔴 P0: FAIL-OPEN - se der erro, renderiza children normalmente
 */
export const LeiVIIEnforcer = memo(({ children }: LeiVIIEnforcerProps) => {
  const [hasError, setHasError] = useState(false);
  
  // 🔴 P0: Se já deu erro, fail-open imediato
  if (hasError) {
    return <>{children}</>;
  }
  
  try {
    const { user } = useAuth();
    
    // Verificar se é owner (MASTER - bypass total)
    const isOwner = useCallback(() => {
      if (!isOwnerBypass) {
        return user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
      }
      return isOwnerBypass(user?.email, null);
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
        
        // Executar proteções
        const report = executeLeiVII(user?.email);
        
        // Log do resultado
        if (report.executed) {
          console.log(`[LEI VII] ✅ Proteções ativas: ${report.protectionsActive}`);
          
          if (report.handlers.includes('owner_bypass')) {
            console.log(`[LEI VII] 👑 OWNER Mode - ${OWNER_EMAIL} - Bypass Total Ativo`);
          }
        }
        
        // Log de segurança (apenas para não-owners)
        if (user?.id && !isOwner() && logSecurityEvent) {
          logSecurityEvent({
            eventType: 'LEI_VII_INITIALIZED',
            severity: 'info',
            userId: user.id,
            payload: {
              protectionsActive: report.protectionsActive,
              handlers: report.handlers,
            },
          }).catch(() => {});
        }
      } catch (e) {
        console.warn('[LeiVIIEnforcer] executeLeiVII falhou:', e);
      }
      
      // Cleanup: atualizar quando usuário mudar
      return () => {
        try {
          if (updateLeiVIIUser) {
            updateLeiVIIUser(user?.email || null);
          }
        } catch (e) {
          // Silencioso no cleanup
        }
      };
    }, [user?.email, user?.id, isOwner]);

    // Listener global para eventos de violação
    useEffect(() => {
      if (isOwner()) return; // Owner não monitora violações
      
      const handleViolation = (e: CustomEvent) => {
        try {
          const { type, severity, count } = e.detail;
          
          // Log violações no console (apenas dev)
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[LEI VII] Violação: ${type} (severity: ${severity}, count: ${count})`);
          }
          
          // Log para o backend (LEI III)
          if (user?.id && logSecurityEvent) {
            logSecurityEvent({
              eventType: `LEI_VII_VIOLATION_${type.toUpperCase()}`,
              severity: severity >= 50 ? 'error' : severity >= 20 ? 'warning' : 'info',
              userId: user.id,
              payload: { type, severity, count },
            }).catch(() => {});
          }
        } catch (e) {
          // Silencioso
        }
      };

      window.addEventListener('sanctum-violation', handleViolation as EventListener);
      
      return () => {
        window.removeEventListener('sanctum-violation', handleViolation as EventListener);
      };
    }, [user?.id, isOwner]);

    // Detecção periódica de ameaças (apenas não-owners)
    useEffect(() => {
      if (isOwner() || !detectSuspiciousActivity) return;
      
      // PATCH-024: jitter anti-herd (0-5s)
      const jitter = Math.floor(Math.random() * 5000);
      const interval = setInterval(() => {
        try {
          const threat = detectSuspiciousActivity();
          if (threat.suspicious && threat.riskScore >= 50) {
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
        } catch (e) {
          // Silencioso
        }
      }, 30000 + jitter);
      
      return () => clearInterval(interval);
    }, [user?.id, isOwner]);

    return <>{children}</>;
  } catch (error) {
    // 🔴 P0 FAIL-OPEN: Se qualquer coisa falhar, renderiza children
    console.error('[LeiVIIEnforcer] ❌ Erro capturado - fail-open ativo:', error);
    // Marcar erro para evitar re-tentativas
    if (!hasError) {
      setHasError(true);
    }
    return <>{children}</>;
  }
});

LeiVIIEnforcer.displayName = 'LeiVIIEnforcer';

export default LeiVIIEnforcer;
