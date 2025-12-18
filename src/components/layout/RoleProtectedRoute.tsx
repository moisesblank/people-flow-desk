// ============================================
// MOISÉS MEDEIROS v10.0 - ROLE PROTECTED ROUTE
// Rota protegida com verificação de permissão por cargo
// ============================================

import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, ShieldX, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions, type SystemArea, URL_TO_AREA } from "@/hooks/useRolePermissions";
import { Button } from "@/components/ui/button";

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredArea?: SystemArea;
}

export function RoleProtectedRoute({ children, requiredArea }: RoleProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { hasAccess, hasAccessToUrl, isLoading: roleLoading, roleLabel, role } = useRolePermissions();
  const location = useLocation();

  // Loading state - CSS only animation for max performance
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check permission
  const currentArea = requiredArea || URL_TO_AREA[location.pathname];
  const hasPermission = currentArea ? hasAccess(currentArea) : hasAccessToUrl(location.pathname);

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
          <div className="mx-auto w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
            <ShieldX className="w-12 h-12 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Acesso Negado
            </h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta área.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3 justify-center">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Seu cargo atual:</p>
                <p className="font-semibold text-foreground">{roleLabel}</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Se você acredita que deveria ter acesso a esta área,<br />
            entre em contato com o administrador do sistema.
          </p>

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              Voltar
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
            >
              Ir para o Início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
