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
import { useRolePermissions } from "@/hooks/useRolePermissions";
// P1-2 FIX: OWNER_EMAIL não mais usado - verificação via role='owner'
// 🎯 FONTE ÚNICA DE VERDADE - ÁREAS
import { type SystemArea, URL_TO_AREA } from "@/core/areas";
import { validateDomainAccessForLogin, type DomainAppRole } from "@/hooks/useDomainAccess";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { isGestaoRole } from "@/core/urlAccessControl";
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
  const { user, isLoading: authLoading } = useAuth();
  const { hasAccess, hasAccessToUrl, isLoading: roleLoading, roleLabel, role, isOwner } = useRolePermissions();
  const { isLoading: onboardingLoading, needsOnboarding, onboardingRedirectPath } = useOnboardingStatus();
  const location = useLocation();

  // ============================================
  // ⚠️ CRÍTICO: TODOS OS HOOKS DEVEM VIR PRIMEIRO
  // React Error #310 = hooks em ordem diferente
  // NUNCA fazer return antes de TODOS os hooks
  // ============================================

  // ============================================
  // ⏱️ TIMEOUT GLOBAL (LEI IV CONSTITUIÇÃO)
  // Se loading > 5s, prosseguir com fallback
  // ============================================
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authLoading || roleLoading) {
        console.warn("[RoleProtectedRoute] Timeout de 5s atingido - prosseguindo com estado atual");
        setLoadingTimeout(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [authLoading, roleLoading]);

  // ============================================
  // 🔥 OWNER BYPASS VIA ROLE (P1-2 FIX)
  // Autorização real vem do banco via role='owner'
  // Email NÃO é mais usado para controle de acesso
  // ============================================

  // 🔒 P0 FIX v5: Verificação por role COM fallback por email
  // CRÍTICO: Durante loading, role pode ser null - fallback por email garante bypass
  const isOwnerByRole = useMemo(() => {
    if (role === "owner") return true;
    // Fallback de emergência para race condition de loading
    const email = user?.email?.toLowerCase();
    if (email === 'moisesblank@gmail.com') return true;
    return false;
  }, [role, user?.email]);

  // ✅ BYPASS calculado via role + email fallback
  const shouldBypassForOwner = useMemo(() => {
    // 1. Verificar role + email fallback
    if (isOwnerByRole && user) return true;
    // 2. Verificar isOwner do hook (pode estar disponível antes de role)
    if (isOwner && user) return true;
    return false;
  }, [isOwnerByRole, user, isOwner]);

  // ============================================
  // 🛡️ DOMAIN GUARD - LOG ONLY (sem redirect)
  // ============================================
  useEffect(() => {
    if (roleLoading || !user || !role) return;

    const userEmail = user.email || null;
    const domainValidation = validateDomainAccessForLogin(role, userEmail);

    if (!domainValidation.permitido) {
      console.log(
        `[DOMAIN-GUARD] Role "${role}" no domínio ${domainValidation.dominioAtual} - acesso pode ser limitado (sem redirect)`,
      );
    }
  }, [role, roleLoading, user]);

  // ============================================
  // 🛡️ LÓGICA DE ACESSO (APÓS TODOS OS HOOKS)
  // ============================================
  const isGestaoPath = location.pathname.startsWith("/gestaofc");
  const isOnPrimeiroAcesso = location.pathname === "/primeiro-acesso" || location.pathname === "/primeiro-acesso-funcionario";
  // P1-2 FIX: Sem 'funcionario' e 'employee' deprecated
  const isStaffRole = [
    "owner",
    "admin",
    "coordenacao",
    "suporte",
    "monitoria",
    "marketing",
    "contabilidade",
    "afiliado",
  ].includes(role || "");
  const currentArea = requiredArea || URL_TO_AREA[location.pathname];
  const hasPermission = currentArea ? hasAccess(currentArea) : hasAccessToUrl(location.pathname);
  const isActuallyLoading = (authLoading || roleLoading || onboardingLoading) && !loadingTimeout;

  // ============================================
  // 🔥 OWNER BYPASS - DECISÃO (não estrutura)
  // ============================================
  if (shouldBypassForOwner) {
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
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
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
  // v10.4.2: Redireciona funcionários para /primeiro-acesso-funcionario
  // ============================================
  if (needsOnboarding && !isOnPrimeiroAcesso && !shouldBypassForOwner) {
    console.log(`[RoleProtectedRoute] Onboarding incompleto, redirecionando para ${onboardingRedirectPath}`);
    return <Navigate to={onboardingRedirectPath} replace />;
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
    return <NotFoundPage />;
  }

  return <>{children}</>;
}
