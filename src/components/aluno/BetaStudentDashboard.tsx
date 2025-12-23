// ============================================
// JORNADA PREDITIVA BETA - SANTUÁRIO v9.0
// GPU-ONLY animations via useQuantumReactivity
// ============================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, PlayCircle, Trophy, Target, Calendar, 
  Clock, TrendingUp, Star, Zap, Brain, Award, 
  Flame, Rocket, Sparkles, ChevronRight, Atom,
  CheckCircle2, AlertCircle, Lightbulb, Heart,
  Timer, BarChart3, MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePerformanceFlags } from "@/hooks/usePerformanceFlags";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";

// Componentes de IA do Santuário v9.0
import { FocusTrack } from "./FocusTrack";
import { LearningStyleInsight } from "./LearningStyleInsight";
import { ChurnRiskAlert } from "./ChurnRiskAlert";
import { BestStudyTimeInsight } from "./BestStudyTimeInsight";
import { StudentCommandCenter } from "./StudentCommandCenter";
import { AdaptiveScheduler } from "./AdaptiveScheduler";

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
  const { shouldAnimate } = useQuantumReactivity();
  const { container, item } = getGpuVariants(shouldAnimate);
  const [stats] = useState<StudyStats>(mockStats);
  const [showMotivation, setShowMotivation] = useState(true);
  
  const progressoGeral = 65;
  const xpProgresso = (stats.xpTotal / stats.xpProximoNivel) * 100;

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

  // Mock de dados do usuário - será substituído por dados reais
  const mockUserData = {
    churnRiskScore: 0.3, // Baixo risco por padrão
    learningStyle: 'visual',
    bestStudyTime: '19:00 - 21:00',
    currentFocusAreaId: 'area-1'
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* ALERTA PREDITIVO DE IA: Só aparece se o risco for significativo */}
      <ChurnRiskAlert 
        riskScore={mockUserData.churnRiskScore} 
        userName={user?.email?.split('@')[0]} 
      />

      {/* Header Hero Futurista */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-700 p-6 md:p-8"
      >
        {/* Partículas decorativas - 🏛️ LEI I: Desligado em lite mode via CSS */}
        <div className="absolute inset-0 overflow-hidden perf-ambient-only">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl animate-float" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Atom className="w-6 h-6 text-cyan-300 animate-spin-slow" />
                <Badge className="bg-white/20 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  NÍVEL {stats.nivel} • {getNivelTitulo(stats.nivel).toUpperCase()}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {getGreeting()}, futuro(a) aprovado(a)! 🧪
              </h1>
              <p className="text-white/80 text-lg">
                A Química é a ciência das transformações. E você está se transformando!
              </p>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              <motion.div 
                className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-1">
                  <Flame className="w-6 h-6 text-orange-400 animate-pulse" />
                  <span className="text-3xl md:text-4xl font-black text-white">{stats.diasConsecutivos}</span>
                </div>
                <div className="text-xs text-white/70 font-medium">DIAS SEGUIDOS</div>
              </motion.div>

              <motion.div 
                className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-1">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <span className="text-3xl md:text-4xl font-black text-white">{stats.xpTotal.toLocaleString()}</span>
                </div>
                <div className="text-xs text-white/70 font-medium">XP TOTAL</div>
              </motion.div>

              <motion.div 
                className="hidden md:block text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-1">
                  <Timer className="w-6 h-6 text-cyan-300" />
                  <span className="text-3xl md:text-4xl font-black text-white">{stats.diasRestantes}</span>
                </div>
                <div className="text-xs text-white/70 font-medium">DIAS P/ ENEM</div>
              </motion.div>
            </div>
          </div>
          
          {/* Barra de XP para próximo nível */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80 flex items-center gap-2">
                <Rocket className="w-4 h-4" />
                Progresso para Nível {stats.nivel + 1}
              </span>
              <span className="text-white font-bold">{stats.xpTotal} / {stats.xpProximoNivel} XP</span>
            </div>
            <div className="relative">
              <Progress value={xpProgresso} className="h-4 bg-white/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white drop-shadow-lg">{Math.round(xpProgresso)}%</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

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

      {/* INSIGHTS DE IA SOBRE O ALUNO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-2 gap-4"
      >
        <LearningStyleInsight learningStyle={mockUserData.learningStyle} />
        <BestStudyTimeInsight bestTime={mockUserData.bestStudyTime} />
      </motion.div>

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
            onClick={() => navigate('/alunos/ranking')}>
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
                onClick={() => navigate('/alunos/desempenho')}
              >
                <TrendingUp className="w-4 h-4" />
                Ver Evolução
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
