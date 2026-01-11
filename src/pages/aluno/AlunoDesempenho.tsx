// ============================================
// 🏆 ALUNO DESEMPENHO - PÁGINA DEDICADA
// Year 2300 Cinematic Design
// Métricas em Tempo Real
// ============================================

import { memo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, BarChart3, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StudentPerformanceAnalytics } from "@/components/aluno/questoes/StudentPerformanceAnalytics";
import "@/styles/dashboard-2300.css";

const AlunoDesempenho = memo(function AlunoDesempenho() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-background to-yellow-950/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate('/alunos/dashboard')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </Button>

          {/* Live Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-xs font-medium text-amber-500">TEMPO REAL</span>
          </div>
        </motion.div>

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-4 py-8"
        >
          <div className="flex items-center justify-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
              <BarChart3 className="w-10 h-10 text-amber-500" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Meu Desempenho
          </h1>
          
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Análise completa da sua evolução em <span className="text-amber-500 font-medium">tempo real</span>. 
            Acompanhe seu progresso por área e identifique oportunidades de melhoria.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Dados sincronizados automaticamente</span>
          </div>
        </motion.div>

        {/* Performance Analytics Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StudentPerformanceAnalytics />
        </motion.div>
      </div>
    </div>
  );
});

export default AlunoDesempenho;
