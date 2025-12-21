// ============================================
// TESTAMENTO DA SINGULARIDADE v5.0
// LESSON GUARD - Proteção da Área de Aula
// Verifica acesso BETA antes de renderizar aula
// ============================================

import { ReactNode, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Lock, Sparkles, Clock, AlertTriangle, BookOpen, Play, Trophy } from "lucide-react";
import { useBetaAccess } from "@/hooks/useBetaAccess";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePublishEvent } from "@/hooks/usePublishEvent";

interface BetaLessonGuardProps {
  children: ReactNode;
  lessonId?: string;
  lessonTitle?: string;
  fallbackPath?: string;
}

export function BetaLessonGuard({ 
  children, 
  lessonId,
  lessonTitle,
  fallbackPath = "/area-gratuita" 
}: BetaLessonGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { publishLessonStarted } = usePublishEvent();
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

  // Publicar evento de início de aula quando o acesso for validado
  useEffect(() => {
    if (hasAccess && lessonId && user) {
      publishLessonStarted(lessonId);
    }
  }, [hasAccess, lessonId, user, publishLessonStarted]);

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
          <p className="text-muted-foreground">Carregando aula...</p>
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
    return (
      <>
        {/* Badge de staff mode */}
        <div className="fixed bottom-4 right-4 z-50">
          <Badge className="bg-emerald-500/90 backdrop-blur-sm text-white shadow-lg">
            <Trophy className="h-3 w-3 mr-1" />
            Modo Staff
          </Badge>
        </div>
        {children}
      </>
    );
  }

  // Usuário gratuito - mostrar preview bloqueado
  if (isFreeUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 overflow-hidden relative">
            {/* Background decorativo */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
            </div>
            
            <CardHeader className="relative text-center space-y-4">
              {/* Ícone animado */}
              <motion.div 
                className="mx-auto p-4 rounded-full bg-primary/20 w-fit"
                animate={{ 
                  boxShadow: [
                    "0 0 0 0 rgba(var(--primary), 0.4)",
                    "0 0 0 20px rgba(var(--primary), 0)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Lock className="h-10 w-10 text-primary" />
              </motion.div>
              
              <div>
                <CardTitle className="text-2xl">Conteúdo Exclusivo BETA</CardTitle>
                {lessonTitle && (
                  <p className="text-primary font-medium mt-2">{lessonTitle}</p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Esta aula é exclusiva para alunos com acesso BETA ativo.
                </p>
              </div>
            </CardHeader>

            <CardContent className="relative space-y-6">
              {/* Preview do que está perdendo */}
              <div className="relative p-4 rounded-xl bg-background/50 border border-border/50">
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Play className="h-6 w-6" />
                    <span>Preview indisponível</span>
                  </div>
                </div>
                <div className="aspect-video bg-muted/30 rounded-lg" />
              </div>

              {/* Benefícios do BETA */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-center">Desbloqueie com o acesso BETA:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 text-sm">
                    <BookOpen className="h-4 w-4 text-primary shrink-0" />
                    <span>Aulas completas</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 text-sm">
                    <Play className="h-4 w-4 text-primary shrink-0" />
                    <span>Vídeos em HD</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 text-sm">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span>Materiais extras</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 text-sm">
                    <Trophy className="h-4 w-4 text-primary shrink-0" />
                    <span>XP e conquistas</span>
                  </div>
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
                  onClick={() => navigate(fallbackPath)}
                >
                  Ver Conteúdo Gratuito
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
                  <span className="text-sm font-medium">Aula bloqueada</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Renove seu acesso para continuar assistindo esta aula.
                </p>
              </div>

              <Button className="w-full gap-2" size="lg">
                <Sparkles className="h-4 w-4" />
                Renovar Acesso BETA
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => navigate(fallbackPath)}
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
                Acesso expira em <strong>{daysRemaining} dias</strong>
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
