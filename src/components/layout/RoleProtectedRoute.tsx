// ============================================
// MOISÉS MEDEIROS v12.0 - ROLE PROTECTED ROUTE
// Rota protegida com verificação de permissão por cargo
// 🔐 ATUALIZAÇÃO v12.0: 404 genérico para /gestaofc (não expor existência)
// BLOCO 2 & 3: Owner bypass total, alunos veem 404
// ============================================

import { ReactNode, useEffect, useState, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { 
  useRolePermissions, 
  type SystemArea, 
  URL_TO_AREA,
  OWNER_EMAIL
} from "@/hooks/useRolePermissions";
import { validateDomainAccessForLogin, type DomainAppRole } from "@/hooks/useDomainAccess";
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
          <h1 className="text-2xl font-bold text-foreground">
            Página não encontrada
          </h1>
          <p className="text-muted-foreground">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        <Button onClick={() => window.location.href = '/'}>
          Voltar para o Início
        </Button>
      </div>
    </div>
  );
}

export function RoleProtectedRoute({ children, requiredArea }: RoleProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { hasAccess, hasAccessToUrl, isLoading: roleLoading, roleLabel, role, isOwner } = useRolePermissions();
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
  // 🔥 OWNER BYPASS DE FRICÇÃO (NÃO SEGURANÇA)
  // Email hardcoded é usado APENAS para:
  // - Não ficar preso em loading/spinner
  // - Não depender de guards externos
  // A autorização real (role) vem do banco e será verificada
  // ============================================
  const isOwnerEmail = useMemo(() => {
    return user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  }, [user?.email]);
  
  // ✅ BYPASS calculado como VALOR, não como return condicional
  const shouldBypassForOwner = useMemo(() => {
    // Owner autenticado com role confirmada OU ainda carregando
    if (isOwnerEmail && user && (role === 'owner' || roleLoading)) {
      // Se role já carregou e não é owner, não dar bypass
      if (!roleLoading && role !== 'owner') {
        console.warn(`[RoleProtectedRoute] Email owner mas role=${role} - verificar banco`);
        return false;
      }
      return true;
    }
    return false;
  }, [isOwnerEmail, user, role, roleLoading]);

  // ============================================
  // 🛡️ DOMAIN GUARD - LOG ONLY (sem redirect)
  // ============================================
  useEffect(() => {
    if (roleLoading || !user || !role) return;

    const userEmail = user.email || null;
    const domainValidation = validateDomainAccessForLogin(role, userEmail);

    if (!domainValidation.permitido) {
      console.log(`[DOMAIN-GUARD] Role "${role}" no domínio ${domainValidation.dominioAtual} - acesso pode ser limitado (sem redirect)`);
    }
  }, [role, roleLoading, user]);

  // ============================================
  // 🛡️ LÓGICA DE ACESSO (APÓS TODOS OS HOOKS)
  // ============================================
  const isGestaoPath = location.pathname.startsWith("/gestaofc");
  const isStaffRole = ['owner', 'admin', 'coordenacao', 'suporte', 'monitoria', 'employee', 'marketing', 'contabilidade', 'afiliado'].includes(role || '');
  const currentArea = requiredArea || URL_TO_AREA[location.pathname];
  const hasPermission = currentArea ? hasAccess(currentArea) : hasAccessToUrl(location.pathname);
  const isActuallyLoading = (authLoading || roleLoading) && !loadingTimeout;

  // ============================================
  // 🔥 OWNER BYPASS - DECISÃO (não estrutura)
  // ============================================
  if (shouldBypassForOwner) {
    return <>{children}</>;
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
    return <Navigate to="/auth" replace />;
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
