// ============================================
// DOGMA XII: GUARDA DE ACESSO BETA
// Bloqueia acesso de usuários não-BETA à área logada
// Redireciona alunos gratuitos para área gratuita
// ============================================

import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, Clock, Crown, Lock, Sparkles, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useBetaAccess } from "@/hooks/useBetaAccess";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface BetaAccessGuardProps {
  children: ReactNode;
  requiredArea?: string;
}

export function BetaAccessGuard({ children, requiredArea }: BetaAccessGuardProps) {
  const location = useLocation();
  const { hasAccess, isLoading, isStaff, role, daysRemaining, expiresAt, isExpired, isFreeUser, reason, allowedArea } = useBetaAccess();
  const { isOwner, isAdmin } = useRolePermissions();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="h-12 w-12 text-primary animate-spin relative z-10" />
          </div>
          <p className="text-muted-foreground animate-pulse">Verificando acesso...</p>
        </motion.div>
      </div>
    );
  }

  // Staff (owner, admin, funcionários) - acesso total
  if (isStaff || isOwner || isAdmin) {
    return <>{children}</>;
  }

  // Usuário gratuito tentando acessar área restrita
  if (isFreeUser && requiredArea !== "area-gratuita") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full border-2 border-primary/20 shadow-2xl shadow-primary/10">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4"
              >
                <Crown className="w-10 h-10 text-white" />
              </motion.div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                Área Exclusiva BETA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <p className="text-muted-foreground">
                Esta área é exclusiva para alunos BETA que adquiriram nosso curso completo.
              </p>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-3 justify-center">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-amber-600">
                    Desbloqueie o acesso completo!
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  onClick={() => window.location.href = "/area-gratuita"}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Continuar na Área Gratuita
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                  onClick={() => window.open("https://pay.hotmart.com/SEU_LINK", "_blank")}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Quero Ser BETA!
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // BETA com acesso expirado
  if (role === "beta" && isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full border-2 border-destructive/20 shadow-2xl shadow-destructive/10">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mb-4"
              >
                <AlertTriangle className="w-10 h-10 text-white" />
              </motion.div>
              <CardTitle className="text-2xl font-bold text-destructive">
                Acesso Expirado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <p className="text-muted-foreground">
                Seu período de acesso BETA expirou. Renove agora para continuar aproveitando todo o conteúdo!
              </p>

              {expiresAt && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                  <p className="text-sm text-muted-foreground">Expirou em:</p>
                  <p className="font-bold text-destructive">
                    {new Date(expiresAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  onClick={() => window.open("https://pay.hotmart.com/SEU_LINK_RENOVACAO", "_blank")}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Renovar Acesso
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = "/area-gratuita"}
                >
                  Ir para Área Gratuita
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // BETA com acesso válido - mostrar dias restantes se próximo de expirar
  if (role === "beta" && hasAccess) {
    const showWarning = daysRemaining !== null && daysRemaining <= 30;
    
    return (
      <>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2"
          >
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Seu acesso expira em {daysRemaining} dias!
                </span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => window.open("https://pay.hotmart.com/SEU_LINK_RENOVACAO", "_blank")}
              >
                Renovar Agora
              </Button>
            </div>
          </motion.div>
        )}
        <div className={showWarning ? "pt-10" : ""}>
          {children}
        </div>
      </>
    );
  }

  // Sem acesso definido - redireciona para auth
  return <Navigate to="/auth" replace />;
}

// Componente para exibir status de acesso BETA
export function BetaAccessStatus() {
  const { role, daysRemaining, expiresAt, hasAccess, isStaff } = useBetaAccess();

  if (isStaff) {
    return (
      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <Crown className="w-3 h-3 mr-1" />
        Staff
      </Badge>
    );
  }

  if (role === "beta" && hasAccess) {
    const progressValue = daysRemaining ? Math.min((daysRemaining / 365) * 100, 100) : 0;
    
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <Sparkles className="w-3 h-3 mr-1" />
          BETA
        </Badge>
        {daysRemaining !== null && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Progress value={progressValue} className="w-20 h-2" />
            <span>{daysRemaining}d</span>
          </div>
        )}
      </div>
    );
  }

  if (role === "aluno_gratuito") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Gratuito
      </Badge>
    );
  }

  return null;
}
