// ============================================
// CENTRAL DO ALUNO - DASHBOARD 2300
// GPU-ONLY animations via useQuantumReactivity
// ⚡ RealtimeCore v1.0.0 — PARTE 5
// ============================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, PlayCircle, Trophy, Target, Calendar, 
  Clock, TrendingUp, Star, Zap, Brain, Award, 
  Flame, Rocket, Sparkles, ChevronRight, Atom, Wifi, WifiOff
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { useRealtimeAlunos } from "@/hooks/useRealtimeCore";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

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
}

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

export default function AlunoDashboard() {
  const navigate = useNavigate();
  const { shouldAnimate } = useQuantumReactivity();
  const { container, item } = getGpuVariants(shouldAnimate);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // ============================================
  // ⚡ REALTIME CORE — PARTE 5
  // Assina tabelas do aluno filtradas por user_id
  // Tabelas: lesson_progress, user_gamification, study_flashcards, student_daily_goals
  // ============================================
  const { isConnected, state: realtimeState } = useRealtimeAlunos([
    {
      table: 'lesson_progress',
      event: '*',
      onEvent: () => {
        queryClient.invalidateQueries({ queryKey: ['lesson-progress'] });
      },
    },
    {
      table: 'user_gamification',
      event: '*',
      onEvent: () => {
        queryClient.invalidateQueries({ queryKey: ['user-gamification'] });
      },
    },
    {
      table: 'study_flashcards',
      event: '*',
      onEvent: () => {
        queryClient.invalidateQueries({ queryKey: ['study-flashcards'] });
      },
    },
    {
      table: 'student_daily_goals',
      event: '*',
      onEvent: () => {
        queryClient.invalidateQueries({ queryKey: ['daily-goals'] });
      },
    },
  ]);

  // Formatar timestamp do último evento
  const lastSyncTime = realtimeState.lastEventAt 
    ? realtimeState.lastEventAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;
  
  const [stats] = useState<StudyStats>({
    horasEstudadas: 47,
    aulasAssistidas: 32,
    questoesResolvidas: 456,
    acertos: 78,
    pontuacaoSimulado: 720,
    ranking: 15,
    diasConsecutivos: 12,
    xpTotal: 4500,
    nivel: 8,
    xpProximoNivel: 5000
  });

  const progressoGeral = 65;
  const xpProgresso = (stats.xpTotal / stats.xpProximoNivel) * 100;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* ⚡ Indicador de Sincronização Realtime — PARTE 5 */}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        {isConnected ? (
          <Wifi className="h-3 w-3 text-emerald-500" />
        ) : (
          <WifiOff className="h-3 w-3 text-destructive" />
        )}
        <span>
          {isConnected ? 'Sincronizado' : 'Desconectado'}
          {lastSyncTime && ` • ${lastSyncTime}`}
        </span>
      </div>
      
      {/* Header Hero Futurista */}
      <motion.div 
        {...(shouldAnimate ? { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 } } : {})}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-700 p-6 md:p-8 will-change-transform transform-gpu"
      >
        {/* Partículas decorativas */}
        <div className="absolute inset-0 overflow-hidden">
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
                  NÍVEL {stats.nivel} • CIENTISTA
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Olá, futuro(a) aprovado(a)! 🧪
              </h1>
              <p className="text-white/80 text-lg">
                A Química é a ciência das transformações. E você está se transformando!
              </p>
            </div>

            <div className="flex items-center gap-6">
              <motion.div 
                className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-1">
                  <Flame className="w-6 h-6 text-orange-400 animate-pulse" />
                  <span className="text-4xl font-black text-white">{stats.diasConsecutivos}</span>
                </div>
                <div className="text-xs text-white/70 font-medium">DIAS SEGUIDOS</div>
              </motion.div>

              <motion.div 
                className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-1">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <span className="text-4xl font-black text-white">{stats.xpTotal.toLocaleString()}</span>
                </div>
                <div className="text-xs text-white/70 font-medium">XP TOTAL</div>
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

      {/* Stats Cards Futuristas */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={item}>
          <Card className="stat-card stat-blue border-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 hover:shadow-glow-sm transition-all duration-300 group cursor-pointer"
            onClick={() => navigate('/aluno/videoaulas')}>
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
          <Card className="stat-card stat-purple border-0 bg-gradient-to-br from-purple-500/20 to-pink-500/10 hover:shadow-glow-sm transition-all duration-300 group cursor-pointer"
            onClick={() => navigate('/aluno/videoaulas')}>
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
          <Card className="stat-card stat-green border-0 bg-gradient-to-br from-emerald-500/20 to-green-500/10 hover:shadow-glow-sm transition-all duration-300 group cursor-pointer"
            onClick={() => navigate('/aluno/questoes')}>
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
          <Card className="stat-card stat-gold border-0 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 hover:shadow-glow-sm transition-all duration-300 group cursor-pointer"
            onClick={() => navigate('/aluno/ranking')}>
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
          <Card className="spider-card">
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
              {[
                { titulo: "Estequiometria - Cálculos", modulo: "Química Geral", progresso: 75, duracao: "45 min", emoji: "⚗️" },
                { titulo: "Reações Redox", modulo: "Eletroquímica", progresso: 0, duracao: "52 min", emoji: "⚡" },
                { titulo: "Funções Orgânicas", modulo: "Química Orgânica", progresso: 0, duracao: "38 min", emoji: "🧬" },
              ].map((aula, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted/80 transition-all duration-300 cursor-pointer group"
                  whileHover={{ x: 5 }}
                  onClick={() => navigate('/aluno/videoaulas')}
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
                onClick={() => navigate('/aluno/videoaulas')}
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
          <Card className="spider-card h-full">
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
              {[
                { nome: "Primeira Semana", icon: "🔥", desc: "7 dias seguidos", xp: "+100 XP" },
                { nome: "Mestre Estequio", icon: "⚗️", desc: "100% no módulo", xp: "+250 XP" },
                { nome: "Maratonista", icon: "🏃", desc: "5h em um dia", xp: "+150 XP" },
              ].map((conquista, index) => (
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
                onClick={() => navigate('/aluno/conquistas')}
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
        <Card className="spider-card overflow-hidden">
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
            
            <div className="flex justify-center mt-4">
              <Button 
                className="gap-2 px-8"
                onClick={() => navigate('/aluno/simulados')}
              >
                <Target className="w-4 h-4" />
                Fazer Novo Simulado
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: Brain, label: "Treino Rápido", desc: "15 questões", route: "/aluno/questoes", color: "from-purple-500/20 to-pink-500/20" },
          { icon: PlayCircle, label: "Aula do Dia", desc: "Recomendada", route: "/aluno/videoaulas", color: "from-blue-500/20 to-cyan-500/20" },
          { icon: Flame, label: "Revisão", desc: "Inteligente IA", route: "/aluno/revisao", color: "from-orange-500/20 to-red-500/20" },
          { icon: Trophy, label: "Metas", desc: "Ver progresso", route: "/aluno/metas", color: "from-green-500/20 to-emerald-500/20" },
        ].map((action, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={`cursor-pointer bg-gradient-to-br ${action.color} border-0 hover:shadow-lg transition-all duration-300`}
              onClick={() => navigate(action.route)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-background/50">
                  <action.icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
