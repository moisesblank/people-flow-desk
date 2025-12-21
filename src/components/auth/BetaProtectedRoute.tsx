// ============================================
// 🛡️ CAMADA 3: O GUARDIÃO DA INTERFACE
// Proteção de rotas do Santuário BETA
// ============================================

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Lock, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BetaProtectedRouteProps {
  children: ReactNode;
  fallbackPath?: string;
  showExpiredMessage?: boolean;
}

export function BetaProtectedRoute({ 
  children, 
  fallbackPath = '/area-gratuita',
  showExpiredMessage = true 
}: BetaProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { hasAccess, isLoading, isExpired, daysRemaining, role, reason } = useBetaAccess();
  const location = useLocation();

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando acesso ao Santuário...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Access expired - show message or redirect
  if (isExpired && showExpiredMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Acesso Expirado</CardTitle>
            <CardDescription>
              Seu período de acesso ao Santuário BETA terminou.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Renove seu acesso para continuar sua jornada rumo à aprovação.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <a href="/renovar-acesso">Renovar Acesso</a>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <a href={fallbackPath}>Ir para Área Gratuita</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No access - redirect to fallback
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
            <CardDescription>
              Esta área é exclusiva para alunos do Santuário BETA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Desbloqueie todo o conteúdo premium e acelere sua aprovação.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <a href="/matricula">Quero me Matricular</a>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <a href={fallbackPath}>Continuar na Área Gratuita</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access granted - show warning if expiring soon
  if (hasAccess && daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 text-white px-4 py-2 text-center text-sm">
          <AlertTriangle className="inline h-4 w-4 mr-2" />
          Seu acesso expira em <strong>{daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}</strong>.{' '}
          <a href="/renovar-acesso" className="underline font-semibold">Renovar agora</a>
        </div>
        <div className="pt-10">
          {children}
        </div>
      </>
    );
  }

  // Full access - render children
  return <>{children}</>;
}

// HOC para proteção de rotas
export function withBetaProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: { fallbackPath?: string }
) {
  return function BetaProtectedComponent(props: P) {
    return (
      <BetaProtectedRoute fallbackPath={options?.fallbackPath}>
        <WrappedComponent {...props} />
      </BetaProtectedRoute>
    );
  };
}

export default BetaProtectedRoute;
