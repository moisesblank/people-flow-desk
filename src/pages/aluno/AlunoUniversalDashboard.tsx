// ============================================
// SANTUÁRIO BETA - ROTEADOR DE EXPERIÊNCIA v9.0
// O Componente que Lê Almas
// Experiência Dual: OWNER vs BETA
// ============================================

import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { LoadingState } from "@/components/LoadingState";
import { OwnerStudentDashboard } from "@/components/aluno/OwnerStudentDashboard";
import { BetaStudentDashboard } from "@/components/aluno/BetaStudentDashboard";
import { motion } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { AlertTriangle, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

/**
 * AlunoUniversalDashboard - O Roteador de Experiência
 * 
 * Este componente é a primeira manifestação da inteligência do Santuário.
 * Ele busca o role do usuário e apresenta o palco correto:
 * - OWNER: Visão divina com métricas de todos os alunos
 * - BETA: Jornada preditiva personalizada
 */
export default function AlunoUniversalDashboard() {
  const { gpuAnimationProps } = useQuantumReactivity();

  const { user, isLoading: authLoading } = useAuth();
  const { role, isLoading: roleLoading, isOwner } = useRolePermissions();
  const isBeta = role === 'beta';
  const navigate = useNavigate();

  // Estado de carregamento unificado
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          {...gpuAnimationProps.scaleIn}
          className="text-center space-y-4 will-change-transform transform-gpu"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 animate-pulse mx-auto" />
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 animate-ping opacity-50 mx-auto" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">Preparando seu Santuário...</p>
            <p className="text-sm text-muted-foreground">Carregando experiência personalizada</p>
          </div>
          <LoadingState variant="dots" size="sm" />
        </motion.div>
      </div>
    );
  }

  // Verificação de usuário
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div {...gpuAnimationProps.fadeUp} className="will-change-transform transform-gpu">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold">Sessão Expirada</h2>
              <p className="text-muted-foreground">
                Sua sessão expirou ou você não está autenticado.
              </p>
              <Button onClick={() => navigate('/auth')} className="w-full">
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ROTEAMENTO BASEADO NO PAPEL DIVINO
  
  // OWNER: Visão Divina - Dashboard de Onisciência
  if (isOwner) {
    return <OwnerStudentDashboard />;
  }

  // BETA: Jornada Preditiva - Dashboard Personalizado
  if (isBeta) {
    return <BetaStudentDashboard />;
  }

  // Acesso não autorizado - O fantasma na máquina
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div {...gpuAnimationProps.scaleIn} className="will-change-transform transform-gpu">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              O Santuário BETA é exclusivo para alunos com acesso ativo.
              Entre em contato para obter seu acesso.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={() => navigate('/')} className="flex-1">
                Página Inicial
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
