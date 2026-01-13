// ============================================
// 🌌 BETA STUDENT DASHBOARD - YEAR 2300 CINEMATIC
// Ultra-Futuristic Iron Man HUD Experience
// 🔒 DADOS 100% REAIS - ZERO MOCKS - ZERO IA FAKE
// ============================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, PlayCircle, Trophy, Target, Calendar, 
  Clock, TrendingUp, Star, Zap, Brain, Award, 
  Flame, Rocket, Sparkles, ChevronRight,
  Timer, BarChart3, Shield, Hexagon, Activity, Wifi, Database, AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOptimizedAnimation, STAGGER_DISABLED } from "@/hooks/useOptimizedAnimation";
import { Skeleton } from "@/components/ui/skeleton";

// 🔒 HOOK DE DADOS REAIS - FONTE ÚNICA DA VERDADE
import { 
  useStudentDashboardData, 
  useDiasParaENEM,
  calcularXpProximoNivel,
  getTituloNivel 
} from "@/hooks/student/useStudentDashboardData";

// Import 2300 styles
import "@/styles/dashboard-2300.css";

// Widget de Ranking integrado no Dashboard
import { DashboardRankingWidget } from "./DashboardRankingWidget";

// 📅 Plano de Estudos ENEM 2030 (Dados Reais + IA)
import { StudyPlanENEM2030 } from "./StudyPlanENEM2030";

export function BetaStudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canUseDecorative } = useOptimizedAnimation();
  
  // 🔒 DADOS 100% REAIS DO BANCO DE DADOS
  const { data: dashboardData, isLoading, error } = useStudentDashboardData(user?.id);
  const diasParaENEM = useDiasParaENEM();
  
  // 🎬 OPTIMIZED: Stagger animations DISABLED per strategy
  const container = STAGGER_DISABLED.container;
  const item = STAGGER_DISABLED.item;

  // Mensagem de saudação baseada na hora (cálculo determinístico)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const firstName = user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Estudante';

  // Estado de carregamento - FLUID RESPONSIVE
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto p-4 md:p-6 space-y-6 sm:space-y-8">
          {/* Loading Hero */}
          <div className="dashboard-hero-2300 p-4 sm:p-6 md:p-8">
            <div className="space-y-4">
              <Skeleton className="h-8 sm:h-12 w-2/3 bg-white/10" />
              <Skeleton className="h-5 sm:h-6 w-1/2 bg-white/10" />
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 sm:mt-8">
                <Skeleton className="h-16 sm:h-24 rounded-2xl bg-white/10" />
                <Skeleton className="h-16 sm:h-24 rounded-2xl bg-white/10" />
                <Skeleton className="h-16 sm:h-24 rounded-2xl bg-white/10" />
              </div>
            </div>
          </div>
          {/* Loading Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 sm:h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Erro ao carregar dados</h2>
            <p className="text-muted-foreground">{error.message}</p>
            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🔒 DADOS REAIS - Se não houver dados, mostrar zeros (não inventar)
  const stats = {
    xpTotal: dashboardData?.xpTotal ?? 0,
    nivel: dashboardData?.nivel ?? 1,
    diasConsecutivos: dashboardData?.diasConsecutivos ?? 0,
    horasEstudadas: dashboardData?.horasEstudadas ?? 0,
    aulasCompletadas: dashboardData?.aulasCompletadas ?? 0,
    questoesResolvidas: dashboardData?.questoesResolvidas ?? 0,
    taxaAcerto: dashboardData?.taxaAcerto ?? 0,
  };
  
  const xpProximoNivel = calcularXpProximoNivel(stats.nivel);
  const xpProgresso = xpProximoNivel > 0 ? (stats.xpTotal / xpProximoNivel) * 100 : 0;

  return (
    <div className="min-h-screen">
      {/* 🌌 COSMIC BACKGROUND LAYER */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-holo-cyan/5 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-holo-purple/5 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/3 blur-[150px]" />
      </div>

      <div className="container mx-auto p-4 md:p-6 space-y-8">
        
        {/* 📅 PLANO DE ESTUDOS ENEM 2030 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StudyPlanENEM2030 />
        </motion.div>

        {/* 🚀 HERO SECTION - IRON MAN HUD - FLUID RESPONSIVE */}
        <div className="dashboard-hero-2300 p-4 sm:p-6 md:p-8 animate-optimized-fade-in">
          {/* Particles only on high-end devices */}
          {canUseDecorative && (
            <div className="particles-2300">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="particle"
                  style={{
                    left: `${20 + i * 25}%`,
                    animationDuration: `${5 + i}s`,
                    background: i % 2 === 0 ? 'hsl(185 100% 70%)' : 'hsl(280 100% 70%)',
                  }}
                />
              ))}
            </div>
          )}

          <div className="relative z-10">
            {/* Top Status Bar - FLUID RESPONSIVE */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative flex-shrink-0">
                  <Hexagon className="w-8 h-8 sm:w-10 sm:h-10 text-holo-cyan animate-pulse" style={{ animationDuration: '3s' }} />
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div>
                  <Badge className="bg-holo-cyan/20 text-holo-cyan border border-holo-cyan/30 backdrop-blur-sm text-[10px] sm:text-xs">
                    <Database className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    DADOS REAIS
                  </Badge>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/30 text-[10px] sm:text-xs">
                <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                <span className="truncate max-w-[120px] sm:max-w-none">NÍVEL {stats.nivel} • {getTituloNivel(stats.nivel).toUpperCase()}</span>
              </Badge>
            </div>

            {/* Main Hero Content - FLUID LAYOUT */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 lg:gap-8">
              <div className="space-y-2 sm:space-y-3 min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight break-words">
                  {getGreeting()}, <span className="bg-gradient-to-r from-holo-cyan via-holo-purple to-holo-pink bg-clip-text text-transparent">{firstName}</span>! 🧪
                </h1>
                <p className="text-white/70 text-base sm:text-lg max-w-xl">
                  A Química é a ciência das transformações. E você está se transformando em um <span className="text-holo-cyan font-semibold">mestre</span>!
                </p>
              </div>

              {/* Stat Orbs - 100% DADOS REAIS - FLUID RESPONSIVE */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:flex lg:items-center lg:gap-5 w-full lg:w-auto">
                <div className="stat-orb-2300 text-center min-w-0">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                    <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 flex-shrink-0" />
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white truncate">{stats.diasConsecutivos}</span>
                  </div>
                  <div className="text-[8px] sm:text-[10px] uppercase tracking-widest text-white/50 font-medium truncate">Dias Seguidos</div>
                </div>

                <div className="stat-orb-2300 text-center min-w-0">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 flex-shrink-0" />
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white truncate">{stats.xpTotal.toLocaleString()}</span>
                  </div>
                  <div className="text-[8px] sm:text-[10px] uppercase tracking-widest text-white/50 font-medium truncate">XP Total</div>
                </div>

                <div className="stat-orb-2300 text-center min-w-0">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                    <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-holo-cyan flex-shrink-0" />
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white truncate">{diasParaENEM}</span>
                  </div>
                  <div className="text-[8px] sm:text-[10px] uppercase tracking-widest text-white/50 font-medium truncate">Dias p/ ENEM</div>
                </div>
              </div>
            </div>
            
            {/* XP Progress Bar */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70 flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-holo-cyan" />
                  <span className="uppercase text-xs tracking-wider">Progresso para Nível {stats.nivel + 1}</span>
                </span>
                <span className="text-holo-cyan font-bold">{stats.xpTotal} / {xpProximoNivel} XP</span>
              </div>
              <div className="progress-energy-2300">
                <div 
                  className="fill bg-gradient-to-r from-holo-cyan via-holo-purple to-holo-pink"
                  style={{ width: `${Math.min(xpProgresso, 100)}%` }}
                />
              </div>
              <div className="text-center">
                <span className="text-sm font-bold text-white/80">{Math.round(xpProgresso)}% concluído</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - 100% DADOS REAIS - FLUID GRID */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
        >
          <motion.div variants={item}>
            <Card className="border-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 hover:shadow-lg transition-all duration-300 group cursor-pointer"
              onClick={() => navigate('/alunos/videoaulas')}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-black text-foreground">{stats.horasEstudadas}h</p>
                  <p className="text-sm text-muted-foreground font-medium">Horas de estudo</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-0 bg-gradient-to-br from-purple-500/20 to-pink-500/10 hover:shadow-lg transition-all duration-300 group cursor-pointer"
              onClick={() => navigate('/alunos/videoaulas')}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                    <PlayCircle className="w-6 h-6 text-purple-400" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-black text-foreground">{stats.aulasCompletadas}</p>
                  <p className="text-sm text-muted-foreground font-medium">Aulas completadas</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-0 bg-gradient-to-br from-emerald-500/20 to-green-500/10 hover:shadow-lg transition-all duration-300 group cursor-pointer"
              onClick={() => navigate('/alunos/questoes')}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                    <Brain className="w-6 h-6 text-emerald-400" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-black text-foreground">{stats.questoesResolvidas}</p>
                  <p className="text-sm text-muted-foreground font-medium">Questões resolvidas</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-0 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 hover:shadow-lg transition-all duration-300 group cursor-pointer"
              onClick={() => navigate('/alunos/questoes')}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                    <Target className="w-6 h-6 text-amber-400" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-black text-foreground">{stats.taxaAcerto}%</p>
                  <p className="text-sm text-muted-foreground font-medium">Taxa de acerto</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* RANKING INTEGRADO */}
        <motion.div
          id="ranking-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <DashboardRankingWidget />
        </motion.div>

        {/* AÇÕES RÁPIDAS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-primary/5" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-xl bg-green-500/20">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                Continue sua Jornada
              </CardTitle>
              <CardDescription>Sua evolução está em suas mãos</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 py-4">
                <Button 
                  size="lg" 
                  className="gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 w-full"
                  onClick={() => navigate('/alunos/videoaulas')}
                >
                  <PlayCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Assistir Aulas</span>
                </Button>
                <Button 
                  size="lg" 
                  className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 w-full"
                  onClick={() => navigate('/alunos/simulados')}
                >
                  <BarChart3 className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Fazer Simulado</span>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="gap-2 w-full"
                  onClick={() => navigate('/alunos/questoes')}
                >
                  <TrendingUp className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Ver Evolução</span>
                </Button>
              </div>
              
              {/* Metadados de auditoria (visível apenas em dev) */}
              {dashboardData?.fontesDados && dashboardData.fontesDados.length > 0 && (
                <div className="text-center mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Database className="w-3 h-3" />
                    Fontes: {dashboardData.fontesDados.join(', ')} • Atualizado: {new Date(dashboardData.dataCarregamento).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
