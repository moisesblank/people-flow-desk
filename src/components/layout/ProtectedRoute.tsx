// ============================================
// MOISÉS MEDEIROS v12.1 - ROLE PROTECTED ROUTE
// Rota protegida com verificação de permissão por cargo
// 🔐 ATUALIZAÇÃO v12.1: Onboarding obrigatório
// BLOCO 2 & 3: Owner bypass total, alunos veem 404
// ============================================

import { ReactNode, useEffect, useState, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions, OWNER_EMAIL } from "@/hooks/useRolePermissions";
// 🎯 FONTE ÚNICA DE VERDADE - ÁREAS
import { type SystemArea, URL_TO_AREA } from "@/core/areas";
import { validateDomainAccessForLogin, type DomainAppRole } from "@/hooks/useDomainAccess";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { Button } from "@/components/ui/button";

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredArea?: SystemArea;
}

// ============================================
// 🚫 COMPONENTE: Página 404 Genérica
// Usada para não expor existência de /gestaofc
// ============================================
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-8xl font-bold text-muted-foreground/30">404</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Página não encontrada</h1>
          <p className="text-muted-foreground">A página que você está procurando não existe ou foi movida.</p>
        </div>
        <Button onClick={() => (window.location.href = "/")}>Voltar para o Início</Button>
      </div>
    </div>
  );
}

export function RoleProtectedRoute({ children, requiredArea }: RoleProtectedRouteProps) {
  // 🔴 DEBUG P0
  console.log("[RoleProtectedRoute] 🚀 COMPONENTE INICIANDO RENDER");

  const { user, isLoading: authLoading } = useAuth();
  const { hasAccess, hasAccessToUrl, isLoading: roleLoading, roleLabel, role, isOwner } = useRolePermissions();
  const { isLoading: onboardingLoading, needsOnboarding } = useOnboardingStatus();
  const location = useLocation();
  // ============================================
  // 🔥 OWNER BYPASS - DECISÃO (não estrutura)
  // ============================================
  if (shouldBypassForOwner) {
    console.log("[RoleProtectedRoute] 👑 OWNER BYPASS - renderizando children");
    return <>{children}</>;
  }

  // ============================================
  // 🔒 BLOQUEIO GLOBAL: 2FA pendente (anti “meio logado”)
  // Se o usuário tem sessão mas ainda não concluiu 2FA, força /auth.
  // ============================================
  const is2FAPending = typeof window !== "undefined" && sessionStorage.getItem("matriz_2fa_pending") === "1";
  if (user && is2FAPending && !shouldBypassForOwner) {
    console.warn("[RoleProtectedRoute] 2FA pendente → redirect /auth", {
      path: location.pathname,
      email: user.email,
      role,
      hasSupabaseToken: !!localStorage.getItem("sb-fyikfsasudgzsjmumdlw-auth-token"),
    });
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // ============================================
  // 🛡️ LOADING STATE DETERMINÍSTICO
  // Spinner máximo 5s, depois prossegue
  // ============================================
  if (isActuallyLoading) {
    console.log("[RoleProtectedRoute] ⏳ LOADING STATE ATIVO", {
      authLoading,
      roleLoading,
      onboardingLoading,
      loadingTimeout,
    });
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 relative z-10">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    console.warn("[RoleProtectedRoute] Sem usuário após loading → redirect /auth", {
      path: location.pathname,
      hasSupabaseToken: !!localStorage.getItem("sb-fyikfsasudgzsjmumdlw-auth-token"),
      is2FAPending,
    });
    return <Navigate to="/auth" replace />;
  }

  // ============================================
  // 🔐 ONBOARDING OBRIGATÓRIO
  // Se onboarding incompleto, redirecionar
  // (Exceto owner e se já estamos na página)
  // ============================================
  if (needsOnboarding && !isOnPrimeiroAcesso && !shouldBypassForOwner) {
    console.log("[RoleProtectedRoute] Onboarding incompleto, redirecionando para /primeiro-acesso");
    return <Navigate to="/primeiro-acesso" replace />;
  }

  // ============================================
  // 🔒 BLOCO 3: POLÍTICA DE ACESSO À ROTA
  // /gestaofc/* → OWNER/STAFF permitido, outros = 404
  // ============================================

  // Se tentando acessar /gestaofc sem ser staff/owner → 404 GENÉRICO
  // Não expõe que a área existe (BLOCO 3.2)
  if (isGestaoPath && !isStaffRole && !isOwner) {
    console.log(`[GESTAO_GUARD] Usuário "${user.email}" (role: ${role}) tentou acessar /gestaofc → 404`);
    return <NotFoundPage />;
  }

  // Para rotas /gestaofc, já validamos acima
  if (isGestaoPath && isStaffRole) {
    return <>{children}</>;
  }

  if (!hasPermission) {
    // Para outras áreas (não /gestaofc), mostrar acesso negado normal
    console.log("[RoleProtectedRoute] ❌ SEM PERMISSÃO - mostrando 404", { hasPermission, currentArea, role });
    return <NotFoundPage />;
  }

  console.log("[RoleProtectedRoute] ✅ RENDERIZANDO CHILDREN");
  return <>{children}</>;
}
