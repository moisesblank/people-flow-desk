// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ LEI VII ENFORCER COMPONENT v2.0 - INTEGRADO COM LEI III v3.0
// ═══════════════════════════════════════════════════════════════════════════════
// Componente que executa a LEI VII automaticamente no App
// Integrado com LEI III - Segurança Soberana v3.0 OMEGA DEFINITIVA
// Deve ser incluído no nível mais alto da aplicação
// ═══════════════════════════════════════════════════════════════════════════════

import { memo, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { executeLeiVII, updateLeiVIIUser } from "@/lib/constitution/executeLeiVII";
import {
  // OWNER_EMAIL removido - P1-2 FIX
  isOwnerBypass,
  logSecurityEvent,
  detectSuspiciousActivity,
  checkSecurityHealth,
} from "@/lib/constitution/LEI_III_SEGURANCA";
import { antiDebugger } from "@/lib/security/antiDebugger";

interface LeiVIIEnforcerProps {
  children: React.ReactNode;
}

/**
 * Componente que executa a LEI VII automaticamente
 * Integrado com LEI III v3.0 OMEGA DEFINITIVA
 * Deve envolver toda a aplicação para garantir proteção global
 */
export const LeiVIIEnforcer = memo(({ children }: LeiVIIEnforcerProps) => {
  const { user, role } = useAuth();

  // P1-2 FIX: Verificar owner via role (não email)
  const isOwner = useCallback(() => {
    return role === 'owner' || isOwnerBypass(null, role);
  }, [role]);

  // Verificação de saúde do sistema
  useEffect(() => {
    const health = checkSecurityHealth();
    if (!health.healthy) {
      console.warn("[LEI III/VII] ⚠️ Issues detected:", health.issues);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // v2.1: ANTI-DEBUGGER GLOBAL
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    // Configurar owner mode para o anti-debugger
    antiDebugger.setOwnerMode(user?.email);
    
    // Se não for owner, inicializar anti-debugger
    if (!isOwner()) {
      const cleanup = antiDebugger.init(user?.email);
      return cleanup;
    }
  }, [user?.email, isOwner]);

  // Executar LEI VII quando usuário mudar
  useEffect(() => {
    // Executar proteções
    const report = executeLeiVII(user?.email);

    // Log do resultado
    if (report.executed) {
      console.log(`[LEI VII] ✅ Proteções ativas: ${report.protectionsActive}`);

      if (report.handlers.includes("owner_bypass")) {
        console.log(`[LEI VII] 👑 OWNER Mode - role='owner' - Bypass Total Ativo`);
      }
    }

    // Log de segurança (apenas para não-owners)
    if (user?.id && !isOwner()) {
      logSecurityEvent({
        eventType: "LEI_VII_INITIALIZED",
        severity: "info",
        userId: user.id,
        payload: {
          protectionsActive: report.protectionsActive,
          handlers: report.handlers,
        },
      }).catch(() => {});
    }

    // Cleanup: atualizar quando usuário mudar
    return () => {
      updateLeiVIIUser(user?.email || null);
    };
  }, [user?.email, user?.id, isOwner]);

  // Listener global para eventos de violação
  useEffect(() => {
    if (isOwner()) return; // Owner não monitora violações

    const handleViolation = (e: CustomEvent) => {
      const { type, severity, count } = e.detail;

      // Log violações no console (apenas dev)
      if (process.env.NODE_ENV === "development") {
        console.warn(`[LEI VII] Violação: ${type} (severity: ${severity}, count: ${count})`);
      }

      // Log para o backend (LEI III)
      if (user?.id) {
        logSecurityEvent({
          eventType: `LEI_VII_VIOLATION_${type.toUpperCase()}`,
          severity: severity >= 50 ? "error" : severity >= 20 ? "warning" : "info",
          userId: user.id,
          payload: { type, severity, count },
        }).catch(() => {});
      }
    };

    window.addEventListener("sanctum-violation", handleViolation as EventListener);

    return () => {
      window.removeEventListener("sanctum-violation", handleViolation as EventListener);
    };
  }, [user?.id, isOwner]);

  // Detecção periódica de ameaças (apenas não-owners)
  useEffect(() => {
    if (isOwner()) return;

    // PATCH-024: jitter anti-herd (0-5s)
    const jitter = Math.floor(Math.random() * 5000);
    const interval = setInterval(() => {
      const threat = detectSuspiciousActivity();
      if (threat.suspicious && threat.riskScore >= 50) {
        console.warn("[LEI III] 🚨 Atividade suspeita detectada:", threat.reasons);

        if (user?.id) {
          logSecurityEvent({
            eventType: "THREAT_DETECTED",
            severity: threat.level === "critical" ? "critical" : "warning",
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
    }, 30000 + jitter);

    return () => clearInterval(interval);
  }, [user?.id, isOwner]);

  return <>{children}</>;
});

LeiVIIEnforcer.displayName = "LeiVIIEnforcer";

export default LeiVIIEnforcer;
