// ============================================
// TESTAMENTO DA SINGULARIDADE v5.0
// DASHBOARD PROTEGIDO - Área BETA
// Verifica acesso BETA antes de renderizar
// ============================================

import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Lock, Sparkles, Clock, AlertTriangle } from "lucide-react";
import { useBetaAccess } from "@/hooks/useBetaAccess";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BetaDashboardGuardProps {
  children: ReactNode;
  requiredRole?: "beta" | "owner" | "admin";
  fallbackPath?: string;
}

export function BetaDashboardGuard({ 
  children, 
  requiredRole = "beta",
  fallbackPath = "/area-gratuita" 
}: BetaDashboardGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { 
    hasAccess, 
    isStaff, 
    role, 
    daysRemaining, 
    expiresAt, 
    isLoading, 
    isExpired,
    isFreeUser 
  } = useBetaAccess();

  // Estado de carregamento
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
          </div>
          <p className="text-muted-foreground">Verificando acesso...</p>
        </motion.div>
      </div>
    );
  }

  // Não autenticado - redirecionar para login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Staff (owner/admin) tem acesso total
  if (isStaff) {
    return <>{children}</>;
  }

  // Usuário gratuito - mostrar tela de upgrade
  if (isFreeUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
            
            <CardHeader className="relative text-center space-y-4">
              <div className="mx-auto p-4 rounded-full bg-primary/20 w-fit">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Área Exclusiva BETA</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Este conteúdo é exclusivo para alunos com acesso BETA ativo.
                </p>
              </div>
            </CardHeader>

            <CardContent className="relative space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-sm">Acesso a todos os cursos</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-sm">Simulados ilimitados</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-sm">Suporte prioritário</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full gap-2" size="lg">
                  <Sparkles className="h-4 w-4" />
                  Fazer Upgrade para BETA
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => window.location.href = fallbackPath}
                >
                  Continuar na Área Gratuita
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Acesso expirado
  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/5 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="border-destructive/20 bg-gradient-to-br from-card to-destructive/5 overflow-hidden">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto p-4 rounded-full bg-destructive/20 w-fit">
                <Clock className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-xl">Acesso Expirado</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Seu acesso BETA expirou em {expiresAt ? new Date(expiresAt).toLocaleDateString('pt-BR') : 'data desconhecida'}.
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Acesso suspenso</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Renove seu acesso para continuar estudando e manter seu progresso.
                </p>
              </div>

              <Button className="w-full gap-2" size="lg">
                <Sparkles className="h-4 w-4" />
                Renovar Acesso BETA
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => window.location.href = fallbackPath}
              >
                Ir para Área Gratuita
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Tem acesso válido - mostrar alerta se estiver próximo do vencimento
  if (hasAccess && daysRemaining !== null && daysRemaining <= 30) {
    return (
      <div className="relative">
        {/* Banner de aviso de expiração */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500/90 to-amber-500/90 backdrop-blur-sm"
        >
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white text-sm">
              <Clock className="h-4 w-4" />
              <span>
                Seu acesso expira em <strong>{daysRemaining} dias</strong>
              </span>
            </div>
            <Button size="sm" variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Renovar
            </Button>
          </div>
        </motion.div>
        
        {/* Conteúdo com padding para o banner */}
        <div className="pt-10">
          {children}
        </div>
      </div>
    );
  }

  // Acesso válido - renderizar normalmente
  if (hasAccess) {
    return <>{children}</>;
  }

  // Fallback - redirecionar para área gratuita
  return <Navigate to={fallbackPath} replace />;
}

// Hook para verificar se deve mostrar alerta de churn
export function useChurnRiskCheck() {
  const { hasAccess, daysRemaining } = useBetaAccess();
  
  // Calcular score de risco baseado em dias restantes
  let churnRiskScore = 0;
  
  if (daysRemaining !== null) {
    if (daysRemaining <= 7) churnRiskScore = 0.9;
    else if (daysRemaining <= 14) churnRiskScore = 0.7;
    else if (daysRemaining <= 30) churnRiskScore = 0.5;
  }

  return {
    churnRiskScore,
    shouldShowAlert: churnRiskScore >= 0.7,
    hasAccess,
    daysRemaining,
  };
}
