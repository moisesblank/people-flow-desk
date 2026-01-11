// ============================================
// 🌌 BETA STUDENT DASHBOARD - YEAR 2300 CINEMATIC
// Ultra-Futuristic Iron Man HUD Experience
// GPU-ONLY CSS Animations for Maximum Performance
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, PlayCircle, Trophy, Target, Calendar, 
  Clock, TrendingUp, Star, Zap, Brain, Award, 
  Flame, Rocket, Sparkles, ChevronRight, Atom,
  CheckCircle2, AlertCircle, Lightbulb, Heart,
  Timer, BarChart3, MessageCircle, Layers,
  Shield, Hexagon, Activity, Wifi
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePerformanceFlags } from "@/hooks/usePerformanceFlags";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { cn } from "@/lib/utils";

// GPU-ONLY variants
const getGpuVariants = (shouldAnimate: boolean) => ({
  container: {
    hidden: shouldAnimate ? { opacity: 0 } : {},
    show: shouldAnimate ? {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    } : {}
  },
  item: {
    hidden: shouldAnimate ? { opacity: 0, y: 20 } : {},
    show: shouldAnimate ? { opacity: 1, y: 0 } : {}
  }
});

// Import 2300 styles
import "@/styles/dashboard-2300.css";

// Componentes de IA do Santuário v9.0
import { FocusTrack } from "./FocusTrack";
import { LearningStyleInsight } from "./LearningStyleInsight";
import { ChurnRiskAlert } from "./ChurnRiskAlert";
import { BestStudyTimeInsight } from "./BestStudyTimeInsight";
import { StudentCommandCenter } from "./StudentCommandCenter";
import { AdaptiveScheduler } from "./AdaptiveScheduler";

// Widget de Ranking integrado no Dashboard
import { DashboardRankingWidget } from "./DashboardRankingWidget";

// Componente COMPLETO de Análise de Desempenho (idêntico ao /alunos/questoes)
import StudentPerformanceAnalytics from "./questoes/StudentPerformanceAnalytics";

// 📅 Plano de Estudos ENEM 2030 (Dados Reais + IA)
import { StudyPlanENEM2030 } from "./StudyPlanENEM2030";

// Tipos
interface StudyStats {
  horasEstudadas: number;
  aulasAssistidas: number;
  questoesResolvidas: number;
  acertos: number;
  pontuacaoSimulado: number;
  ranking: number;
  diasConsecutivos: number;
  xpTotal: number;
  nivel: number;
  xpProximoNivel: number;
  diasRestantes: number;
}

interface IARecommendation {
  tipo: 'aula' | 'revisao' | 'questao' | 'descanso';
  titulo: string;
  descricao: string;
  urgencia: 'alta' | 'media' | 'baixa';
  xpRecompensa: number;
  tempoEstimado: string;
  emoji: string;
}

// Mock de dados - será substituído por dados reais
const mockStats: StudyStats = {
  horasEstudadas: 47,
  aulasAssistidas: 32,
  questoesResolvidas: 456,
  acertos: 78,
  pontuacaoSimulado: 720,
  ranking: 15,
  diasConsecutivos: 12,
  xpTotal: 4500,
  nivel: 8,
  xpProximoNivel: 5000,
  diasRestantes: 180,
};

const mockRecommendations: IARecommendation[] = [
  {
    tipo: 'revisao',
    titulo: 'Estequiometria - Cálculos',
    descricao: 'Você errou 3 questões sobre mol. Vamos revisar!',
    urgencia: 'alta',
    xpRecompensa: 75,
    tempoEstimado: '20 min',
    emoji: '⚗️'
  },
  {
    tipo: 'aula',
    titulo: 'Reações Redox',
    descricao: 'Continue sua jornada em Eletroquímica',
    urgencia: 'media',
    xpRecompensa: 50,
    tempoEstimado: '52 min',
    emoji: '⚡'
  },
  {
    tipo: 'questao',
    titulo: 'Treino Rápido - Orgânica',
    descricao: '10 questões para fixar Funções Orgânicas',
    urgencia: 'media',
    xpRecompensa: 100,
    tempoEstimado: '15 min',
    emoji: '🧬'
  }
];

const proximasAulas = [
  { titulo: "Estequiometria - Cálculos", modulo: "Química Geral", progresso: 75, duracao: "45 min", emoji: "⚗️" },
  { titulo: "Reações Redox", modulo: "Eletroquímica", progresso: 0, duracao: "52 min", emoji: "⚡" },
  { titulo: "Funções Orgânicas", modulo: "Química Orgânica", progresso: 0, duracao: "38 min", emoji: "🧬" },
];

const conquistas = [
  { nome: "Primeira Semana", icon: "🔥", desc: "7 dias seguidos", xp: "+100 XP" },
  { nome: "Mestre Estequio", icon: "⚗️", desc: "100% no módulo", xp: "+250 XP" },
  { nome: "Maratonista", icon: "🏃", desc: "5h em um dia", xp: "+150 XP" },
];

export function BetaStudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const flags = usePerformanceFlags();
  const [stats] = useState<StudyStats>(mockStats);
  
  // Animation variants for staggered children
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  const progressoGeral = 65;
  const xpProgresso = (stats.xpTotal / stats.xpProximoNivel) * 100;

  // ============================================
  // ANÁLISE POR ÁREAS - Usa o componente COMPLETO
  // StudentPerformanceAnalytics (mesmo do /alunos/questoes)
  // ============================================

  // Mensagem motivacional personalizada
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getNivelTitulo = (nivel: number): string => {
    if (nivel < 5) return "Iniciante";
    if (nivel < 10) return "Estudante";
    if (nivel < 15) return "Cientista";
    if (nivel < 20) return "Mestre";
    return "Lenda";
  };

  // Mock de dados do usuário
  const mockUserData = {
    churnRiskScore: 0.3,
    learningStyle: 'visual',
    bestStudyTime: '19:00 - 21:00',
    currentFocusAreaId: 'area-1'
  };

  const firstName = user?.email?.split('@')[0] || 'Estudante';

  return (
    <div className="min-h-screen">
      {/* 🌌 COSMIC BACKGROUND LAYER */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-holo-cyan/5 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-holo-purple/5 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/3 blur-[150px]" />
      </div>

      <div className="container mx-auto p-4 md:p-6 space-y-8">
        {/* ALERTA PREDITIVO DE IA */}
        <ChurnRiskAlert 
          riskScore={mockUserData.churnRiskScore} 
          userName={firstName} 
        />

        {/* ============================================ */}
        {/* 📅 PLANO DE ESTUDOS ENEM 2030 - DADOS REAIS + IA */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StudyPlanENEM2030 />
        </motion.div>

        {/* ============================================ */}
        {/* 🚀 HERO SECTION - IRON MAN HUD ULTIMATE */}
        {/* ============================================ */}
        <div className="dashboard-hero-2300 p-6 md:p-8 animate-fade-in">
          {/* Floating Particles - CSS Only */}
          {flags.ui_ambient_fx && (
            <div className="particles-2300">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="particle"
                  style={{
                    left: `${15 + i * 15}%`,
                    animationDuration: `${4 + i * 0.5}s`,
                    animationDelay: `${i * 0.3}s`,
                    background: i % 2 === 0 ? 'hsl(185 100% 70%)' : 'hsl(280 100% 70%)',
                  }}
                />
              ))}
            </div>
          )}

          <div className="relative z-10">
            {/* Top Status Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Hexagon className="w-10 h-10 text-holo-cyan animate-pulse" style={{ animationDuration: '3s' }} />
                  <Activity className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div>
                  <Badge className="bg-holo-cyan/20 text-holo-cyan border border-holo-cyan/30 backdrop-blur-sm">
                    <Wifi className="w-3 h-3 mr-1 animate-pulse" />
                    SISTEMA ATIVO
                  </Badge>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/30">
                <Shield className="w-3 h-3 mr-1" />
                NÍVEL {stats.nivel} • {getNivelTitulo(stats.nivel).toUpperCase()}
              </Badge>
            </div>

            {/* Main Hero Content */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="space-y-3">
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                  {getGreeting()}, <span className="bg-gradient-to-r from-holo-cyan via-holo-purple to-holo-pink bg-clip-text text-transparent">{firstName}</span>! 🧪
                </h1>
                <p className="text-white/70 text-lg max-w-xl">
                  A Química é a ciência das transformações. E você está se transformando em um <span className="text-holo-cyan font-semibold">mestre</span>!
                </p>
              </div>

              {/* Stat Orbs - Floating Metrics */}
              <div className="flex items-center gap-4 md:gap-5">
                <div className="stat-orb-2300 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Flame className="w-6 h-6 text-orange-400" />
                    <span className="text-3xl md:text-4xl font-black text-white">{stats.diasConsecutivos}</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50 font-medium">Dias Seguidos</div>
                </div>

                <div className="stat-orb-2300 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    <span className="text-3xl md:text-4xl font-black text-white">{stats.xpTotal.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50 font-medium">XP Total</div>
                </div>

                <div className="stat-orb-2300 text-center hidden md:block">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Timer className="w-6 h-6 text-holo-cyan" />
                    <span className="text-3xl md:text-4xl font-black text-white">{stats.diasRestantes}</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50 font-medium">Dias p/ ENEM</div>
                </div>
              </div>
            </div>
            
            {/* XP Progress Bar - Energy Flow */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70 flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-holo-cyan" />
                  <span className="uppercase text-xs tracking-wider">Progresso para Nível {stats.nivel + 1}</span>
                </span>
                <span className="text-holo-cyan font-bold">{stats.xpTotal} / {stats.xpProximoNivel} XP</span>
              </div>
              <div className="progress-energy-2300">
                <div 
                  className="fill bg-gradient-to-r from-holo-cyan via-holo-purple to-holo-pink"
                  style={{ width: `${xpProgresso}%` }}
                />
              </div>
              <div className="text-center">
                <span className="text-sm font-bold text-white/80">{Math.round(xpProgresso)}% concluído</span>
              </div>
            </div>
          </div>
        </div>

        {/* A TRILHA DE FOCO: O CORAÇÃO DA EXPERIÊNCIA v9.0 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <FocusTrack 
          userId={user?.id || ''} 
          currentFocusAreaId={mockUserData.currentFocusAreaId} 
        />
      </motion.div>

      {/* INSIGHTS DE IA SOBRE O ALUNO - Removido: LearningStyleInsight e BestStudyTimeInsight */}

      {/* Recomendações da IA (mantido do original) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="border-purple-500/30 bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Brain className="w-5 h-5 text-white" />
              </div>
              🎯 Recomendações Personalizadas da IA
            </CardTitle>
            <CardDescription>Baseado no seu desempenho e padrões de estudo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {mockRecommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  className={`p-4 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${
                    rec.urgencia === 'alta' 
                      ? 'bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20' 
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={() => navigate('/alunos/videoaulas')}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{rec.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{rec.titulo}</h4>
                        {rec.urgencia === 'alta' && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Prioridade
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{rec.descricao}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rec.tempoEstimado}
                        </span>
                        <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50">
                          <Zap className="w-3 h-3 mr-1" />
                          +{rec.xpRecompensa} XP
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards Futuristas */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
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
                <p className="text-3xl font-black text-foreground">{stats.aulasAssistidas}</p>
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
            onClick={() => {
              // Scroll para seção de ranking integrada
              document.getElementById('ranking-section')?.scrollIntoView({ behavior: 'smooth' });
            }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                  <Trophy className="w-6 h-6 text-amber-400" />
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-black text-foreground">#{stats.ranking}</p>
                <p className="text-sm text-muted-foreground font-medium">Posição no ranking</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ============================================ */}
      {/* SEÇÃO ANÁLISE POR ÁREAS - COMPONENTE COMPLETO */}
      {/* Mesmo que /alunos/questoes - SINCRONIZADO SEMPRE */}
      {/* ============================================ */}
      <motion.div
        id="performance-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <StudentPerformanceAnalytics />
      </motion.div>

      {/* ============================================ */}
      {/* SEÇÃO RANKING INTEGRADO - PANTEÃO DOS CAMPEÕES */}
      {/* ============================================ */}
      <motion.div
        id="ranking-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <DashboardRankingWidget />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Próximas Aulas */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-xl bg-primary/20">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                Continue de onde parou
              </CardTitle>
              <CardDescription>Suas próximas aulas recomendadas pela IA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {proximasAulas.map((aula, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted/80 transition-all duration-300 cursor-pointer group"
                  whileHover={{ x: 5 }}
                  onClick={() => navigate('/alunos/videoaulas')}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl">
                    {aula.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{aula.titulo}</h4>
                    <p className="text-sm text-muted-foreground">{aula.modulo}</p>
                    {aula.progresso > 0 && (
                      <Progress value={aula.progresso} className="h-1.5 mt-2" />
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={aula.progresso > 0 ? "default" : "secondary"} className="font-medium">
                      {aula.progresso > 0 ? `${aula.progresso}%` : "Novo"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {aula.duracao}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.div>
              ))}
              <Button 
                className="w-full mt-2 gap-2" 
                variant="outline"
                onClick={() => navigate('/alunos/videoaulas')}
              >
                <PlayCircle className="w-4 h-4" />
                Ver todas as aulas
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Conquistas Recentes */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-xl bg-amber-500/20">
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
                Conquistas
              </CardTitle>
              <CardDescription>Suas medalhas recentes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {conquistas.map((conquista, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-3xl">{conquista.icon}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{conquista.nome}</p>
                    <p className="text-xs text-muted-foreground">{conquista.desc}</p>
                  </div>
                  <Badge variant="outline" className="text-amber-400 border-amber-400/50 text-xs">
                    {conquista.xp}
                  </Badge>
                </motion.div>
              ))}
              <Button 
                variant="outline" 
                className="w-full mt-2 gap-2"
                onClick={() => navigate('/alunos/conquistas')}
              >
                <Trophy className="w-4 h-4" />
                Ver todas as conquistas
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance no Simulado */}
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
              Sua Performance nos Simulados
            </CardTitle>
            <CardDescription>Evolução baseada na TRI do ENEM</CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-wrap items-center justify-center gap-8 py-6">
              <motion.div 
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  {stats.pontuacaoSimulado}
                </div>
                <p className="text-sm text-muted-foreground font-medium mt-1">Última Nota TRI</p>
              </motion.div>
              
              <div className="h-16 w-px bg-border hidden md:block" />
              
              <motion.div 
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                  {stats.acertos}%
                </div>
                <p className="text-sm text-muted-foreground font-medium mt-1">Taxa de Acertos</p>
              </motion.div>
              
              <div className="h-16 w-px bg-border hidden md:block" />
              
              <motion.div 
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-10 h-10 md:w-12 md:h-12 text-amber-400 fill-amber-400" />
                  <span className="text-5xl md:text-6xl font-black text-foreground">
                    {stats.nivel}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground font-medium mt-1">Seu Nível</p>
              </motion.div>
            </div>
            
            <div className="flex justify-center gap-4 mt-4">
              <Button 
                size="lg" 
                className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                onClick={() => navigate('/alunos/simulados')}
              >
                <BarChart3 className="w-4 h-4" />
                Fazer Simulado
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2"
                onClick={() => {
                  // Scroll para seção de performance integrada
                  document.getElementById('performance-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <TrendingUp className="w-4 h-4" />
                Ver Evolução
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </div>
  );
}
