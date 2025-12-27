// ============================================
// 🚫 BLOQUEADOR DE DOMÍNIO LEGADO v1.0
// MATRIZ SUPREMA - REGRA 6: gestao.* BLOQUEADO
// ============================================
// Destino único: https://pro.moisesmedeiros.com.br/gestaofc
// (para usuários autorizados) ou / (para não autorizados)
// ============================================

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isGestaoRole } from "@/core/urlAccessControl";

/**
 * Verifica se está no domínio legado gestao.moisesmedeiros.com.br
 */
function isLegacyGestaoDomain(): boolean {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname.toLowerCase();
  return hostname.startsWith("gestao.") || hostname === "gestao.moisesmedeiros.com.br";
}

/**
 * Componente que bloqueia o domínio legado gestao.*
 * e redireciona para pro.moisesmedeiros.com.br
 * 
 * MATRIZ SUPREMA - REGRA 6:
 * - gestao.moisesmedeiros.com.br → BLOQUEADO
 * - Destino permitido: pro.moisesmedeiros.com.br/gestaofc (staff/owner)
 * - Fallback: pro.moisesmedeiros.com.br/ (outros)
 */
export function LegacyDomainBlocker({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isBlocking, setIsBlocking] = useState(false);

  useEffect(() => {
    if (!isLegacyGestaoDomain()) {
      return; // Não está no domínio legado, não fazer nada
    }

    // Está no domínio legado - BLOQUEAR e REDIRECIONAR
    setIsBlocking(true);

    // Log de auditoria
    console.warn(
      "[MATRIZ SUPREMA] ⚠️ Domínio legado detectado:",
      window.location.hostname,
      "- Redirecionando para pro.moisesmedeiros.com.br"
    );

    // Determinar destino baseado no role do usuário
    const userRole = user?.user_metadata?.role as string | undefined;
    const userEmail = user?.email;
    const isOwner = userEmail?.toLowerCase() === "moisesblank@gmail.com";
    const isStaff = isOwner || (userRole && isGestaoRole(userRole));

    // Construir URL de destino
    const baseUrl = "https://pro.moisesmedeiros.com.br";
    const targetPath = isStaff ? "/gestaofc" : "/";
    const fullUrl = `${baseUrl}${targetPath}`;

    // Redirecionar imediatamente (301 permanente via replace)
    window.location.replace(fullUrl);
  }, [user]);

  // Se está bloqueando, mostrar tela de transição
  if (isBlocking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">
            Redirecionando para a nova plataforma...
          </p>
          <p className="text-xs text-muted-foreground/60">
            pro.moisesmedeiros.com.br
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default LegacyDomainBlocker;
